// Runs one of this lesson's APIs so you can try it with a browser or curl.
//   node lessons/17-node-and-postgres/server.js notes     the Notes API from exercise 1
//   node lessons/17-node-and-postgres/server.js library   the library API from the project
// Data is saved in lessons/17-node-and-postgres/.data, so it survives a restart.
// Delete that folder to start over. Stop the server with Ctrl+C.
import { PGlite } from '@electric-sql/pglite';
import { applySchema } from './db.js';

const which = process.argv[2];
if (which !== 'notes' && which !== 'library') {
	console.error('Usage: node lessons/17-node-and-postgres/server.js notes|library');
	process.exit(1);
}

const db = new PGlite(new URL('./.data', import.meta.url).pathname);
await applySchema(db);

let app;
if (which === 'notes') {
	const { createApp } = await import('./exercises/01-notes-api.js');
	app = createApp(db);
} else {
	const { createApp } = await import('./project/app.js');
	app = createApp(db);
	const { rows } = await db.query('SELECT 1 FROM books LIMIT 1');
	if (rows.length === 0) {
		await db.exec(`
			INSERT INTO books (title, author, year) VALUES
				('Kindred', 'Octavia E. Butler', 1979),
				('Beloved', 'Toni Morrison', 1987),
				('Americanah', 'Chimamanda Ngozi Adichie', 2013);
			INSERT INTO members (name, email) VALUES
				('Ada Lovelace', 'ada@example.com'),
				('Grace Hopper', 'grace@example.com');
		`);
	}
}

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`${which} API running at http://localhost:${port}`);
});
