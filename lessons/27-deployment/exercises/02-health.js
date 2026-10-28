// createApp({ db, config })
// Returns an Express app (never call listen here; server.js does that).
// GET /health tells a host whether this server is working. It needs no log-in.
//   Run `SELECT 1` through db.query. When it works, respond 200 with { status: 'ok', env: config.nodeEnv }.
//   When db.query rejects, respond 503 with { status: 'unavailable' }. Do not put the database error in the response.
//   Both responses send the header Cache-Control: no-store.
// Any other path responds 404 with { error: 'Not found' }.
// db is anything with query(sql, params) that resolves to { rows }: a pg pool in production, PGlite in tests.
import express from 'express';

export function createApp({ db, config }) {
	const app = express();
	// TODO
	return app;
}
