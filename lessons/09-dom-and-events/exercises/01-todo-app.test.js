// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { addTodo, deleteTodo, setupTodoApp, toggleTodo } from './01-todo-app.js';

function deepFreeze(value) {
	for (const child of Object.values(value)) {
		if (typeof child === 'object' && child !== null) deepFreeze(child);
	}
	return Object.freeze(value);
}

const state = () =>
	deepFreeze({
		todos: [
			{ id: 1, text: 'Buy milk', done: false },
			{ id: 2, text: 'Walk dog', done: true },
		],
		nextId: 3,
	});

describe('addTodo', () => {
	test('adds a task at the end with the next id and done set to false', () => {
		const next = addTodo(state(), 'Read');
		expect(next.todos).toEqual([
			{ id: 1, text: 'Buy milk', done: false },
			{ id: 2, text: 'Walk dog', done: true },
			{ id: 3, text: 'Read', done: false },
		]);
	});

	test('raises nextId by 1', () => {
		expect(addTodo(state(), 'Read').nextId).toBe(4);
	});

	test('removes spaces from both ends of the text', () => {
		expect(addTodo(state(), '  Read  ').todos[2].text).toBe('Read');
	});

	test('returns the state unchanged when the text is blank', () => {
		const before = state();
		expect(addTodo(before, '   ')).toEqual({ todos: before.todos, nextId: 3 });
	});

	test('does not change the state it is given', () => {
		const before = state();
		const next = addTodo(before, 'Read');
		expect(next.todos).toHaveLength(3);
		expect(before.todos).toHaveLength(2);
		expect(before.nextId).toBe(3);
	});
});

describe('toggleTodo', () => {
	test('flips done for the task with that id', () => {
		const next = toggleTodo(state(), 1);
		expect(next.todos.map((todo) => todo.done)).toEqual([true, true]);
	});

	test('flips a done task back to not done', () => {
		const next = toggleTodo(state(), 2);
		expect(next.todos.map((todo) => todo.done)).toEqual([false, false]);
	});

	test('keeps nextId and every other field', () => {
		const next = toggleTodo(state(), 1);
		expect(next).toEqual({
			todos: [
				{ id: 1, text: 'Buy milk', done: true },
				{ id: 2, text: 'Walk dog', done: true },
			],
			nextId: 3,
		});
	});

	test('does not change the state it is given', () => {
		const before = state();
		const next = toggleTodo(before, 1);
		expect(next.todos[0].done).toBe(true);
		expect(before.todos[0].done).toBe(false);
	});

	test('returns the same contents for an id that does not exist', () => {
		expect(toggleTodo(state(), 99)).toEqual(state());
	});
});

describe('deleteTodo', () => {
	test('removes the task with that id', () => {
		const next = deleteTodo(state(), 1);
		expect(next.todos).toEqual([{ id: 2, text: 'Walk dog', done: true }]);
	});

	test('keeps nextId, so a deleted id is never reused', () => {
		const next = addTodo(deleteTodo(state(), 2), 'Read');
		expect(next.todos.map((todo) => todo.id)).toEqual([1, 3]);
	});

	test('does not change the state it is given', () => {
		const before = state();
		const next = deleteTodo(before, 1);
		expect(next.todos).toHaveLength(1);
		expect(before.todos).toHaveLength(2);
	});

	test('returns the same contents for an id that does not exist', () => {
		expect(deleteTodo(state(), 99)).toEqual(state());
	});
});

