// Starts the Notes API so you can try it in a browser or with curl.
// Run it from the repo root: node lessons/13-express/server.js
// Stop it with Ctrl+C.
import { createApp } from './exercises/01-notes-api.js';

const port = process.env.PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
	console.log(`Notes API running at http://localhost:${port}`);
});
