import { describe, expect, test } from 'vitest';
import { addItem, cartTotals, setQuantity } from './02-shopping-cart.js';

const apple = { id: 'apple', name: 'Apple', price: 75 };
const bread = { id: 'bread', name: 'Bread', price: 250 };
const cheese = { id: 'cheese', name: 'Cheese', price: 499 };

const makeCart = () => [
	{ ...apple, quantity: 3 },
	{ ...bread, quantity: 1 },
];

describe('addItem', () => {
	test('adds a new product to an empty cart with quantity 1', () => {
		expect(addItem([], apple)).toEqual([{ id: 'apple', name: 'Apple', price: 75, quantity: 1 }]);
	});

	test('adds a new product to the end of the cart', () => {
		expect(addItem(makeCart(), cheese)).toEqual([
			{ ...apple, quantity: 3 },
			{ ...bread, quantity: 1 },
			{ ...cheese, quantity: 1 },
		]);
	});

	test('adding a product that is already in the cart adds 1 to its quantity', () => {
		expect(addItem(makeCart(), bread)).toEqual([
			{ ...apple, quantity: 3 },
			{ ...bread, quantity: 2 },
		]);
	});

	test('leaves the original cart and the product unchanged when adding a new product', () => {
		const cart = makeCart();
		const product = { ...cheese };
		expect(addItem(cart, product)).toHaveLength(3);
		expect(cart).toEqual(makeCart());
		expect(product).toEqual(cheese);
	});

	test('leaves the original cart and its items unchanged when adding a product already in it', () => {
		const cart = makeCart();
		const breadItem = cart[1];
		expect(addItem(cart, bread)[1].quantity).toBe(2);
		expect(cart).toEqual(makeCart());
		expect(breadItem.quantity).toBe(1);
	});
});

describe('setQuantity', () => {
	test('changes the quantity of the matching item only', () => {
		expect(setQuantity(makeCart(), 'apple', 5)).toEqual([
			{ ...apple, quantity: 5 },
			{ ...bread, quantity: 1 },
		]);
	});

	test('a quantity of 0 removes the item', () => {
		expect(setQuantity(makeCart(), 'apple', 0)).toEqual([{ ...bread, quantity: 1 }]);
	});

	test('a negative quantity removes the item', () => {
		expect(setQuantity(makeCart(), 'bread', -1)).toEqual([{ ...apple, quantity: 3 }]);
	});

	test('an id that is not in the cart leaves every item as it was', () => {
		expect(setQuantity(makeCart(), 'cheese', 4)).toEqual(makeCart());
	});

	test('leaves the original cart and its items unchanged', () => {
		const cart = makeCart();
		const appleItem = cart[0];
		expect(setQuantity(cart, 'apple', 10)[0].quantity).toBe(10);
		expect(setQuantity(cart, 'bread', 0)).toHaveLength(1);
		expect(cart).toEqual(makeCart());
		expect(appleItem.quantity).toBe(3);
	});
});

describe('cartTotals', () => {
	test('an empty cart totals zero', () => {
		expect(cartTotals([], 0.08)).toEqual({ itemCount: 0, subtotal: 0, tax: 0, total: 0 });
	});

	test('counts every unit and multiplies price by quantity', () => {
		const { itemCount, subtotal } = cartTotals(makeCart(), 0);
		expect(itemCount).toBe(4);
		expect(subtotal).toBe(475);
	});

	test('rounds tax to the nearest cent and adds it to the total', () => {
		// 475 × 0.0825 = 39.1875 cents, which rounds to 39
		expect(cartTotals(makeCart(), 0.0825)).toEqual({ itemCount: 4, subtotal: 475, tax: 39, total: 514 });
	});

	test('rounds half a cent of tax up', () => {
		// 250 × 0.05 = 12.5 cents, which rounds to 13
		expect(cartTotals([{ ...bread, quantity: 1 }], 0.05)).toEqual({ itemCount: 1, subtotal: 250, tax: 13, total: 263 });
	});
});
