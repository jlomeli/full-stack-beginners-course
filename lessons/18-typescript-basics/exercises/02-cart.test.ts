import { describe, expect, expectTypeOf, test } from 'vitest';
import {
	applyDiscount,
	cartTotal,
	lineTotal,
	shippingCost,
	subtotal,
	type CartItem,
	type ShippingMethod,
} from './02-cart.ts';

const notebook: CartItem = { name: 'Notebook', price: 4.5, quantity: 2 };
const pen: CartItem = { name: 'Pen', price: 1.25, quantity: 4 };
const backpack: CartItem = { name: 'Backpack', price: 60, quantity: 1 };

describe('types', () => {
	test('CartItem has a name, a price, and a quantity', () => {
		expectTypeOf<CartItem>().toEqualTypeOf<{ name: string; price: number; quantity: number }>();
	});
	test('ShippingMethod is "standard" or "express" and nothing else', () => {
		expectTypeOf<ShippingMethod>().toEqualTypeOf<'standard' | 'express'>();
	});
	test('lineTotal takes a CartItem and returns a number', () => {
		expectTypeOf(lineTotal).toEqualTypeOf<(item: CartItem) => number>();
	});
	test('subtotal takes CartItems and returns a number', () => {
		expectTypeOf(subtotal).toEqualTypeOf<(items: CartItem[]) => number>();
	});
	test('shippingCost takes an amount and a ShippingMethod and returns a number', () => {
		expectTypeOf(shippingCost).toEqualTypeOf<(amount: number, method: ShippingMethod) => number>();
	});
	test('applyDiscount takes an amount and a code and returns a number', () => {
		expectTypeOf(applyDiscount).toEqualTypeOf<(amount: number, code: string) => number>();
	});
	test('cartTotal takes CartItems, a ShippingMethod, and an optional code, and returns a number', () => {
		expectTypeOf(cartTotal).toEqualTypeOf<(items: CartItem[], method: ShippingMethod, code?: string) => number>();
	});
});

describe('lineTotal and subtotal', () => {
	test('a line total is price times quantity', () => expect(lineTotal(notebook)).toBe(9));
	test('the subtotal adds up every line', () => expect(subtotal([notebook, pen])).toBe(14));
	test('an empty cart has a subtotal of 0', () => expect(subtotal([])).toBe(0));
});

describe('shippingCost', () => {
	test('standard shipping costs 5 under 50', () => expect(shippingCost(49.99, 'standard')).toBe(5));
	test('express shipping costs 15 under 50', () => expect(shippingCost(10, 'express')).toBe(15));
	test('shipping is free from 50 up', () => {
		expect(shippingCost(50, 'standard')).toBe(0);
		expect(shippingCost(80, 'express')).toBe(0);
	});
});

describe('applyDiscount', () => {
	test('SAVE10 takes 10% off', () => expect(applyDiscount(40, 'SAVE10')).toBe(36));
	test('codes ignore case', () => expect(applyDiscount(40, 'halfoff')).toBe(20));
	test('an unknown code gives no discount', () => expect(applyDiscount(40, 'FREESTUFF')).toBe(40));
	test('an empty code gives no discount', () => expect(applyDiscount(40, '')).toBe(40));
});

describe('cartTotal', () => {
	test('adds shipping as a number, not as text', () => {
		expect(cartTotal([notebook, pen], 'standard')).toBe(19);
	});
	test('adds express shipping', () => expect(cartTotal([notebook, pen], 'express')).toBe(29));
	test('ships for free when the subtotal is 50 or more', () => {
		expect(cartTotal([backpack], 'standard')).toBe(60);
	});
	test('bases shipping on the discounted subtotal', () => {
		expect(cartTotal([backpack], 'standard', 'save10')).toBe(54);
		expect(cartTotal([backpack], 'standard', 'HALFOFF')).toBe(35);
	});
});
