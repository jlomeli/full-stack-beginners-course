// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooksPage } from './03-books-page.jsx';

const kindred = { id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 };
const dune = { id: 2, title: 'Dune', author: 'Frank Herbert', year: 1965 };

function jsonResponse(status, body) {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// A fake API. Each request is answered by the handler for its method and URL, like 'GET /api/books'.
// Every request is recorded in `requests` so tests can check what the page sent.
let handlers;
let requests;
beforeEach(() => {
	handlers = {};
	requests = [];
	vi.stubGlobal('fetch', async (url, options = {}) => {
		const method = options.method ?? 'GET';
		requests.push({ method, url, headers: new Headers(options.headers), body: options.body });
		const handler = handlers[`${method} ${url}`];
		if (!handler) throw new Error(`The fake API has no handler for ${method} ${url}`);
		return handler(options);
	});
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

const bookTexts = () => screen.getAllByRole('listitem').map((item) => item.textContent);

describe('BooksPage', () => {
	test('shows a loading message while the books load', async () => {
		handlers['GET /api/books'] = () => new Promise(() => {});
		render(<BooksPage />);
		expect(await screen.findByText('Loading books...')).toBeTruthy();
	});

	test('lists the books from GET /api/books', async () => {
		handlers['GET /api/books'] = () => jsonResponse(200, [kindred, dune]);
		render(<BooksPage />);
		await screen.findByRole('list');
		expect(bookTexts()).toEqual(['Kindred by Octavia E. Butler (1979)', 'Dune by Frank Herbert (1965)']);
		expect(screen.queryByText('Loading books...')).toBeNull();
	});

	test('says "No books yet." when the library is empty', async () => {
		handlers['GET /api/books'] = () => jsonResponse(200, []);
		render(<BooksPage />);
		expect(await screen.findByText('No books yet.')).toBeTruthy();
	});

	test('shows an error when the API answers with an error status', async () => {
		handlers['GET /api/books'] = () => jsonResponse(500, { error: 'Database is down' });
		render(<BooksPage />);
		expect(await screen.findByText('Could not load books.')).toBeTruthy();
	});

	test('shows an error when the network request fails', async () => {
		handlers['GET /api/books'] = () => Promise.reject(new TypeError('Failed to fetch'));
		render(<BooksPage />);
		expect(await screen.findByText('Could not load books.')).toBeTruthy();
	});

	test('loads the books again when the user clicks Try again', async () => {
		const user = userEvent.setup();
		handlers['GET /api/books'] = () => jsonResponse(500, { error: 'Database is down' });
		render(<BooksPage />);
		await screen.findByText('Could not load books.');

		handlers['GET /api/books'] = () => jsonResponse(200, [kindred]);
		await user.click(screen.getByRole('button', { name: 'Try again' }));
		await screen.findByRole('list');
		expect(bookTexts()).toEqual(['Kindred by Octavia E. Butler (1979)']);
		expect(screen.queryByText('Could not load books.')).toBeNull();
	});

	test('POSTs a new book as JSON and adds it to the list without loading the list again', async () => {
		const user = userEvent.setup();
		handlers['GET /api/books'] = () => jsonResponse(200, [kindred]);
		handlers['POST /api/books'] = (options) => jsonResponse(201, { id: 2, ...JSON.parse(options.body) });
		render(<BooksPage />);
		await screen.findByRole('list');

		await user.type(screen.getByLabelText('Title'), 'Dune');
		await user.type(screen.getByLabelText('Author'), 'Frank Herbert');
		await user.type(screen.getByLabelText('Year'), '1965');
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		const list = await screen.findByRole('list');
		await within(list).findByText('Dune by Frank Herbert (1965)');
		expect(bookTexts()).toEqual(['Kindred by Octavia E. Butler (1979)', 'Dune by Frank Herbert (1965)']);

		const post = requests.find((request) => request.method === 'POST');
		expect(post.headers.get('Content-Type')).toContain('application/json');
		expect(JSON.parse(post.body)).toEqual({ title: 'Dune', author: 'Frank Herbert', year: 1965 });
		expect(requests.filter((request) => request.method === 'GET')).toHaveLength(1);
	});

	test("shows the API's message when adding a book fails", async () => {
		const user = userEvent.setup();
		handlers['GET /api/books'] = () => jsonResponse(200, [kindred]);
		handlers['POST /api/books'] = () => jsonResponse(400, { error: 'That book is already in the library' });
		render(<BooksPage />);
		await screen.findByRole('list');

		await user.type(screen.getByLabelText('Title'), 'Kindred');
		await user.type(screen.getByLabelText('Author'), 'Octavia E. Butler');
		await user.type(screen.getByLabelText('Year'), '1979');
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		expect(await screen.findByText('That book is already in the library')).toBeTruthy();
		expect(bookTexts()).toEqual(['Kindred by Octavia E. Butler (1979)']);
	});
});
