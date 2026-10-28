// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { BooksProvider, useBooks } from './03-books-store.jsx';

const kindred = { id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 };
const dune = { id: 2, title: 'Dune', author: 'Frank Herbert', year: 1965 };
const beloved = { id: 3, title: 'Beloved', author: 'Toni Morrison', year: 1987 };

function jsonResponse(status, body) {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

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
	vi.restoreAllMocks();
});

let latest;
function Probe({ label = 'probe' }) {
	latest = useBooks();
	return (
		<p>
			{label}: {latest.status} [{latest.books.map((book) => book.title).join(', ')}]
		</p>
	);
}

describe('BooksProvider', () => {
	test('reports status "loading" and no books while the request is pending', () => {
		handlers['GET /api/books'] = () => new Promise(() => {});
		render(
			<BooksProvider>
				<Probe />
			</BooksProvider>,
		);
		expect(screen.getByText('probe: loading []')).toBeTruthy();
	});

	test('reports status "ready" with the books from GET /api/books', async () => {
		handlers['GET /api/books'] = () => jsonResponse(200, [kindred, dune]);
		render(
			<BooksProvider>
				<Probe />
			</BooksProvider>,
		);
		expect(await screen.findByText('probe: ready [Kindred, Dune]')).toBeTruthy();
	});

	test('fetches the books once, however many components use them', async () => {
		handlers['GET /api/books'] = () => jsonResponse(200, [kindred]);
		render(
			<BooksProvider>
				<Probe label="first" />
				<Probe label="second" />
			</BooksProvider>,
		);
		expect(await screen.findByText('first: ready [Kindred]')).toBeTruthy();
		expect(screen.getByText('second: ready [Kindred]')).toBeTruthy();
		expect(requests.filter((request) => request.method === 'GET')).toHaveLength(1);
	});

	test('reports status "error" when the API answers with an error status', async () => {
		handlers['GET /api/books'] = () => jsonResponse(500, { error: 'Server broke' });
		render(
			<BooksProvider>
				<Probe />
			</BooksProvider>,
		);
		expect(await screen.findByText('probe: error []')).toBeTruthy();
	});

	test('reports status "error" when the request never reaches the server', async () => {
		handlers['GET /api/books'] = () => Promise.reject(new TypeError('Failed to fetch'));
		render(
			<BooksProvider>
				<Probe />
			</BooksProvider>,
		);
		expect(await screen.findByText('probe: error []')).toBeTruthy();
	});
});

describe('updateBook', () => {
	async function renderReady(books = [kindred, dune, beloved]) {
		handlers['GET /api/books'] = () => jsonResponse(200, books);
		render(
			<BooksProvider>
				<Probe label="first" />
				<Probe label="second" />
			</BooksProvider>,
		);
		await screen.findByText(/first: ready/);
	}

	test('sends a PUT to /api/books/:id with the changes as JSON', async () => {
		await renderReady();
		const changes = { title: 'Dune Messiah', author: 'Frank Herbert', year: 1969 };
		handlers['PUT /api/books/2'] = () => jsonResponse(200, { id: 2, ...changes });

		await act(() => latest.updateBook(2, changes));

		const put = requests.find((request) => request.method === 'PUT');
		expect(put.url).toBe('/api/books/2');
		expect(put.headers.get('Content-Type')).toBe('application/json');
		expect(JSON.parse(put.body)).toEqual(changes);
	});

	test('replaces the book in place and keeps the order of the others', async () => {
		await renderReady();
		handlers['PUT /api/books/2'] = () => jsonResponse(200, { ...dune, title: 'Dune Messiah' });

		await act(() => latest.updateBook(2, { title: 'Dune Messiah', author: dune.author, year: dune.year }));

		expect(screen.getByText('first: ready [Kindred, Dune Messiah, Beloved]')).toBeTruthy();
	});

	test('every component that uses the books sees the change', async () => {
		await renderReady();
		handlers['PUT /api/books/1'] = () => jsonResponse(200, { ...kindred, title: 'Kindred (2nd ed.)' });

		await act(() => latest.updateBook(1, { title: 'Kindred (2nd ed.)', author: kindred.author, year: kindred.year }));

		expect(screen.getByText('second: ready [Kindred (2nd ed.), Dune, Beloved]')).toBeTruthy();
	});

	test('resolves to the book the API returned', async () => {
		await renderReady();
		const saved = { ...dune, year: 1966 };
		handlers['PUT /api/books/2'] = () => jsonResponse(200, saved);

		let result;
		await act(async () => {
			result = await latest.updateBook(2, { title: dune.title, author: dune.author, year: 1966 });
		});

		expect(result).toEqual(saved);
	});

	test('does not fetch the whole list again after a save', async () => {
		await renderReady();
		handlers['PUT /api/books/2'] = () => jsonResponse(200, dune);

		await act(() => latest.updateBook(2, dune));

		expect(requests.filter((request) => request.method === 'GET')).toHaveLength(1);
	});

	test('throws the API error message and leaves the books as they were', async () => {
		await renderReady();
		handlers['PUT /api/books/2'] = () => jsonResponse(400, { error: 'Year cannot be in the future' });

		let error;
		await act(async () => {
			error = await latest.updateBook(2, { title: 'Dune', author: 'Frank Herbert', year: 3000 }).catch((caught) => caught);
		});

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe('Year cannot be in the future');
		expect(screen.getByText('first: ready [Kindred, Dune, Beloved]')).toBeTruthy();
	});
});

describe('useBooks', () => {
	test('throws a helpful error outside a BooksProvider', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(<Probe />)).toThrow('useBooks must be used inside <BooksProvider>');
	});
});
