// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './01-product-card.jsx';

afterEach(cleanup);

const mouse = { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 2499, inStock: true };
const keyboard = { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 8999, inStock: false };

describe('ProductCard', () => {
	test('shows the product name in a level 3 heading', () => {
		render(<ProductCard product={mouse} />);
		expect(screen.getByRole('heading', { level: 3, name: 'Wireless Mouse' })).toBeTruthy();
	});

	test('shows the category', () => {
		render(<ProductCard product={mouse} />);
		expect(screen.getByText('Electronics')).toBeTruthy();
	});

	test('shows the price in dollars with two decimals', () => {
		render(<ProductCard product={mouse} />);
		expect(screen.getByText('$24.99')).toBeTruthy();
	});

	test('keeps the trailing zero when the price has whole tens of cents', () => {
		render(<ProductCard product={{ ...mouse, price: 650 }} />);
		expect(screen.getByText('$6.50')).toBeTruthy();
	});

	test('says "In stock" for a product that is in stock', () => {
		render(<ProductCard product={mouse} />);
		expect(screen.getByText('In stock')).toBeTruthy();
		expect(screen.queryByText('Out of stock')).toBeNull();
	});

	test('says "Out of stock" for a product that is not in stock', () => {
		render(<ProductCard product={keyboard} />);
		expect(screen.getByText('Out of stock')).toBeTruthy();
		expect(screen.queryByText('In stock')).toBeNull();
	});

	test('calls onAdd with the product when the user clicks "Add to cart"', async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<ProductCard product={mouse} onAdd={onAdd} />);
		await user.click(screen.getByRole('button', { name: 'Add to cart' }));
		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onAdd).toHaveBeenCalledWith(mouse);
	});

	test('has no "Add to cart" button when the product is out of stock', () => {
		render(<ProductCard product={keyboard} onAdd={() => {}} />);
		expect(screen.getByText('Out of stock')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Add to cart' })).toBeNull();
	});

	test('does not crash when the user clicks "Add to cart" and no onAdd was passed', async () => {
		const user = userEvent.setup();
		render(<ProductCard product={mouse} />);
		await user.click(screen.getByRole('button', { name: 'Add to cart' }));
		expect(screen.getByText('In stock')).toBeTruthy();
	});
});
