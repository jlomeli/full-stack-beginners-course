// Broken versions of the Notes API ("mutants") for 02-integration-tests.mutants.test.js.
// Each mutant takes your working app and breaks it in one way, from the outside.
// You don't need to change or understand this file to finish the lesson.
import express from 'express';
import { IncomingMessage } from 'node:http';

const FIXED_TIME = '2020-01-01T00:00:00.000Z';

function rememberErrors(store, memory) {
	return Object.fromEntries(
		Object.entries(store).map(([name, method]) => [
			name,
			async (...args) => {
				try {
					return await method(...args);
				} catch (error) {
					memory.lastError = error;
					throw error;
				}
			},
		]),
	);
}

// Holds back the response until the app has finished it, then lets `edit` change it.
// edit({ req, status, body }) returns { status?, body?, text? } or nothing to leave the response alone.
function interceptResponse(edit) {
	return (req, res, next) => {
		const chunks = [];
		const end = res.end.bind(res);
		res.write = (chunk, encoding) => {
			chunks.push(Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined));
			return true;
		};
		res.end = (chunk, encoding) => {
			if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined));
			const original = Buffer.concat(chunks).toString();
			let body = original;
			try {
				body = JSON.parse(original);
			} catch {
				// not JSON: edit sees the text
			}
			const changed = edit({ req, status: res.statusCode, body }) ?? {};
			if (changed.status !== undefined) res.statusCode = changed.status;
			res.removeHeader('Content-Length');
			res.removeHeader('ETag');
			if (changed.text !== undefined) {
				res.setHeader('Content-Type', 'text/plain; charset=utf-8');
				return end(changed.text);
			}
			if (changed.body !== undefined) {
				res.setHeader('Content-Type', 'application/json; charset=utf-8');
				return end(JSON.stringify(changed.body));
			}
			return end(original);
		};
		next();
	};
}

// Reads the whole JSON request body, lets `edit` change it, and hands the app a fresh request with the new body.
// edit(body, req) returns the new body, or nothing to leave the request alone.
function rewriteRequest(edit, app) {
	return async (req, res, next) => {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		let raw = Buffer.concat(chunks);
		try {
			const edited = edit(JSON.parse(raw.toString()), req);
			if (edited !== undefined) raw = Buffer.from(JSON.stringify(edited));
		} catch {
			// not JSON: pass the request on unchanged
		}
		const copy = new IncomingMessage(req.socket);
		copy.method = req.method;
		copy.url = req.url;
		copy.headers = { ...req.headers, 'content-length': String(raw.length) };
		copy.push(raw);
		copy.push(null);
		app(copy, res, next);
	};
}

const isValidationError = ({ body }) => body?.error === 'Validation failed';

