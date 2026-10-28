// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './04-library-app.jsx';

const kindred = { id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 };
const dune = { id: 2, title: 'Dune', author: 'Frank Herbert', year: 1965 };

function jsonResponse(status, body) {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

let handlers;
let requests;
beforeEach(() => {
	window.history.replaceState(null, '', '/');
	handlers = { 'GET /api/books': () => jsonResponse(200, [kindred, dune]) };
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

function openAt(path) {
	window.history.replaceState(null, '', path);
	return render(<App />);
}

const getRequests = () => requests.filter((request) => request.method === 'GET');

describe('the books list at /', () => {
	test('shows a loading message while the books load', async () => {
		handlers['GET /api/books'] = () => new Promise(() => {});
		openAt('/');
		expect(await screen.findByText('Loading books...')).toBeTruthy();
	});

	test('shows an error message when the books fail to load', async () => {
		handlers['GET /api/books'] = () => jsonResponse(500, { error: 'Server broke' });
		openAt('/');
		expect(await screen.findByText('Could not load books.')).toBeTruthy();
	});

	test('lists each book as a link to its detail page, with its author', async () => {
		openAt('/');
		const link = await screen.findByRole('link', { name: 'Dune' });
		expect(link.getAttribute('href')).toBe('/books/2');
		expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
			'Kindred by Octavia E. Butler',
			'Dune by Frank Herbert',
		]);
	});

	test('shows "No books yet." when the library is empty', async () => {
		handlers['GET /api/books'] = () => jsonResponse(200, []);
		openAt('/');
		expect(await screen.findByText('No books yet.')).toBeTruthy();
	});
});

describe('the detail page at /books/:id', () => {
	test('opens when the user clicks a title, without reloading the page', async () => {
		const user = userEvent.setup();
		openAt('/');

		await user.click(await screen.findByRole('link', { name: 'Dune' }));

		expect(await screen.findByRole('heading', { name: 'Dune' })).toBeTruthy();
		expect(screen.getByText('Author: Frank Herbert')).toBeTruthy();
		expect(screen.getByText('Year: 1965')).toBeTruthy();
		expect(window.location.pathname).toBe('/books/2');
		expect(getRequests()).toHaveLength(1);
	});

	test('shows the book when the user opens its address directly', async () => {
		openAt('/books/1');
		expect(await screen.findByRole('heading', { name: 'Kindred' })).toBeTruthy();
		expect(screen.getByText('Author: Octavia E. Butler')).toBeTruthy();
	});

	test('shows a loading message before the books arrive', async () => {
		handlers['GET /api/books'] = () => new Promise(() => {});
		openAt('/books/1');
		expect(await screen.findByText('Loading books...')).toBeTruthy();
	});

	test('shows "Book not found." with a way back when no book has that id', async () => {
		openAt('/books/99');
		expect(await screen.findByText('Book not found.')).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Back to books' }).getAttribute('href')).toBe('/');
	});

	test('"Back to books" returns to the list without fetching the books again', async () => {
		const user = userEvent.setup();
		openAt('/books/1');

		await user.click(await screen.findByRole('link', { name: 'Back to books' }));

		expect(await screen.findByRole('heading', { name: 'Books' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Dune' })).toBeTruthy();
		expect(getRequests()).toHaveLength(1);
	});

	test('the browser back button returns to the list', async () => {
		const user = userEvent.setup();
		openAt('/');
		await user.click(await screen.findByRole('link', { name: 'Kindred' }));
		await screen.findByRole('heading', { name: 'Kindred' });

		window.history.back();

		expect(await screen.findByRole('heading', { name: 'Books' })).toBeTruthy();
	});

	test('has an Edit link to the edit page', async () => {
		openAt('/books/2');
		const edit = await screen.findByRole('link', { name: 'Edit' });
		expect(edit.getAttribute('href')).toBe('/books/2/edit');
	});
});

describe('the edit page at /books/:id/edit', () => {
	test('shows the form filled in with the book', async () => {
		openAt('/books/2/edit');
		expect(await screen.findByRole('heading', { name: 'Edit Dune' })).toBeTruthy();
		expect(screen.getByLabelText('Title').value).toBe('Dune');
		expect(screen.getByLabelText('Author').value).toBe('Frank Herbert');
		expect(screen.getByLabelText('Year').value).toBe('1965');
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
	});

	test('shows "Book not found." when no book has that id', async () => {
		openAt('/books/99/edit');
		expect(await screen.findByText('Book not found.')).toBeTruthy();
	});

	test('saving sends a PUT with the new values and then shows the detail page', async () => {
		handlers['PUT /api/books/2'] = (options) => jsonResponse(200, { id: 2, ...JSON.parse(options.body) });
		const user = userEvent.setup();
		openAt('/books/2/edit');

		const title = await screen.findByLabelText('Title');
		await user.clear(title);
		await user.type(title, 'Dune Messiah');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByRole('heading', { name: 'Dune Messiah' })).toBeTruthy();
		expect(screen.getByText('Year: 1965')).toBeTruthy();
		expect(window.location.pathname).toBe('/books/2');
		const put = requests.find((request) => request.method === 'PUT');
		expect(put.url).toBe('/api/books/2');
		expect(put.headers.get('Content-Type')).toBe('application/json');
		expect(JSON.parse(put.body)).toEqual({ title: 'Dune Messiah', author: 'Frank Herbert', year: 1965 });
	});

	test('the list shows the edited title without fetching the books again', async () => {
		handlers['PUT /api/books/1'] = (options) => jsonResponse(200, { id: 1, ...JSON.parse(options.body) });
		const user = userEvent.setup();
		openAt('/books/1/edit');

		const title = await screen.findByLabelText('Title');
		await user.clear(title);
		await user.type(title, 'Kindred (2nd ed.)');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));
		await screen.findByRole('heading', { name: 'Kindred (2nd ed.)' });
		await user.click(screen.getByRole('link', { name: 'Back to books' }));

		expect(await screen.findByRole('link', { name: 'Kindred (2nd ed.)' })).toBeTruthy();
		expect(getRequests()).toHaveLength(1);
	});

	test('shows the API error and stays on the edit page when the save fails', async () => {
		handlers['PUT /api/books/2'] = () => jsonResponse(400, { error: 'That book is already in the library' });
		const user = userEvent.setup();
		openAt('/books/2/edit');

		await user.click(await screen.findByRole('button', { name: 'Save changes' }));

		expect(await screen.findByText('That book is already in the library')).toBeTruthy();
		expect(window.location.pathname).toBe('/books/2/edit');
		expect(screen.getByLabelText('Title').value).toBe('Dune');
	});

	test('shows a validation message and sends nothing when the title is empty', async () => {
		const user = userEvent.setup();
		openAt('/books/2/edit');

		await user.clear(await screen.findByLabelText('Title'));
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByText('Title is required')).toBeTruthy();
		expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(0);
	});
});

describe('unknown addresses', () => {
	test('show "Page not found." with a link back to the list', async () => {
		openAt('/authors/3');
		expect(await screen.findByText('Page not found.')).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Back to books' }).getAttribute('href')).toBe('/');
	});
});
