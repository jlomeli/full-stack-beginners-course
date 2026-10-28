import express from 'express';
import { fileURLToPath } from 'node:url';

// The folder with index.html, as a path on your computer. express.static needs it.
const publicDir = fileURLToPath(new URL('./public', import.meta.url));

// Build the Notes API and return the Express app. Don't call listen here: server.js does that.
//
// A note looks like { id, title, body, createdAt }.
// - id is a number. The first note gets 1, the next 2, and so on.
// - title and body come from the JSON request body.
// - createdAt is the time the note was created, as an ISO string: new Date().toISOString()
//
// Each call to createApp starts with its own empty list of notes.
//
// Middleware:
// - Parse JSON request bodies.
// - Serve the files in publicDir, so GET / returns public/index.html.
//
// Routes:
// - GET    /notes      200 with every note, oldest first
// - POST   /notes      201 with the new note
// - GET    /notes/:id  200 with the note
// - PUT    /notes/:id  200 with the note after replacing its title and body
// - DELETE /notes/:id  204 with no body
//
// When no note has the id in the URL, GET, PUT, and DELETE respond 404 with { error: 'Note not found' }.
export function createApp() {
	const app = express();
	const notes = [];
	let nextId = 1;

	// TODO: add the two middleware

	// TODO: add the five routes

	return app;
}
