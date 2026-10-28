// A cart is an array of items. An item looks like this:
// { id: 'apple', name: 'Apple', price: 75, quantity: 3 }
// Prices are whole cents: 75 means $0.75.
//
// None of these functions may change the cart they're given, or any item in it.
// Return a new cart instead.

// Return a new cart with one more of `product` in it.
// `product` looks like { id: 'apple', name: 'Apple', price: 75 }.
// - If the cart already has an item with the same id, add 1 to its quantity.
// - Otherwise, add the product to the end of the cart with quantity 1.
export function addItem(cart, product) {
	// TODO
}

// Return a new cart where the item with this id has the new quantity.
// - A quantity of 0 or less removes the item.
// - If no item has this id, return a cart with the same items.
export function setQuantity(cart, id, quantity) {
	// TODO
}

// Return the cart's totals as an object: { itemCount, subtotal, tax, total }.
// - itemCount: the sum of every item's quantity
// - subtotal: the sum of price × quantity for every item, in cents
// - tax: subtotal × taxRate, rounded to the nearest cent
// - total: subtotal + tax
// taxRate is a decimal: 0.08 means 8%.
export function cartTotals(cart, taxRate) {
	// TODO
}
