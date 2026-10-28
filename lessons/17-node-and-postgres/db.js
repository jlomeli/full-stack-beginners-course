// Helpers for talking to the database. This file is finished. You do not change it.
//
// Every function in this lesson takes a `db` argument that has a query(sql, params) method.
// That method resolves to { rows }. A real pg Pool has it, and so does a PGlite database,
// which is what the tests use. Code written against `db` works with both.
import { readFileSync } from 'node:fs';

// Creates the lesson's tables if they do not exist yet.
export async function applySchema(db) {
	await db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
}

// Runs work(tx) inside a transaction. Inside work, run every query through tx, never through db.
// If work throws, every change it made is undone and the error is rethrown. If it returns, the changes are saved.
export async function withTransaction(db, work) {
	if (typeof db.transaction === 'function') {
		// PGlite.
		return db.transaction(work);
	}
	// A pg Pool. A transaction must stay on one connection, so borrow one.
	const client = await db.connect();
	try {
		await client.query('BEGIN');
		const result = await work(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}
