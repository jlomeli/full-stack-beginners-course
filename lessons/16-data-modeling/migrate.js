// Applies the numbered .sql files in a folder to a database, oldest first.
// It remembers what it has applied in a table called schema_migrations, so running it twice is safe.
// Each file runs inside a transaction: if one statement fails, the whole file is undone and not recorded.
// This file is finished. You do not change it.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function migrate(db, directory) {
	await db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)
	`);
	const { rows } = await db.query('SELECT name FROM schema_migrations');
	const alreadyApplied = new Set(rows.map((row) => row.name));

	const files = readdirSync(directory)
		.filter((file) => file.endsWith('.sql'))
		.sort();

	const applied = [];
	for (const file of files) {
		if (alreadyApplied.has(file)) continue;
		await db.transaction(async (tx) => {
			await tx.exec(readFileSync(join(directory, file), 'utf8'));
			await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
		});
		applied.push(file);
	}
	return applied;
}
