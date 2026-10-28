// The lifecycle of a bookstore order: pending, then paid, then shipped, then delivered.
// A pending or paid order can also be cancelled.
//
// Each stage has its own data. A shipped order has a tracking number, and a pending order can't have one.
// Model the lifecycle as a discriminated union, so the compiler rejects an order that makes no sense:
// - Write PaidOrder, ShippedOrder, DeliveredOrder, and CancelledOrder. PendingOrder is done for you.
//   Every order has a status (the string that names its stage), an id, and items.
//   - paid also has paidAt (a Date).
//   - shipped has what paid has, plus shippedAt (a Date) and trackingNumber (a string).
//   - delivered has what shipped has, plus deliveredAt (a Date).
//   - cancelled has cancelledAt (a Date) and reason (a string), and nothing about payment or shipping.
// - Write Order: the union of all five.
// - Type each function so only the right stage can go in: payOrder takes a PendingOrder, and so on.
//   Calling shipOrder with a pending order must be a compile error.
// - In orderTotal, trackingNumberOf, and describeOrder, use the status to narrow the type.
//   Handle every status. assertNever makes the compiler complain if a case is missing.
//
// The comment above each function is its spec.

export type OrderItem = {
	sku: string;
	quantity: number;
	unitPrice: number;
};

export type PendingOrder = {
	status: 'pending';
	id: number;
	items: OrderItem[];
};

// TODO: PaidOrder, ShippedOrder, DeliveredOrder, CancelledOrder

// TODO: Order

// Call this in the default branch of a switch over the status. It compiles only when every case was handled.
function assertNever(value: never): never {
	throw new Error(`Unhandled order: ${JSON.stringify(value)}`);
}

// A new order that is waiting for payment.
export function createOrder(id, items) {
	// TODO
}

// The same order, now paid at paidAt.
export function payOrder(order, paidAt) {
	// TODO
}

// The same order, now shipped at shippedAt with its tracking number.
export function shipOrder(order, trackingNumber, shippedAt) {
	// TODO
}

// The same order, now delivered at deliveredAt.
export function deliverOrder(order, deliveredAt) {
	// TODO
}

// A cancelled order with the same id and items. Only a pending or paid order can be cancelled.
export function cancelOrder(order, reason, cancelledAt) {
	// TODO
}

// The sum of quantity × unitPrice over the items, for an order in any stage.
export function orderTotal(order) {
	// TODO
}

// The tracking number of a shipped or delivered order. undefined for every other stage.
export function trackingNumberOf(order) {
	// TODO
}

// One sentence about the order:
// pending:   "Order 7: waiting for payment"
// paid:      "Order 7: paid on 2026-03-01"           (the date part of paidAt in UTC, like 2026-03-01)
// shipped:   "Order 7: shipped, tracking ABC123"
// delivered: "Order 7: delivered on 2026-03-05"      (the date part of deliveredAt in UTC)
// cancelled: "Order 7: cancelled (changed my mind)"  (the reason in parentheses)
export function describeOrder(order) {
	// TODO
}
