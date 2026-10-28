// Runs the library app by hand with an in-memory Postgres (PGlite), seeded with sample data.
// Everything resets when you stop it. Playwright starts this file for you (see e2e/playwright.config.js).
// Run it with: node lessons/26-testing-the-stack/project/server/dev.js
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createApp } from './app.js';
import { hashPassword } from './passwords.js';

const db = new PGlite();
await db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));

await db.query('INSERT INTO members (name, email, password_hash) VALUES ($1, $2, $3)', [
	'Ada Lovelace',
	'ada@example.com',
	await hashPassword('correct-horse-battery'),
]);
await db.exec(`
	INSERT INTO books (title, author, year) VALUES
		('Kindred', 'Octavia E. Butler', 1979),
		('The Left Hand of Darkness', 'Ursula K. Le Guin', 1969),
		('Beloved', 'Toni Morrison', 1987)
`);

const port = Number(process.env.PORT ?? 3000);
createApp(db).listen(port, () => {
	console.log(`Library API on http://localhost:${port}/api/books`);
	console.log('Log in with ada@example.com and correct-horse-battery');
});
