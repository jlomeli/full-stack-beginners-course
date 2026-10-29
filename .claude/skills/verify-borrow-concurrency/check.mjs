// Proves borrowBook keeps one open loan per book under concurrent requests, for the borrowBook in a given library.js.
// Usage: node .claude/skills/verify-borrow-concurrency/check.mjs [path/to/library.js] [path/to/schema.sql]
// Defaults: the reference solution in ../full-stack-beginners-course-solutions and lesson 17's schema.sql.
// Exit 0: every property holds. Exit 1: a property fails (trace printed). Exit 2: the code no longer matches the model.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { check } from './model.mjs';

const course = resolve(import.meta.dirname, '../../..');
const libraryPath = resolve(process.argv[2] ?? join(course, '../full-stack-beginners-course-solutions/lessons/17-node-and-postgres/project/library.js'));
const schemaPath = resolve(process.argv[3] ?? join(course, 'lessons/17-node-and-postgres/schema.sql'));

const source = readFileSync(libraryPath, 'utf8');
const schema = readFileSync(schemaPath, 'utf8');
const outOfSync = (why) => {
	console.error(`OUT OF SYNC  ${why}\nThe model in model.mjs assumes the borrowBook shape described at its top. Re-read borrowBook and update the model before trusting a result.`);
	process.exit(2);
};

const start = source.indexOf('export async function borrowBook');
if (start === -1) outOfSync(`no "export async function borrowBook" in ${libraryPath}`);
const end = source.indexOf('\nexport ', start + 1);
const body = source.slice(start, end === -1 ? undefined : end);
const lineOf = (offset) => source.slice(0, start + offset).split('\n').length;

const queries = [...body.matchAll(/\b(\w+)\.query\(\s*[`'"]([^`'"]*)/g)].map((m) => ({ runner: m[1], sql: m[2].replace(/\s+/g, ' '), line: lineOf(m.index) }));
const find = (pattern) => queries.findIndex((q) => pattern.test(q.sql));
const bookSelect = find(/^SELECT .* FROM books\b/i);
const openCheck = find(/FROM loans\b.*returned_at IS NULL/i);
const insert = find(/^INSERT INTO loans\b/i);
if (openCheck === -1) outOfSync('borrowBook has no SELECT on loans with returned_at IS NULL');
if (insert === -1) outOfSync('borrowBook has no INSERT INTO loans');
if (openCheck > insert) outOfSync('borrowBook inserts before it checks for an open loan');
if (bookSelect !== -1 && bookSelect > openCheck) outOfSync('borrowBook reads the book after the open-loan check');
if (queries.length > 4) outOfSync(`borrowBook runs ${queries.length} queries; the model knows lock, member, check, insert`);

const runners = new Set(queries.map((q) => q.runner));
if (runners.size > 1) outOfSync(`borrowBook mixes query runners (${[...runners].join(', ')}); the model covers all-in-one-transaction or no transaction`);
const tx = /withTransaction\(/.test(body) && !runners.has('db');
const lock = bookSelect !== -1 && /FOR (NO KEY )?UPDATE/i.test(queries[bookSelect].sql);
const index = /CREATE UNIQUE INDEX[^;]*ON loans\s*\(\s*book_id\s*\)\s*WHERE\s+returned_at IS NULL/i.test(schema);

console.log(`borrowBook in ${libraryPath}`);
for (const q of queries) console.log(`  line ${q.line}  ${q.runner}.query  ${q.sql.slice(0, 70)}`);
console.log(`Derived: transaction=${tx}  row lock=${lock}  partial unique index=${index} (from ${schemaPath})`);

const config = { tx, lock, index, borrowers: Number(process.env.BORROWERS ?? 3), returns: Number(process.env.RETURNS ?? 2) };
const result = check(config);
console.log(`Bounds: ${config.borrowers} concurrent borrows of one book, up to ${config.returns} returns. ${result.states} states explored.`);
if (result.ok) {
	console.log('PASS  OneOpenLoanPerBook, NoRawUniqueViolation, NoStuckRequest hold in every interleaving.');
	process.exit(0);
}
console.log(`FAIL  ${result.property}: ${result.statement}\nShortest path to the violation:`);
result.trace.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
process.exit(1);
