// Starts the sample app so you can try it in a browser or with curl.
// Run it from the repo root, with the secret in an environment variable:
//   ADMIN_KEY=change-me node lessons/25-web-security/server.js
// or put ADMIN_KEY in lessons/25-web-security/.env and run:
//   node --env-file=lessons/25-web-security/.env lessons/25-web-security/server.js
// Stop it with Ctrl+C.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createApp } from './exercises/01-vulnerable-app.js';

const port = process.env.PORT ?? 3000;
const db = new PGlite();
await db.exec(readFileSync(new URL('./library.sql', import.meta.url), 'utf8'));

createApp(db, process.env).listen(port, () => {
	console.log(`Sample app running at http://localhost:${port}`);
});
