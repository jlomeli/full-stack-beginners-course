// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookSearch, KeyLogger, PageTitle } from './04-effect-bugs.jsx';

afterEach(cleanup);

describe('PageTitle', () => {
	test('updates the browser tab title when the name changes', () => {
		const { rerender } = render(<PageTitle name="Ann" />);
		expect(document.title).toBe("Ann's library");
		rerender(<PageTitle name="Bo" />);
		expect(document.title).toBe("Bo's library");
		rerender(<PageTitle name="Cy" />);
		expect(document.title).toBe("Cy's library");
	});

	test('still shows the name in the heading', () => {
		const { rerender } = render(<PageTitle name="Ann" />);
		rerender(<PageTitle name="Bo" />);
		expect(screen.getByRole('heading', { name: "Bo's library" })).toBeTruthy();
		expect(document.title).toBe("Bo's library");
	});
});

describe('KeyLogger', () => {
	test('stops calling onKey after the component is removed', () => {
		const onKey = vi.fn();
		const { unmount } = render(<KeyLogger onKey={onKey} />);
		fireEvent.keyDown(window, { key: 'a' });
		expect(onKey).toHaveBeenCalledTimes(1);

		unmount();
		fireEvent.keyDown(window, { key: 'b' });
		expect(onKey).toHaveBeenCalledTimes(1);
	});

	test('calls only the newest onKey, once per key press, after the parent passes a new one', () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = render(<KeyLogger onKey={first} />);
		rerender(<KeyLogger onKey={second} />);
		fireEvent.keyDown(window, { key: 'x' });

		expect(second).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledWith('x');
		expect(first).not.toHaveBeenCalled();
	});

	test('does not pile up listeners across many re-renders', () => {
		const calls = [];
		const { rerender } = render(<KeyLogger onKey={(key) => calls.push(key)} />);
		for (let i = 0; i < 5; i++) rerender(<KeyLogger onKey={(key) => calls.push(key)} />);
		fireEvent.keyDown(window, { key: 'k' });
		expect(calls).toEqual(['k']);
	});
});

describe('BookSearch', () => {
	const first = [
		{ id: 1, title: 'Kindred' },
		{ id: 2, title: 'Dawn' },
	];
	const second = [
		{ id: 3, title: 'Beloved' },
		{ id: 4, title: 'Dune' },
		{ id: 5, title: 'Parable of the Sower' },
	];
	const titles = () => screen.queryAllByRole('listitem').map((item) => item.textContent);

	test('shows the new books when the books prop changes', () => {
		const { rerender } = render(<BookSearch books={first} />);
		expect(titles()).toEqual(['Kindred', 'Dawn']);
		rerender(<BookSearch books={second} />);
		expect(titles()).toEqual(['Beloved', 'Dune', 'Parable of the Sower']);
	});

	test('applies what the user typed to the new books when the books prop changes', async () => {
		const user = userEvent.setup();
		const { rerender } = render(<BookSearch books={first} />);
		await user.type(screen.getByLabelText('Search books'), 'd');
		expect(titles()).toEqual(['Kindred', 'Dawn']);

		rerender(<BookSearch books={second} />);
		expect(titles()).toEqual(['Beloved', 'Dune']);
		expect(screen.getByLabelText('Search books').value).toBe('d');
	});

	test('ignores upper and lower case when it filters', async () => {
		const user = userEvent.setup();
		const { rerender } = render(<BookSearch books={first} />);
		await user.type(screen.getByLabelText('Search books'), 'DUN');
		expect(titles()).toEqual([]);
		rerender(<BookSearch books={second} />);
		expect(titles()).toEqual(['Dune']);
	});
});
