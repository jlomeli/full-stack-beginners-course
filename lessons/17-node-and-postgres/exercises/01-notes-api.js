// The Notes API from lesson 14. It works, but it keeps the notes in an array, so they vanish when the server stops.
// Move the notes into the `notes` table in Postgres.
//
// What to change:
//   - createApp takes the database: createApp(db). Use db.query(sql, params) for every query.
//   - Delete the `notes` array and `nextId`. The table is the only place notes live.
//   - Make the handlers async. Express 5 sends an error to your error handler when an async handler throws.
//   - Pass every value from the request as a parameter ($1, $2, ...). Never put request data inside the SQL text.
//
// The table (see ../schema.sql):
//   notes (id, title, body, created_at)
//
// The API must keep behaving the same way. A note looks like { id, title, body, createdAt } in JSON.
// createdAt is an ISO 8601 string. In SQL, rename the column: created_at AS "createdAt".
//
//   GET    /notes?search=text   200 and an array of notes, oldest first.
//                               With search, only notes whose title or body contains the text, ignoring case.
//   GET    /notes/:id           200 and the note, or 404 { error } when there is no such note.
//                               An id that is not a whole number, such as /notes/abc, is also a 404.
//   POST   /notes               Body { title, body? }. 201 and the new note.
//                               title is a string with something other than spaces in it.
//                               body is an optional string and defaults to ''.
//                               Anything else is 400 { error }, and nothing is saved.
//   DELETE /notes/:id           204 with no body, or 404 { error }.
//
// Any unexpected error, such as the database being down, is 500 { error: 'Internal server error' }.
// The response must not include the error's message.
import express from 'express';

export function createApp() {
	const app = express();
	app.use(express.json());

	const notes = [];
	let nextId = 1;

	app.get('/notes', (req, res) => {
		const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
		const matches = notes.filter((note) => note.title.toLowerCase().includes(search) || note.body.toLowerCase().includes(search));
		res.json(matches);
	});

	app.get('/notes/:id', (req, res) => {
		const note = notes.find((candidate) => candidate.id === Number(req.params.id));
		if (!note) return res.status(404).json({ error: 'Note not found' });
		res.json(note);
	});

	app.post('/notes', (req, res) => {
		const { title, body = '' } = req.body ?? {};
		if (typeof title !== 'string' || title.trim() === '' || typeof body !== 'string') {
			return res.status(400).json({ error: 'A note needs a title, and body must be text' });
		}
		const note = { id: nextId++, title, body, createdAt: new Date().toISOString() };
		notes.push(note);
		res.status(201).json(note);
	});

	app.delete('/notes/:id', (req, res) => {
		const index = notes.findIndex((candidate) => candidate.id === Number(req.params.id));
		if (index === -1) return res.status(404).json({ error: 'Note not found' });
		notes.splice(index, 1);
		res.status(204).end();
	});

	app.use((error, req, res, next) => {
		res.status(500).json({ error: 'Internal server error' });
	});

	return app;
}
