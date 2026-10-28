// Shopping cart totals, written in plain JavaScript for lesson 07.
//
// Convert this file to TypeScript:
// - Export a type named CartItem: an object with a name (string), a price in dollars (number),
//   and a quantity (number).
// - Export a type named ShippingMethod that allows only the strings "standard" and "express".
// - Give every parameter and every return value a type.
// - Give SHIPPING_COSTS and DISCOUNT_PERCENTS types too. The compiler tells you why.
// - Fix each error the compiler reports. Some of them are bugs that were here all along.
//
// The comment above each function is its spec. Keep the behavior it describes.

const SHIPPING_COSTS = {
	standard: '5',
	express: 15,
};

const DISCOUNT_PERCENTS = {
	SAVE10: 10,
	HALFOFF: 50,
};

// The price of one line of the cart: price × quantity.
export function lineTotal(item) {
	return item.price * item.quantity;
}

// The sum of every line total. 0 for an empty cart.
export function subtotal(items) {
	return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

// Shipping is free when the amount is 50 or more. Otherwise "standard" costs 5 and "express" costs 15.
export function shippingCost(amount, method) {
	if (amount >= 50) {
		return 0;
	}
	return SHIPPING_COSTS[method];
}

// The amount after the discount for a code. Codes ignore case, so "save10" works like "SAVE10".
// An unknown or empty code gives no discount.
export function applyDiscount(amount, code) {
	const percent = DISCOUNT_PERCENTS[code.toUppercase()] ?? 0;
	return amount - (amount * percent) / 100;
}

// What the customer pays: the discounted subtotal plus shipping.
// Shipping is based on the discounted subtotal. code is "" when it isn't given.
export function cartTotal(items, method, code = '') {
	const discounted = applyDiscount(subtotal(items), code);
	return discounted + shippingCost(discounted, method);
}
