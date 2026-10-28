// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoForm } from './01-todo-form.jsx';

afterEach(cleanup);

describe('TodoForm', () => {
	test('shows a text input labelled "New task" and an "Add" button', () => {
		render(<TodoForm onAdd={() => {}} />);
		expect(screen.getByLabelText('New task')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
	});

	test('shows what the user types', async () => {
		const user = userEvent.setup();
		render(<TodoForm onAdd={() => {}} />);
		await user.type(screen.getByLabelText('New task'), 'Buy milk');
		expect(screen.getByLabelText('New task').value).toBe('Buy milk');
	});

	test('calls onAdd with the text when the user clicks "Add"', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<TodoForm onAdd={onAdd} />);
		await user.type(screen.getByLabelText('New task'), 'Buy milk');
		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onAdd).toHaveBeenCalledWith('Buy milk');
	});

	test('calls onAdd when the user presses Enter in the input', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<TodoForm onAdd={onAdd} />);
		await user.type(screen.getByLabelText('New task'), 'Buy milk{Enter}');
		expect(onAdd).toHaveBeenCalledWith('Buy milk');
	});

	test('removes spaces from both ends of the text', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<TodoForm onAdd={onAdd} />);
		await user.type(screen.getByLabelText('New task'), '   Buy milk  ');
		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(onAdd).toHaveBeenCalledWith('Buy milk');
	});

	test('empties the input after adding', async () => {
		const user = userEvent.setup();
		render(<TodoForm onAdd={() => {}} />);
		await user.type(screen.getByLabelText('New task'), 'Buy milk');
		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(screen.getByLabelText('New task').value).toBe('');
	});

	test('does not call onAdd for empty text or spaces only', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<TodoForm onAdd={onAdd} />);
		await user.click(screen.getByRole('button', { name: 'Add' }));
		await user.type(screen.getByLabelText('New task'), '   ');
		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(onAdd).not.toHaveBeenCalled();
		expect(screen.getByLabelText('New task').value).toBe('   ');
	});

	test('does not reload the page when the form is submitted', () => {
		render(<TodoForm onAdd={() => {}} />);
		const form = screen.getByLabelText('New task').closest('form');
		expect(form).not.toBeNull();
		expect(fireEvent.submit(form)).toBe(false);
	});
});
