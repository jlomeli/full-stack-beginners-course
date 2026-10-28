// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from './03-todo-app.jsx';

afterEach(cleanup);

const initialTodos = [
	{ id: 1, text: 'Read the lesson', done: true },
	{ id: 2, text: 'Build the to-do app', done: false },
	{ id: 3, text: 'Open a pull request', done: false },
];

async function addTask(user, text) {
	await user.type(screen.getByLabelText('New task'), text);
	await user.click(screen.getByRole('button', { name: 'Add' }));
}

const texts = () => screen.queryAllByRole('listitem').map((item) => item.textContent.replace('Delete', ''));

describe('TodoApp', () => {
	test('shows the todos it starts with', () => {
		render(<TodoApp initialTodos={initialTodos} />);
		expect(texts()).toEqual(['Read the lesson', 'Build the to-do app', 'Open a pull request']);
		expect(screen.getByLabelText('Read the lesson').checked).toBe(true);
	});

	test('starts empty when it gets no initialTodos', () => {
		render(<TodoApp />);
		expect(screen.getByText('Nothing to do.')).toBeTruthy();
		expect(screen.queryByText(/ done$/)).toBeNull();
	});

	test('adds a task to the end of the list and empties the form', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={initialTodos} />);
		await addTask(user, 'Review feedback');
		expect(texts()).toEqual(['Read the lesson', 'Build the to-do app', 'Open a pull request', 'Review feedback']);
		expect(screen.getByLabelText('Review feedback').checked).toBe(false);
		expect(screen.getByLabelText('New task').value).toBe('');
	});

	test('adds tasks to an empty app, each with its own checkbox', async () => {
		const user = userEvent.setup();
		render(<TodoApp />);
		await addTask(user, 'One');
		await addTask(user, 'Two');
		await user.click(screen.getByLabelText('Two'));
		expect(screen.getByLabelText('One').checked).toBe(false);
		expect(screen.getByLabelText('Two').checked).toBe(true);
	});

	test('gives a new task an id that does not clash with a task you deleted', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={initialTodos} />);
		await user.click(screen.getByRole('button', { name: 'Delete Build the to-do app' }));
		await addTask(user, 'Review feedback');
		await user.click(screen.getByLabelText('Review feedback'));
		expect(screen.getByLabelText('Review feedback').checked).toBe(true);
		expect(screen.getByLabelText('Open a pull request').checked).toBe(false);
	});

	test('checks and unchecks a task when the user clicks its checkbox', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={initialTodos} />);
		await user.click(screen.getByLabelText('Build the to-do app'));
		expect(screen.getByLabelText('Build the to-do app').checked).toBe(true);
		await user.click(screen.getByLabelText('Build the to-do app'));
		expect(screen.getByLabelText('Build the to-do app').checked).toBe(false);
		expect(screen.getByLabelText('Read the lesson').checked).toBe(true);
	});

	test('deletes only the task whose Delete button the user clicks', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={initialTodos} />);
		await user.click(screen.getByRole('button', { name: 'Delete Build the to-do app' }));
		expect(texts()).toEqual(['Read the lesson', 'Open a pull request']);
	});

	test('shows how many tasks are done out of the total, and keeps it up to date', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={initialTodos} />);
		expect(screen.getByText('1 of 3 done')).toBeTruthy();
		await user.click(screen.getByLabelText('Build the to-do app'));
		expect(screen.getByText('2 of 3 done')).toBeTruthy();
		await addTask(user, 'Review feedback');
		expect(screen.getByText('2 of 4 done')).toBeTruthy();
		await user.click(screen.getByRole('button', { name: 'Delete Read the lesson' }));
		expect(screen.getByText('1 of 3 done')).toBeTruthy();
	});

	test('shows "Clear completed" only when a task is done, and it removes every done task', async () => {
		const user = userEvent.setup();
		render(<TodoApp initialTodos={[{ id: 1, text: 'A', done: false }, { id: 2, text: 'B', done: false }]} />);
		expect(screen.queryByRole('button', { name: 'Clear completed' })).toBeNull();

		await user.click(screen.getByLabelText('A'));
		await user.click(screen.getByRole('button', { name: 'Clear completed' }));
		expect(texts()).toEqual(['B']);
		expect(screen.queryByRole('button', { name: 'Clear completed' })).toBeNull();
	});

	test('does not change the initialTodos array it was given', async () => {
		const user = userEvent.setup();
		const given = [{ id: 1, text: 'A', done: false }];
		render(<TodoApp initialTodos={given} />);
		await user.click(screen.getByLabelText('A'));
		await addTask(user, 'B');
		expect(given).toEqual([{ id: 1, text: 'A', done: false }]);
	});
});
