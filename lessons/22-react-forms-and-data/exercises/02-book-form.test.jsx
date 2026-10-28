// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from './02-book-form.jsx';

afterEach(cleanup);

async function fillIn(user, { title, author, year }) {
	if (title) await user.type(screen.getByLabelText('Title'), title);
	if (author) await user.type(screen.getByLabelText('Author'), author);
	if (year) await user.type(screen.getByLabelText('Year'), year);
}

describe('BookForm', () => {
	test('shows labelled inputs for title, author, and year, and an Add book button', () => {
		render(<BookForm onSubmit={() => {}} />);
		expect(screen.getByLabelText('Title')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Author')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Year')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByRole('button', { name: 'Add book' })).toBeTruthy();
	});

	test('shows what the user types in each input', async () => {
		const user = userEvent.setup();
		render(<BookForm onSubmit={() => {}} />);
		await fillIn(user, { title: 'Kindred', author: 'Octavia E. Butler', year: '1979' });
		expect(screen.getByLabelText('Title').value).toBe('Kindred');
		expect(screen.getByLabelText('Author').value).toBe('Octavia E. Butler');
		expect(screen.getByLabelText('Year').value).toBe('1979');
	});

	test('shows no messages before the first submit', async () => {
		const user = userEvent.setup();
		render(<BookForm onSubmit={() => {}} />);
		await user.type(screen.getByLabelText('Year'), 'soon');
		expect(screen.queryByText('Title is required')).toBeNull();
		expect(screen.queryByText('Year must be a whole number')).toBeNull();
	});

	test('shows a message for each invalid field and does not call onSubmit', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<BookForm onSubmit={onSubmit} />);
		await fillIn(user, { author: 'Octavia E. Butler', year: 'soon' });
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		expect(screen.getByText('Title is required')).toBeTruthy();
		expect(screen.getByText('Year must be a whole number')).toBeTruthy();
		expect(screen.queryByText('Author is required')).toBeNull();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('updates the messages as the user fixes a field', async () => {
		const user = userEvent.setup();
		render(<BookForm onSubmit={() => {}} />);
		await user.click(screen.getByRole('button', { name: 'Add book' }));
		expect(screen.getByText('Title is required')).toBeTruthy();

		await user.type(screen.getByLabelText('Title'), 'Kindred');
		expect(screen.queryByText('Title is required')).toBeNull();
		expect(screen.getByText('Author is required')).toBeTruthy();
	});

	test('calls onSubmit with trimmed text and the year as a number', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<BookForm onSubmit={onSubmit} />);
		await fillIn(user, { title: '  Kindred ', author: 'Octavia E. Butler', year: '1979' });
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
	});

	test('disables the button and shows "Adding..." until onSubmit finishes, then clears the inputs', async () => {
		const user = userEvent.setup();
		let finishSaving;
		const onSubmit = () => new Promise((resolve) => (finishSaving = resolve));
		render(<BookForm onSubmit={onSubmit} />);
		await fillIn(user, { title: 'Kindred', author: 'Octavia E. Butler', year: '1979' });
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		const button = screen.getByRole('button', { name: 'Adding...' });
		expect(button.disabled).toBe(true);
		expect(screen.getByLabelText('Title').value).toBe('Kindred');

		finishSaving();
		const enabled = await screen.findByRole('button', { name: 'Add book' });
		expect(enabled.disabled).toBe(false);
		expect(screen.getByLabelText('Title').value).toBe('');
		expect(screen.getByLabelText('Author').value).toBe('');
		expect(screen.getByLabelText('Year').value).toBe('');
	});

	test('shows the error and keeps what the user typed when onSubmit fails', async () => {
		const user = userEvent.setup();
		const onSubmit = () => Promise.reject(new Error('The library is closed'));
		render(<BookForm onSubmit={onSubmit} />);
		await fillIn(user, { title: 'Kindred', author: 'Octavia E. Butler', year: '1979' });
		await user.click(screen.getByRole('button', { name: 'Add book' }));

		expect(await screen.findByText('The library is closed')).toBeTruthy();
		expect(screen.getByLabelText('Title').value).toBe('Kindred');
		expect(screen.getByRole('button', { name: 'Add book' }).disabled).toBe(false);
	});
});
