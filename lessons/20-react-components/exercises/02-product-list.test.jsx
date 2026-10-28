// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList, categoriesOf } from './02-product-list.jsx';

afterEach(cleanup);

const products = [
	{ id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 2499, inStock: true },
	{ id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 8999, inStock: false },
	{ id: 3, name: 'Desk Lamp', category: 'Home', price: 3450, inStock: true },
	{ id: 4, name: 'Coffee Mug', category: 'Home', price: 1200, inStock: false },
	{ id: 5, name: 'Notebook', category: 'Stationery', price: 650, inStock: true },
];

const names = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

// This test comes first on purpose: React prints each missing-key warning once per file.
test('gives every list item a key, so React prints no warning', () => {
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	render(<ProductList products={products} />);
	expect(screen.getAllByRole('listitem')).toHaveLength(5);
	const warnings = error.mock.calls.filter((call) => String(call[0]).includes('key'));
	error.mockRestore();
	expect(warnings).toEqual([]);
});

describe('categoriesOf', () => {
	test('lists each category once, in alphabetical order', () => {
		expect(categoriesOf(products)).toEqual(['Electronics', 'Home', 'Stationery']);
	});

	test('lists alphabetically even when the products are not in order', () => {
		const shuffled = [products[4], products[2], products[0], products[3]];
		expect(categoriesOf(shuffled)).toEqual(['Electronics', 'Home', 'Stationery']);
	});

	test('returns an empty array for no products', () => {
		expect(categoriesOf([])).toEqual([]);
	});

	test('does not reorder the products array it was given', () => {
		const copy = [...products];
		expect(categoriesOf(products)).toHaveLength(3);
		expect(products).toEqual(copy);
	});
});

describe('ProductList', () => {
	test('shows every product in its original order by default', () => {
		render(<ProductList products={products} />);
		expect(names()).toEqual(['Wireless Mouse', 'Mechanical Keyboard', 'Desk Lamp', 'Coffee Mug', 'Notebook']);
		expect(screen.getAllByRole('listitem')).toHaveLength(5);
	});

	test('says how many products it shows out of the total', () => {
		render(<ProductList products={products} />);
		expect(screen.getByText('Showing 5 of 5 products.')).toBeTruthy();
	});

	test('shows a product card inside each list item', () => {
		render(<ProductList products={products} />);
		const [first] = screen.getAllByRole('listitem');
		expect(within(first).getByText('$24.99')).toBeTruthy();
		expect(within(first).getByRole('button', { name: 'Add to cart' })).toBeTruthy();
	});

	test('keeps only the chosen category', () => {
		render(<ProductList products={products} category="Home" />);
		expect(names()).toEqual(['Desk Lamp', 'Coffee Mug']);
		expect(screen.getByText('Showing 2 of 5 products.')).toBeTruthy();
	});

	test('treats the category "all" as every category', () => {
		render(<ProductList products={products} category="all" />);
		expect(screen.getAllByRole('listitem')).toHaveLength(5);
	});

	test('keeps only products in stock when inStockOnly is true', () => {
		render(<ProductList products={products} inStockOnly />);
		expect(names()).toEqual(['Wireless Mouse', 'Desk Lamp', 'Notebook']);
		expect(screen.getByText('Showing 3 of 5 products.')).toBeTruthy();
	});

	test('keeps products whose name contains the search text, ignoring case and outer spaces', () => {
		render(<ProductList products={products} search="  MOUSE " />);
		expect(names()).toEqual(['Wireless Mouse']);
	});

	test('applies the search, category, and stock filters together', () => {
		render(<ProductList products={products} search="e" category="Home" inStockOnly />);
		expect(names()).toEqual(['Desk Lamp']);
		expect(screen.getByText('Showing 1 of 5 products.')).toBeTruthy();
	});

	test('shows a message and no list when nothing matches', () => {
		render(<ProductList products={products} search="zzz" />);
		expect(screen.getByText('No products match your filters.')).toBeTruthy();
		expect(screen.queryByRole('list')).toBeNull();
		expect(screen.queryByText(/^Showing/)).toBeNull();
	});

	test('passes onAdd to each card', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<ProductList products={products} onAdd={onAdd} />);
		const lamp = screen.getAllByRole('listitem')[2];
		await user.click(within(lamp).getByRole('button', { name: 'Add to cart' }));
		expect(onAdd).toHaveBeenCalledWith(products[2]);
	});

	test('shows the text of a product as text, not as HTML', () => {
		const tricky = [{ id: 1, name: '<b>Bold</b> Mug', category: 'Home', price: 500, inStock: true }];
		render(<ProductList products={tricky} />);
		expect(screen.getByText('<b>Bold</b> Mug')).toBeTruthy();
	});
});
