import express from 'express';
import { z } from 'zod';

// Where notes are kept. Every method is async, like a database client would be,
// so the routes work the same when the notes move into PostgreSQL.
//
// You don't change this function.
// - list()              resolves to an array with every note, oldest first
// - get(id)             resolves to the note, or undefined when there is none
// - create(input)       stores a new note and resolves to it
// - update(id, input)   replaces the note's title and body and resolves to it, or undefined when there is none
// - remove(id)          deletes the note and resolves to true, or false when there is none
export function createMemoryStore() {
	const notes = [];
	let nextId = 1;

	return {
		async list() {
			return [...notes];
		},
		async get(id) {
			return notes.find((note) => note.id === id);
		},
		async create(input) {
			const note = { ...input, id: nextId, createdAt: new Date().toISOString() };
			nextId += 1;
			notes.push(note);
			return note;
		},
		async update(id, input) {
			const note = notes.find((candidate) => candidate.id === id);
			if (!note) return undefined;
			return Object.assign(note, input, { id: note.id, createdAt: note.createdAt });
		},
		async remove(id) {
			const index = notes.findIndex((note) => note.id === id);
			if (index === -1) return false;
			notes.splice(index, 1);
			return true;
		},
	};
}

// What a client may send to create or replace a note, as a zod schema.
// - title: a string. Trim the spaces off both ends, then it must have 1 to 100 characters.
// - body: a string of at most 1000 characters. When the client leaves it out, it is ''.
// Anything else in the request body is dropped, so a client can't set id or createdAt.
// TODO: replace this empty schema with the real one.
const noteInput = z.object({});

// Return a middleware that checks req.body against a zod schema.
// - Valid: replace req.body with the parsed result (trimmed, defaults filled, extra keys gone) and call next().
// - Invalid: respond 400 with every problem at once, and do not call next():
//     {
//       error: 'Validation failed',
//       details: [{ field: 'title', message: 'Too small: expected string to have >=1 characters' }]
//     }
//   field is the path to the bad value joined with dots, and '' when the whole body is wrong
//   (for example when the client sent no JSON at all, so req.body is undefined).
//   message is the issue's message from zod.
function validateBody(schema) {
	return (req, res, next) => {
		// TODO: replace this pass-through with the validation
		next();
	};
}

// A note id in a URL is a whole number of 1 or more, written without a sign, a decimal point, or an exponent.
const noteId = z.string().regex(/^[1-9]\d*$/);

// Build the Notes API and return the Express app. Don't call listen here: server.js does that.
// Pass { store } to use your own store. The default is a new in-memory store for each app.
//
// Besides the five routes, the app must:
// - Answer 400 with { error: 'Invalid note id' } when :id in a URL isn't a valid note id.
// - Answer 404 with { error: 'Route not found' } for any URL no route matches.
// - Answer 400 with { error: 'Request body is not valid JSON' } when the client sends malformed JSON.
// - Answer 413 with { error: 'Request body is too large' } when the body is over express.json's limit.
// - Answer 500 with { error: 'Internal server error' } when anything else goes wrong, such as a store that rejects.
//   Send nothing else to the client: no message, no stack. Log the error with console.error.
export function createApp({ store = createMemoryStore() } = {}) {
	const app = express();

	app.use(express.json());

	// TODO: check the :id of every route that has one, with app.param

	app.get('/notes', async (req, res) => {
		res.json(await store.list());
	});

	app.post('/notes', validateBody(noteInput), async (req, res) => {
		res.status(201).json(await store.create(req.body));
	});

	app.get('/notes/:id', async (req, res) => {
		const note = await store.get(Number(req.params.id));
		if (!note) {
			res.status(404).json({ error: 'Note not found' });
			return;
		}
		res.json(note);
	});

	app.put('/notes/:id', validateBody(noteInput), async (req, res) => {
		const note = await store.update(Number(req.params.id), req.body);
		if (!note) {
			res.status(404).json({ error: 'Note not found' });
			return;
		}
		res.json(note);
	});

	app.delete('/notes/:id', async (req, res) => {
		const removed = await store.remove(Number(req.params.id));
		if (!removed) {
			res.status(404).json({ error: 'Note not found' });
			return;
		}
		res.status(204).end();
	});

	// TODO: answer URLs that no route matched

	// TODO: add the error-handling middleware

	return app;
}
