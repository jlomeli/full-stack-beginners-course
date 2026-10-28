// Applies your migrations to a fresh in-memory database, then lets you run SQL against it.
//   node lessons/16-data-modeling/run.js                          opens a prompt. End each statement with ;
//   node lessons/16-data-modeling/run.js path/to/query.sql        runs a file
//   node lessons/16-data-modeling/run.js "SELECT * FROM books;"   runs the SQL you pass
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { migrate } from './migrate.js';

const db = new PGlite();
const applied = await migrate(db, new URL('./exercises/migrations/', import.meta.url).pathname);
console.log(`Applied ${applied.length} migrations: ${applied.join(', ')}\n`);

async function run(sql) {
	try {
		for (const result of await db.exec(sql)) {
			if (result.fields.length > 0) {
				console.table(result.rows);
				console.log(`(${result.rows.length} rows)\n`);
			} else if (result.affectedRows !== undefined) {
				console.log(`OK, ${result.affectedRows} rows changed\n`);
			}
		}
	} catch (error) {
		console.log(`ERROR (${error.code}): ${error.message}\n`);
	}
}

const arg = process.argv[2];
if (arg) {
	await run(arg.endsWith('.sql') ? readFileSync(arg, 'utf8') : arg);
} else {
	console.log('Connected to a fresh library database. End each statement with ; and press Ctrl+D to quit.\n');
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	let pending = '';
	prompt.setPrompt('library=> ');
	prompt.prompt();
	for await (const line of prompt) {
		pending += `${line}\n`;
		if (line.trim().endsWith(';')) {
			await run(pending);
			pending = '';
		}
		prompt.setPrompt(pending ? 'library-> ' : 'library=> ');
		prompt.prompt();
	}
}
await db.close();
