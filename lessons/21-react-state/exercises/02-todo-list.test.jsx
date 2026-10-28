// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './02-todo-list.jsx';

afterEach(cleanup);

const todos = [
	{ id: 1, text: 'Read the lesson', done: true },
	{ id: 2, text: 'Build the to-do app', done: false },
];

// This test comes first on purpose: React prints each missing-key warning once per file.
test('gives every list item a key, so React prints no warning', () => {
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	render(<TodoList todos={todos} onToggle={() => {}} onDelete={() => {}} />);
	expect(screen.getAllByRole('listitem')).toHaveLength(2);
	const warnings = error.mock.calls.filter((call) => String(call[0]).includes('key'));
	error.mockRestore();
	expect(warnings).toEqual([]);
});

describe('TodoList', () => {
	test('shows one list item per todo, in the order given', () => {
		render(<TodoList todos={todos} onToggle={() => {}} onDelete={() => {}} />);
		const items = screen.getAllByRole('listitem');
		expect(items).toHaveLength(2);
		expect(within(items[0]).getByText('Read the lesson')).toBeTruthy();
		expect(within(items[1]).getByText('Build the to-do app')).toBeTruthy();
	});

	test('checks the checkbox of a todo that is done and only that one', () => {
		render(<TodoList todos={todos} onToggle={() => {}} onDelete={() => {}} />);
		expect(screen.getByLabelText('Read the lesson').checked).toBe(true);
		expect(screen.getByLabelText('Build the to-do app').checked).toBe(false);
	});

	test('calls onToggle with the todo id when the user clicks a checkbox', async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		render(<TodoList todos={todos} onToggle={onToggle} onDelete={() => {}} />);
		await user.click(screen.getByLabelText('Build the to-do app'));
		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(onToggle).toHaveBeenCalledWith(2);
	});

	test('gives each Delete button a name that says which task it deletes', () => {
		render(<TodoList todos={todos} onToggle={() => {}} onDelete={() => {}} />);
		expect(screen.getByRole('button', { name: 'Delete Read the lesson' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Delete Build the to-do app' })).toBeTruthy();
	});

	test('shows the text "Delete" on each Delete button', () => {
		render(<TodoList todos={todos} onToggle={() => {}} onDelete={() => {}} />);
		const [first] = screen.getAllByRole('listitem');
		expect(within(first).getByText('Delete')).toBeTruthy();
	});

	test('calls onDelete with the todo id when the user clicks Delete', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		render(<TodoList todos={todos} onToggle={() => {}} onDelete={onDelete} />);
		await user.click(screen.getByRole('button', { name: 'Delete Read the lesson' }));
		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(onDelete).toHaveBeenCalledWith(1);
	});

	test('shows "Nothing to do." and no list when there are no todos', () => {
		render(<TodoList todos={[]} onToggle={() => {}} onDelete={() => {}} />);
		expect(screen.getByText('Nothing to do.')).toBeTruthy();
		expect(screen.queryByRole('list')).toBeNull();
	});

	test('shows the text of a todo as text, not as HTML', () => {
		const tricky = [{ id: 1, text: '<b>bold</b>', done: false }];
		render(<TodoList todos={tricky} onToggle={() => {}} onDelete={() => {}} />);
		expect(screen.getByLabelText('<b>bold</b>')).toBeTruthy();
	});
});
