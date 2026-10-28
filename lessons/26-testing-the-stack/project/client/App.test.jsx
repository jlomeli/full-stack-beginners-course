// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { App } from './App.jsx';

function json(body, status = 200) {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// A tiny fake of the server: the whole page runs against it, with no network.
let books;
let loggedIn;
let calls;

function fakeFetch(path, { method = 'GET', body } = {}) {
	calls.push(`${method} ${path}`);
	const data = body ? JSON.parse(body) : undefined;
	if (method === 'GET' && path === '/api/books') return json(books);
	if (method === 'GET' && path === '/api/me') return loggedIn ? json({ id: 1, name: 'Ada Lovelace' }) : json({ error: 'Log in first' }, 401);
	if (method === 'POST' && path === '/api/login') {
		if (data.password !== 'correct-horse') return json({ error: 'Wrong email or password' }, 401);
		loggedIn = true;
		return json({ id: 1, name: 'Ada Lovelace' });
	}
	if (method === 'POST' && path === '/api/logout') {
		loggedIn = false;
		return new Response(null, { status: 204 });
	}
	if (method === 'POST' && path === '/api/books') {
		const book = { id: books.length + 1, ...data, available: true };
		books = [...books, book];
		return json(book, 201);
	}
	if (method === 'POST' && path === '/api/loans') {
		books = books.map((book) => (book.id === data.bookId ? { ...book, available: false } : book));
		return json({ id: 1, bookId: data.bookId }, 201);
	}
	return json({ error: 'Not found' }, 404);
}

beforeEach(() => {
	books = [{ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979, available: true }];
	loggedIn = false;
	calls = [];
	vi.stubGlobal('fetch', vi.fn(async (path, options) => fakeFetch(path, options)));
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test('shows the books and a log-in form to a visitor, with no way to borrow', async () => {
	render(<App />);
	expect(await screen.findByText(/Kindred/)).toBeTruthy();
	expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
	expect(screen.queryByRole('button', { name: /Borrow/ })).toBeNull();
	expect(screen.queryByRole('button', { name: 'Add book' })).toBeNull();
});

test('shows a wrong-password message and stays on the log-in form', async () => {
	const user = userEvent.setup();
	render(<App />);
	await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
	await user.type(screen.getByLabelText('Password'), 'wrong-password');
	await user.click(screen.getByRole('button', { name: 'Log in' }));
	expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password');
	expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
});

test('logging in replaces the log-in form with the member name, a Log out button, and the Add book form', async () => {
	const user = userEvent.setup();
	render(<App />);
	await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
	await user.type(screen.getByLabelText('Password'), 'correct-horse');
	await user.click(screen.getByRole('button', { name: 'Log in' }));
	expect(await screen.findByText(/Signed in as Ada Lovelace/)).toBeTruthy();
	expect(screen.getByRole('button', { name: 'Add book' })).toBeTruthy();
	expect(screen.queryByLabelText('Password')).toBeNull();
});

test('adding a book posts it and shows it in the list', async () => {
	const user = userEvent.setup();
	loggedIn = true;
	render(<App />);
	await user.type(await screen.findByLabelText('Title'), 'Beloved');
	await user.type(screen.getByLabelText('Author'), 'Toni Morrison');
	await user.type(screen.getByLabelText('Year'), '1987');
	await user.click(screen.getByRole('button', { name: 'Add book' }));
	expect(await screen.findByText(/Beloved/)).toBeTruthy();
	expect(calls).toContain('POST /api/books');
});

test('borrowing a book marks it as on loan', async () => {
	const user = userEvent.setup();
	loggedIn = true;
	render(<App />);
	await user.click(await screen.findByRole('button', { name: 'Borrow Kindred' }));
	expect(await screen.findByText('On loan')).toBeTruthy();
	expect(screen.queryByRole('button', { name: 'Borrow Kindred' })).toBeNull();
});

test('logging out brings back the log-in form and removes the Borrow buttons', async () => {
	const user = userEvent.setup();
	loggedIn = true;
	render(<App />);
	await user.click(await screen.findByRole('button', { name: 'Log out' }));
	expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
	expect(screen.queryByRole('button', { name: /Borrow/ })).toBeNull();
});
