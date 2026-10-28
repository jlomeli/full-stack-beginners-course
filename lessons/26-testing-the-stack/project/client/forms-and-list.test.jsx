// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AddBookForm } from './AddBookForm.jsx';
import { BookList } from './BookList.jsx';
import { LoginForm } from './LoginForm.jsx';

afterEach(cleanup);

describe('LoginForm', () => {
	async function logIn(user, email = 'ada@example.com', password = 'correct-horse') {
		await user.type(screen.getByLabelText('Email'), email);
		await user.type(screen.getByLabelText('Password'), password);
		await user.click(screen.getByRole('button', { name: 'Log in' }));
	}

	test('shows labelled Email and Password inputs and a Log in button', () => {
		render(<LoginForm onLogin={async () => {}} />);
		expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Password').type).toBe('password');
		expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
	});

	test('calls onLogin with the email and password the user typed', async () => {
		const user = userEvent.setup();
		const onLogin = vi.fn().mockResolvedValue(undefined);
		render(<LoginForm onLogin={onLogin} />);
		await logIn(user);
		expect(onLogin).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'correct-horse' });
	});

	test('shows no alert before the first submit', () => {
		render(<LoginForm onLogin={async () => {}} />);
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('shows the error message in an alert when onLogin rejects', async () => {
		const user = userEvent.setup();
		render(<LoginForm onLogin={async () => Promise.reject(new Error('Wrong email or password'))} />);
		await logIn(user);
		expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password');
	});

	test('removes the old alert when the next attempt starts', async () => {
		const user = userEvent.setup();
		const onLogin = vi.fn().mockRejectedValueOnce(new Error('Wrong email or password')).mockResolvedValue(undefined);
		render(<LoginForm onLogin={onLogin} />);
		await logIn(user);
		await screen.findByRole('alert');
		await user.click(screen.getByRole('button', { name: 'Log in' }));
		expect(screen.queryByRole('alert')).toBeNull();
	});
});

describe('AddBookForm', () => {
	async function fillIn(user, { title = 'Kindred', author = 'Octavia E. Butler', year = '1979' } = {}) {
		await user.type(screen.getByLabelText('Title'), title);
		await user.type(screen.getByLabelText('Author'), author);
		await user.type(screen.getByLabelText('Year'), year);
		await user.click(screen.getByRole('button', { name: 'Add book' }));
	}

	test('shows labelled Title, Author, and Year inputs and an Add book button', () => {
		render(<AddBookForm onAdd={async () => {}} />);
		expect(screen.getByLabelText('Title')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Author')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Year')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByRole('button', { name: 'Add book' })).toBeTruthy();
	});

	test('calls onAdd with the title, the author, and the year as a number', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn().mockResolvedValue(undefined);
		render(<AddBookForm onAdd={onAdd} />);
		await fillIn(user);
		expect(onAdd).toHaveBeenCalledWith({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
	});

	test('clears the inputs after onAdd resolves', async () => {
		const user = userEvent.setup();
		render(<AddBookForm onAdd={async () => {}} />);
		await fillIn(user);
		await vi.waitFor(() => expect(screen.getByLabelText('Title').value).toBe(''));
		expect(screen.getByLabelText('Author').value).toBe('');
		expect(screen.getByLabelText('Year').value).toBe('');
	});

	test('shows the error message in an alert and keeps the inputs when onAdd rejects', async () => {
		const user = userEvent.setup();
		render(<AddBookForm onAdd={async () => Promise.reject(new Error('Title is required'))} />);
		await fillIn(user);
		expect((await screen.findByRole('alert')).textContent).toBe('Title is required');
		expect(screen.getByLabelText('Title').value).toBe('Kindred');
	});

	test('does not reload the page when the form is submitted', async () => {
		const user = userEvent.setup();
		const prevented = [];
		const record = (event) => prevented.push(event.defaultPrevented);
		document.addEventListener('submit', record);
		render(<AddBookForm onAdd={async () => {}} />);
		await fillIn(user);
		document.removeEventListener('submit', record);
		expect(prevented).toEqual([true]);
	});
});

describe('BookList', () => {
	const books = [
		{ id: 1, title: 'Beloved', author: 'Toni Morrison', year: 1987, available: true },
		{ id: 2, title: 'Kindred', author: 'Octavia E. Butler', year: 1979, available: false },
	];

	test('says "No books yet." when the list is empty', () => {
		render(<BookList books={[]} />);
		expect(screen.getByText('No books yet.')).toBeTruthy();
		expect(screen.queryByRole('list')).toBeNull();
	});

	test('shows one list item per book, in the order given, with title, author, and year', () => {
		render(<BookList books={books} />);
		const items = screen.getAllByRole('listitem');
		expect(items).toHaveLength(2);
		expect(items[0].textContent).toContain('Beloved');
		expect(items[0].textContent).toContain('Toni Morrison');
		expect(items[0].textContent).toContain('1987');
		expect(items[1].textContent).toContain('Kindred');
	});

	test('shows Available for a book that can be borrowed and On loan for one that cannot', () => {
		render(<BookList books={books} />);
		const [beloved, kindred] = screen.getAllByRole('listitem');
		expect(beloved.textContent).toContain('Available');
		expect(beloved.textContent).not.toContain('On loan');
		expect(kindred.textContent).toContain('On loan');
	});

	test('shows no Borrow buttons when onBorrow is not given', () => {
		render(<BookList books={books} />);
		expect(screen.queryByRole('button')).toBeNull();
	});

	test('shows a Borrow button only for available books when onBorrow is given', () => {
		render(<BookList books={books} onBorrow={() => {}} />);
		expect(screen.getByRole('button', { name: 'Borrow Beloved' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Borrow Kindred' })).toBeNull();
	});

	test('calls onBorrow with the book when its Borrow button is clicked', async () => {
		const user = userEvent.setup();
		const onBorrow = vi.fn();
		render(<BookList books={books} onBorrow={onBorrow} />);
		await user.click(screen.getByRole('button', { name: 'Borrow Beloved' }));
		expect(onBorrow).toHaveBeenCalledWith(books[0]);
	});
});
