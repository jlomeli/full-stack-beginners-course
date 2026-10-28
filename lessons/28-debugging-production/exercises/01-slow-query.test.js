import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { OPEN_LOANS_FOR_MEMBER_SQL } from './01-slow-query.js';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

let db;

beforeAll(async () => {
	db = new PGlite();
	await db.exec(read('./schema.sql'));
	await db.exec(read('./seed.sql'));
	await db.exec(read('./01-indexes.sql'));
	await db.exec('ANALYZE');
}, 60_000);

function* planNodes(node) {
	yield node;
	for (const child of node.Plans ?? []) yield* planNodes(child);
}

async function explain(memberId) {
	const { rows } = await db.query(`EXPLAIN (FORMAT JSON) ${OPEN_LOANS_FOR_MEMBER_SQL}`, [memberId]);
	const plan = rows[0]['QUERY PLAN'];
	return [...planNodes((Array.isArray(plan) ? plan : JSON.parse(plan))[0].Plan)];
}

describe('open loans for a member', () => {
	test('returns that member\'s open loans, oldest first', async () => {
		const { rows } = await db.query(OPEN_LOANS_FOR_MEMBER_SQL, [10]);
		expect(rows).toHaveLength(10);
		const times = rows.map((row) => new Date(row.borrowedAt).getTime());
		expect(times).toEqual([...times].sort((a, b) => a - b));
		expect(rows[0]).toEqual({ id: expect.any(Number), bookId: expect.any(Number), title: expect.stringMatching(/^Book /), borrowedAt: expect.anything() });
	});

	test('does not read the whole loans table (no sequential scan on loans in the query plan)', async () => {
		const nodes = await explain(10);
		const scans = nodes.filter((node) => node['Relation Name'] === 'loans').map((node) => `${node['Node Type']} on loans`);
		expect(scans, `The plan scans loans like this: ${scans.join(', ')}. Add an index.`).not.toContain('Seq Scan on loans');
	});

	test('finds the loans through an index you created, not through the primary key', async () => {
		const nodes = await explain(10);
		const indexNames = nodes.map((node) => node['Index Name']).filter(Boolean);
		const mine = indexNames.filter((name) => name !== 'loans_pkey' && name !== 'books_pkey');
		expect(mine.length, `The plan uses these indexes: ${indexNames.join(', ') || 'none'}`).toBeGreaterThan(0);
	});
});