describe('the to-do page', () => {
	const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
	let root;
	let user;

	function loadPage() {
		document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
		return document.querySelector('#todo-app');
	}

	const input = () => within(root).getByLabelText('New task');
	const addButton = () => within(root).getByRole('button', { name: 'Add' });
	const items = () => within(root).queryAllByRole('listitem');
	const texts = () => items().map((item) => item.textContent.replace('Delete', '').trim());
	const summary = () => root.querySelector('#todo-summary').textContent;

	async function add(text) {
		await user.type(input(), `${text}{Enter}`);
	}

	beforeEach(() => {
		root = loadPage();
		user = userEvent.setup();
	});

	test('says "No tasks yet." when the list is empty', () => {
		setupTodoApp(root);
		expect(summary()).toBe('No tasks yet.');
	});

	test('shows the tasks in the initial state', () => {
		setupTodoApp(root, {
			todos: [
				{ id: 1, text: 'Buy milk', done: false },
				{ id: 2, text: 'Walk dog', done: true },
			],
			nextId: 3,
		});
		expect(texts()).toEqual(['Buy milk', 'Walk dog']);
		expect(within(root).getByRole('checkbox', { name: 'Walk dog' }).checked).toBe(true);
		expect(within(root).getByRole('checkbox', { name: 'Buy milk' }).checked).toBe(false);
		expect(summary()).toBe('1 of 2 done');
	});

	test('the Add button adds the typed task to the list', async () => {
		setupTodoApp(root);
		await user.type(input(), 'Buy milk');
		await user.click(addButton());
		expect(texts()).toEqual(['Buy milk']);
	});

	test('pressing Enter in the text box adds the task', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		expect(texts()).toEqual(['Buy milk']);
	});

	test('empties the text box after adding a task', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		expect(texts()).toEqual(['Buy milk']);
		expect(input().value).toBe('');
	});

	test('adds new tasks after the ones already there', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		await add('Walk dog');
		await add('Read');
		expect(texts()).toEqual(['Buy milk', 'Walk dog', 'Read']);
	});

	test('removes spaces around a task and ignores a blank one', async () => {
		setupTodoApp(root);
		await add('   ');
		await add('  Buy milk  ');
		expect(texts()).toEqual(['Buy milk']);
	});

	test('submitting the form does not reload the page', async () => {
		setupTodoApp(root);
		let prevented = false;
		document.addEventListener('submit', (event) => {
			prevented = event.defaultPrevented;
		});
		await add('Buy milk');
		expect(prevented).toBe(true);
	});

	test('shows task text as text, not as HTML', async () => {
		setupTodoApp(root);
		await add('<b>hi</b>');
		expect(texts()).toEqual(['<b>hi</b>']);
		expect(root.querySelector('#todo-list b')).toBeNull();
	});

	test('checking a task marks it done and updates the summary', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		await add('Walk dog');
		await user.click(within(root).getByRole('checkbox', { name: 'Buy milk' }));
		expect(within(root).getByRole('checkbox', { name: 'Buy milk' }).checked).toBe(true);
		expect(items()[0].classList.contains('done')).toBe(true);
		expect(items()[1].classList.contains('done')).toBe(false);
		expect(summary()).toBe('1 of 2 done');
	});

	test('unchecking a done task makes it not done again', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		await user.click(within(root).getByRole('checkbox', { name: 'Buy milk' }));
		await user.click(within(root).getByRole('checkbox', { name: 'Buy milk' }));
		expect(within(root).getByRole('checkbox', { name: 'Buy milk' }).checked).toBe(false);
		expect(items()[0].classList.contains('done')).toBe(false);
		expect(summary()).toBe('0 of 1 done');
	});

	test('the Delete button removes only that task', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		await add('Walk dog');
		await add('Read');
		await user.click(within(root).getByRole('button', { name: 'Delete Walk dog' }));
		expect(texts()).toEqual(['Buy milk', 'Read']);
		expect(summary()).toBe('0 of 2 done');
	});

	test('deleting the last task brings back "No tasks yet."', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		await user.click(within(root).getByRole('button', { name: 'Delete Buy milk' }));
		expect(items()).toHaveLength(0);
		expect(summary()).toBe('No tasks yet.');
	});

	test('two tasks with the same text are toggled and deleted one at a time', async () => {
		setupTodoApp(root);
		await add('Milk');
		await add('Milk');
		await user.click(within(root).getAllByRole('checkbox', { name: 'Milk' })[1]);
		const [first, second] = within(root).getAllByRole('checkbox', { name: 'Milk' });
		expect(first.checked).toBe(false);
		expect(second.checked).toBe(true);
		await user.click(within(root).getAllByRole('button', { name: 'Delete Milk' })[0]);
		expect(items()).toHaveLength(1);
		expect(within(root).getByRole('checkbox', { name: 'Milk' }).checked).toBe(true);
	});

	test('keeps working after you check, add, and delete in a row', async () => {
		setupTodoApp(root);
		await add('A');
		await add('B');
		await user.click(within(root).getByRole('checkbox', { name: 'A' }));
		await add('C');
		await user.click(within(root).getByRole('button', { name: 'Delete B' }));
		expect(texts()).toEqual(['A', 'C']);
		expect(within(root).getByRole('checkbox', { name: 'A' }).checked).toBe(true);
		expect(summary()).toBe('1 of 2 done');
	});

	test('a second page load starts with an empty list', async () => {
		setupTodoApp(root);
		await add('Buy milk');
		root = loadPage();
		setupTodoApp(root);
		expect(items()).toHaveLength(0);
		expect(summary()).toBe('No tasks yet.');
	});
});