export const mutants = [
	{
		bug: 'POST /notes answers 200 instead of 201',
		response: ({ req, status }) => (req.method === 'POST' && status === 201 ? { status: 200 } : undefined),
	},
	{
		bug: 'GET /notes lists the newest note first',
		store: (base) => ({ ...base, list: async () => (await base.list()).reverse() }),
	},
	{
		bug: 'every new note gets id 1',
		store: (base) => ({ ...base, create: async (input) => ({ ...(await base.create(input)), id: 1 }) }),
	},
	{
		bug: 'createdAt is not the time the note was created',
		store: (base) => ({ ...base, create: async (input) => ({ ...(await base.create(input)), createdAt: FIXED_TIME }) }),
	},
	{
		bug: 'GET /notes/:id answers with the first note whatever the id',
		store: (base) => ({ ...base, get: async () => (await base.list())[0] }),
	},
	{
		bug: 'PUT answers with the old note and saves nothing',
		store: (base) => ({ ...base, update: async (id) => base.get(id) }),
	},
	{
		bug: 'PUT overwrites createdAt',
		store: (base) => ({ ...base, update: async (id, input) => {
			const note = await base.update(id, input);
			return note && { ...note, createdAt: FIXED_TIME };
		} }),
	},
	{
		bug: 'DELETE says it worked but does not delete the note',
		store: (base) => ({ ...base, remove: async (id) => (await base.get(id)) !== undefined }),
	},
	{
		bug: 'DELETE answers 200 with a body instead of 204 with none',
		response: ({ req, status }) => (req.method === 'DELETE' && status === 204 ? { status: 200, body: { deleted: true } } : undefined),
	},
	{
		bug: 'a missing note answers 400 instead of 404',
		response: ({ status, body }) => (status === 404 && body?.error === 'Note not found' ? { status: 400 } : undefined),
	},
	{
		bug: 'an invalid body answers 422 instead of 400',
		response: (response) => (isValidationError(response) ? { status: 422 } : undefined),
	},
	{
		bug: 'validation errors leave out the details',
		response: (response) => (isValidationError(response) ? { body: { error: response.body.error } } : undefined),
	},
	{
		bug: 'validation errors report only the first problem',
		response: (response) => (isValidationError(response) ? { body: { ...response.body, details: response.body.details.slice(0, 1) } } : undefined),
	},
	{
		bug: 'an invalid id answers 404 "Note not found" instead of 400 "Invalid note id"',
		response: ({ status, body }) => (status === 400 && body?.error === 'Invalid note id' ? { status: 404, body: { error: 'Note not found' } } : undefined),
	},
	{
		bug: 'an unknown URL answers with plain text instead of JSON',
		response: ({ status, body }) => (status === 404 && body?.error === 'Route not found' ? { text: 'Not Found' } : undefined),
	},
	{
		bug: 'malformed JSON answers 500 instead of 400',
		response: ({ status, body }) => (status === 400 && body?.error === 'Request body is not valid JSON' ? { status: 500, body: { error: 'Internal server error' } } : undefined),
	},
	{
		bug: 'unexpected errors send the error message to the client',
		response: ({ status }, memory) => (status === 500 ? { body: { error: memory.lastError?.message ?? 'Internal server error' } } : undefined),
	},
	{
		bug: 'POST /notes accepts a note with no title',
		request: (body, req) => (req.method === 'POST' && body && typeof body === 'object' && body.title === undefined ? { ...body, title: 'untitled' } : undefined),
	},
	{
		bug: 'POST /notes accepts a title that is empty or only spaces',
		request: (body, req) => (req.method === 'POST' && typeof body?.title === 'string' && body.title.trim() === '' ? { ...body, title: 'untitled' } : undefined),
	},
	{
		bug: 'POST /notes accepts a title longer than 100 characters',
		request: (body, req) => (req.method === 'POST' && typeof body?.title === 'string' ? { ...body, title: body.title.slice(0, 100) } : undefined),
	},
	{
		bug: 'POST /notes accepts a body that is not a string',
		request: (body, req) => (req.method === 'POST' && body && typeof body === 'object' && 'body' in body && typeof body.body !== 'string' ? { ...body, body: '' } : undefined),
	},
	{
		bug: 'PUT /notes/:id does not validate the title',
		request: (body, req) => (req.method === 'PUT' && body && typeof body === 'object' && (typeof body.title !== 'string' || body.title.trim() === '') ? { ...body, title: 'untitled' } : undefined),
	},
];

// Builds the app for one mutant: `real` is your createApp, `createMemoryStore` is your file's export.
export function createMutantApp(bug, { real, createMemoryStore, options = {} }) {
	const mutant = mutants.find((candidate) => candidate.bug === bug);
	if (!mutant) throw new Error(`No mutant named "${bug}"`);

	const memory = { lastError: undefined };
	let store = options.store ?? createMemoryStore();
	if (mutant.store) store = mutant.store(store);
	store = rememberErrors(store, memory);

	const target = real({ ...options, store });
	const app = express();
	if (mutant.response) app.use(interceptResponse((response) => mutant.response(response, memory)));
	app.use(mutant.request ? rewriteRequest(mutant.request, target) : target);
	return app;
}
