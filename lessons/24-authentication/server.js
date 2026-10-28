// Starts the library API so you can try it in a browser or with curl.
// Run it from the repo root: node lessons/24-authentication/server.js
// Stop it with Ctrl+C.
import { createApp } from './exercises/03-auth-api.js';

const port = process.env.PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
	console.log(`Library API running at http://localhost:${port}`);
});
