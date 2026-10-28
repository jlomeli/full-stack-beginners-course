// Write integration tests for the Notes API in 01-notes-api.js.
//
// An integration test sends a real HTTP request to the whole app and checks the response,
// the way a client would. Don't reach into the app's code: check status codes, headers, and JSON.
//
// 02-integration-tests.mutants.test.js runs this file against your API, then against broken copies
// of it, each with one bug. Your tests must pass on your API and fail on every broken copy.
// Run `npm test 14` and read the names of the "your tests catch the bug" tests to see which bugs
// your tests still miss.
//
// Each test gets a new app (see beforeEach), so one test never sees another test's notes.
import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp, createMemoryStore } from './01-notes-api.js';

let app;
beforeEach(() => {
	app = createApp();
});

// TODO: write the tests. These ideas are a start; replace each todo with a real test.
describe('creating and reading notes', () => {
	test.todo('POST /notes answers 201 and the new note');
	test.todo('GET /notes lists the notes in the order they were created');
	test.todo('GET /notes/:id answers with the note that has that id');
});

describe('replacing and deleting notes', () => {
	test.todo('PUT /notes/:id answers with the new note and saves it');
	test.todo('DELETE /notes/:id answers 204 with no body and removes the note');
});

describe('rejecting bad requests', () => {
	test.todo('POST /notes answers 400 with details for each bad field');
	test.todo('PUT /notes/:id answers 400 for an invalid body');
	test.todo('a note id that is not a whole number answers 400');
});

describe('errors', () => {
	test.todo('a note that does not exist answers 404');
	test.todo('a URL with no route answers 404 as JSON');
	test.todo('malformed JSON answers 400');
	test.todo('a failing store answers 500 without leaking its message');
});
