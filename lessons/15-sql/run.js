// Runs SQL against a fresh copy of the bookstore database.
//   node lessons/15-sql/run.js                          opens a prompt. End each statement with ;
//   node lessons/15-sql/run.js path/to/query.sql        runs a file
//   node lessons/15-sql/run.js "SELECT * FROM books;"   runs the SQL you pass
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const db = new PGlite();
await db.exec(readFileSync(new URL('./bookstore.sql', import.meta.url), 'utf8'));

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
		console.log(`ERROR: ${error.message}\n`);
	}
}

const arg = process.argv[2];
if (arg) {
	await run(arg.endsWith('.sql') ? readFileSync(arg, 'utf8') : arg);
} else {
	console.log('Connected to a fresh bookstore database. End each statement with ; and press Ctrl+D to quit.\n');
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	let pending = '';
	prompt.setPrompt('bookstore=> ');
	prompt.prompt();
	for await (const line of prompt) {
		pending += `${line}\n`;
		if (line.trim().endsWith(';')) {
			await run(pending);
			pending = '';
		}
		prompt.setPrompt(pending ? 'bookstore-> ' : 'bookstore=> ');
		prompt.prompt();
	}
}
await db.close();
