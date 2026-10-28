// @vitest-environment jsdom
// This file tests ../product-app.jsx, which joins your three components.
// It passes once exercises 1 to 3 pass. There is nothing to write here.
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductApp } from '../product-app.jsx';
import { products } from '../products.js';

afterEach(cleanup);

const names = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

describe('ProductApp', () => {
	test('shows every product at first', () => {
		render(<ProductApp products={products} />);
		expect(screen.getByText('Showing 8 of 8 products.')).toBeTruthy();
	});

	test('narrows the list as the user types in the search box', async () => {
		const user = userEvent.setup();
		render(<ProductApp products={products} />);
		await user.type(screen.getByLabelText('Search'), 'desk');
		expect(names()).toEqual(['Desk Lamp', 'Standing Desk Mat']);
		expect(screen.getByLabelText('Search').value).toBe('desk');
	});

	test('narrows the list to the category the user picks', async () => {
		const user = userEvent.setup();
		render(<ProductApp products={products} />);
		await user.selectOptions(screen.getByLabelText('Category'), 'Stationery');
		expect(names()).toEqual(['Notebook', 'Gel Pens (12 pack)']);
	});

	test('hides out-of-stock products when the user checks "In stock only"', async () => {
		const user = userEvent.setup();
		render(<ProductApp products={products} />);
		await user.click(screen.getByLabelText('In stock only'));
		expect(screen.getByText('Showing 5 of 8 products.')).toBeTruthy();
		expect(screen.queryByText('Mechanical Keyboard')).toBeNull();
	});

	test('shows the empty message when the filters match nothing', async () => {
		const user = userEvent.setup();
		render(<ProductApp products={products} />);
		await user.type(screen.getByLabelText('Search'), 'zzz');
		expect(screen.getByText('No products match your filters.')).toBeTruthy();
	});

	test('counts the products the user adds to the cart', async () => {
		const user = userEvent.setup();
		render(<ProductApp products={products} />);
		expect(screen.getByText('Cart: 0 items')).toBeTruthy();
		await user.click(screen.getAllByRole('button', { name: 'Add to cart' })[0]);
		await user.click(screen.getAllByRole('button', { name: 'Add to cart' })[1]);
		expect(screen.getByText('Cart: 2 items')).toBeTruthy();
	});
});
