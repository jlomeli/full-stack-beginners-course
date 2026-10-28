// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFilters } from './03-product-filters.jsx';

afterEach(cleanup);

function renderFilters(props = {}) {
	const handlers = { onSearchChange: vi.fn(), onCategoryChange: vi.fn(), onInStockOnlyChange: vi.fn() };
	render(
		<ProductFilters
			categories={['Electronics', 'Home']}
			search=""
			category="all"
			inStockOnly={false}
			{...handlers}
			{...props}
		/>,
	);
	return handlers;
}

describe('ProductFilters', () => {
	test('shows a search box, a category menu, and an "In stock only" checkbox, each with a label', () => {
		renderFilters();
		expect(screen.getByLabelText('Search')).toBeInstanceOf(HTMLInputElement);
		expect(screen.getByLabelText('Category')).toBeInstanceOf(HTMLSelectElement);
		expect(screen.getByLabelText('In stock only').type).toBe('checkbox');
	});

	test('lists "All categories" first, then one option per category', () => {
		renderFilters();
		const options = [...screen.getByLabelText('Category').options];
		expect(options.map((option) => option.value)).toEqual(['all', 'Electronics', 'Home']);
		expect(options.map((option) => option.textContent)).toEqual(['All categories', 'Electronics', 'Home']);
	});

	test('shows the values it is given', () => {
		renderFilters({ search: 'mug', category: 'Home', inStockOnly: true });
		expect(screen.getByLabelText('Search').value).toBe('mug');
		expect(screen.getByLabelText('Category').value).toBe('Home');
		expect(screen.getByLabelText('In stock only').checked).toBe(true);
	});

	test('calls onSearchChange with the new text for each key the user types', async () => {
		const user = userEvent.setup();
		const { onSearchChange } = renderFilters();
		await user.type(screen.getByLabelText('Search'), 'mu');
		expect(onSearchChange.mock.calls).toEqual([['m'], ['u']]);
	});

	test('calls onCategoryChange with the category the user picks', async () => {
		const user = userEvent.setup();
		const { onCategoryChange } = renderFilters();
		await user.selectOptions(screen.getByLabelText('Category'), 'Home');
		expect(onCategoryChange).toHaveBeenCalledWith('Home');
	});

	test('calls onInStockOnlyChange with true when the user checks the box', async () => {
		const user = userEvent.setup();
		const { onInStockOnlyChange } = renderFilters();
		await user.click(screen.getByLabelText('In stock only'));
		expect(onInStockOnlyChange).toHaveBeenCalledWith(true);
	});

	test('calls onInStockOnlyChange with false when the user unchecks the box', async () => {
		const user = userEvent.setup();
		const { onInStockOnlyChange } = renderFilters({ inStockOnly: true });
		await user.click(screen.getByLabelText('In stock only'));
		expect(onInStockOnlyChange).toHaveBeenCalledWith(false);
	});

	test('does not change the values on its own: the parent owns them', async () => {
		const user = userEvent.setup();
		renderFilters({ search: 'mug' });
		await user.type(screen.getByLabelText('Search'), 'x');
		expect(screen.getByLabelText('Search').value).toBe('mug');
	});

	test('does not reload the page when the form is submitted', () => {
		renderFilters();
		const form = screen.getByLabelText('Search').closest('form');
		expect(form).not.toBeNull();
		const wasNotPrevented = fireEvent.submit(form);
		expect(wasNotPrevented).toBe(false);
	});
});
