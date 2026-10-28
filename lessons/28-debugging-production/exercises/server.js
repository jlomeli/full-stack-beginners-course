// Runs the sample app by hand on an in-memory Postgres (PGlite) with the sample data. Everything resets when you stop it.
//   node lessons/28-debugging-production/exercises/server.js
// Then, in another terminal:
//   curl -i localhost:3000/api/members/10/loans/open
//   curl -i -X POST localhost:3000/api/loans/20001/return      (loan 20001 belongs to wren@bounce.example)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createApp } from './03-app.js';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

const db = new PGlite();
await db.exec(read('./schema.sql'));
await db.exec(read('./seed.sql'));
await db.exec(read('./01-indexes.sql'));
await db.exec(`
	INSERT INTO members (name, email) VALUES ('Wren', 'wren@bounce.example');
	INSERT INTO loans (book_id, member_id, borrowed_at) VALUES (1, 201, now() - interval '20 days');
`);
await db.exec('ANALYZE');

const port = Number(process.env.PORT ?? 3000);
createApp(db).listen(port, () => console.log(`Sample app on http://localhost:${port}`));
