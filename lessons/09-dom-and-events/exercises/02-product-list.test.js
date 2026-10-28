// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { filterProducts, setupProductList } from './02-product-list.js';

const catalog = () => [
	{ id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 2499, inStock: true },
	{ id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 8999, inStock: false },
	{ id: 3, name: 'Desk Lamp', category: 'Home', price: 3450, inStock: true },
	{ id: 4, name: 'Coffee Mug', category: 'Home', price: 1200, inStock: false },
	{ id: 5, name: 'Notebook', category: 'Stationery', price: 650, inStock: true },
	{ id: 6, name: 'Gel Pens', category: 'Stationery', price: 1099, inStock: true },
];

const ids = (products) => products.map((product) => product.id);

describe('filterProducts', () => {
	test('with no filters, returns every product in the original order', () => {
		expect(ids(filterProducts(catalog()))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	test('search keeps products whose name contains the text, ignoring case', () => {
		expect(ids(filterProducts(catalog(), { search: 'DESK' }))).toEqual([3]);
		expect(ids(filterProducts(catalog(), { search: 'e' }))).toEqual([1, 2, 3, 4, 5, 6]);
		expect(ids(filterProducts(catalog(), { search: 'mechanical' }))).toEqual([2]);
	});

	test('search ignores spaces at the ends', () => {
		expect(ids(filterProducts(catalog(), { search: '  mug ' }))).toEqual([4]);
	});

	test('search matches only the name, not the category', () => {
		expect(filterProducts(catalog(), { search: 'electronics' })).toEqual([]);
	});

	test('category keeps only that category', () => {
		expect(ids(filterProducts(catalog(), { category: 'Home' }))).toEqual([3, 4]);
	});

	test('category "all" keeps every category', () => {
		expect(ids(filterProducts(catalog(), { category: 'all' }))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	test('inStockOnly drops products that are out of stock', () => {
		expect(ids(filterProducts(catalog(), { inStockOnly: true }))).toEqual([1, 3, 5, 6]);
	});

	test('inStockOnly false keeps out-of-stock products', () => {
		expect(ids(filterProducts(catalog(), { inStockOnly: false }))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	test('combines every filter', () => {
		const filters = { search: 'e', category: 'Electronics', inStockOnly: true };
		expect(ids(filterProducts(catalog(), filters))).toEqual([1]);
	});

	test('returns an empty array when nothing matches', () => {
		expect(filterProducts(catalog(), { search: 'zzz' })).toEqual([]);
	});

	test('does not change the array it is given', () => {
		const products = Object.freeze(catalog().map((product) => Object.freeze(product)));
		const result = filterProducts(products, { inStockOnly: true });
		expect(result).toHaveLength(4);
		expect(products).toHaveLength(6);
	});
});

describe('the product list page', () => {
	const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
	let root;
	let user;

	function loadPage() {
		document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
		return document.querySelector('#product-app');
	}

	const search = () => within(root).getByLabelText('Search');
	const category = () => within(root).getByLabelText('Category');
	const inStock = () => within(root).getByLabelText('In stock only');
	const items = () => within(root).queryAllByRole('listitem');
	const names = () => [...root.querySelectorAll('#product-list .name')].map((name) => name.textContent);
	const count = () => root.querySelector('#product-count').textContent;

	beforeEach(() => {
		root = loadPage();
		user = userEvent.setup();
	});

	test('shows every product at the start, in order', () => {
		setupProductList(root, catalog());
		expect(names()).toEqual(['Wireless Mouse', 'Mechanical Keyboard', 'Desk Lamp', 'Coffee Mug', 'Notebook', 'Gel Pens']);
	});

	test('shows each product with its category and its price in dollars', () => {
		setupProductList(root, catalog());
		const [mouse, , , , notebook] = items();
		expect(mouse.querySelector('.category').textContent).toBe('Electronics');
		expect(mouse.querySelector('.price').textContent).toBe('$24.99');
		expect(notebook.querySelector('.price').textContent).toBe('$6.50');
	});

	test('marks out-of-stock products with a badge and a class, and leaves the others plain', () => {
		setupProductList(root, catalog());
		const [mouse, keyboard] = items();
		expect(within(keyboard).getByText('Out of stock')).toBeTruthy();
		expect(keyboard.classList.contains('out-of-stock')).toBe(true);
		expect(keyboard.querySelector('.badge').textContent).toBe('Out of stock');
		expect(mouse.classList.contains('out-of-stock')).toBe(false);
		expect(mouse.querySelector('.badge')).toBeNull();
		expect(names()).toHaveLength(6);
	});

	test('says how many products are showing', () => {
		setupProductList(root, catalog());
		expect(count()).toBe('Showing 6 of 6 products.');
	});

	test('the category menu lists "All categories" and then each category once, in alphabetical order', () => {
		setupProductList(root, catalog());
		const options = within(category()).getAllByRole('option');
		expect(options.map((option) => option.textContent)).toEqual(['All categories', 'Electronics', 'Home', 'Stationery']);
		expect(options.map((option) => option.value)).toEqual(['all', 'Electronics', 'Home', 'Stationery']);
	});

	test('typing in the search box filters the list as you type', async () => {
		setupProductList(root, catalog());
		await user.type(search(), 'desk');
		expect(search().value).toBe('desk');
		expect(names()).toEqual(['Desk Lamp']);
		expect(count()).toBe('Showing 1 of 6 products.');
	});

	test('search ignores upper and lower case', async () => {
		setupProductList(root, catalog());
		await user.type(search(), 'NOTE');
		expect(names()).toEqual(['Notebook']);
	});

	test('choosing a category shows only that category', async () => {
		setupProductList(root, catalog());
		await user.selectOptions(category(), 'Home');
		expect(names()).toEqual(['Desk Lamp', 'Coffee Mug']);
		expect(count()).toBe('Showing 2 of 6 products.');
	});

	test('choosing "All categories" again shows everything', async () => {
		setupProductList(root, catalog());
		await user.selectOptions(category(), 'Home');
		await user.selectOptions(category(), 'All categories');
		expect(names()).toHaveLength(6);
	});

	test('checking "In stock only" hides out-of-stock products, and unchecking brings them back', async () => {
		setupProductList(root, catalog());
		await user.click(inStock());
		expect(names()).toEqual(['Wireless Mouse', 'Desk Lamp', 'Notebook', 'Gel Pens']);
		await user.click(inStock());
		expect(names()).toHaveLength(6);
	});

	test('all three filters work together', async () => {
		setupProductList(root, catalog());
		await user.selectOptions(category(), 'Electronics');
		await user.click(inStock());
		await user.type(search(), 'mouse');
		expect(names()).toEqual(['Wireless Mouse']);
		await user.clear(search());
		expect(names()).toEqual(['Wireless Mouse']);
		await user.click(inStock());
		expect(names()).toEqual(['Wireless Mouse', 'Mechanical Keyboard']);
	});

	test('says so when no product matches, and shows no list items', async () => {
		setupProductList(root, catalog());
		await user.type(search(), 'zzz');
		expect(count()).toBe('No products match your filters.');
		expect(items()).toHaveLength(0);
	});

	test('shows product text as text, not as HTML', () => {
		setupProductList(root, [{ id: 1, name: '<b>Bold</b> Mug', category: 'Home', price: 500, inStock: true }]);
		expect(names()).toEqual(['<b>Bold</b> Mug']);
		expect(root.querySelector('#product-list b')).toBeNull();
	});

	test('works with an empty product list', () => {
		setupProductList(root, []);
		expect(items()).toHaveLength(0);
		expect(count()).toBe('No products match your filters.');
		expect(within(category()).getAllByRole('option')).toHaveLength(1);
	});
});
