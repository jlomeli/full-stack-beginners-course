import { describe, expect, expectTypeOf, test } from 'vitest';
import {
	cancelOrder,
	createOrder,
	deliverOrder,
	describeOrder,
	orderTotal,
	payOrder,
	shipOrder,
	trackingNumberOf,
	type CancelledOrder,
	type DeliveredOrder,
	type Order,
	type OrderItem,
	type PaidOrder,
	type PendingOrder,
	type ShippedOrder,
} from './03-orders.ts';

const items: OrderItem[] = [
	{ sku: 'DUNE', quantity: 2, unitPrice: 9.5 },
	{ sku: 'EMMA', quantity: 1, unitPrice: 6 },
];
const march1 = new Date('2026-03-01T10:00:00Z');
const march2 = new Date('2026-03-02T10:00:00Z');
const march5 = new Date('2026-03-05T10:00:00Z');

const pending = createOrder(7, items);
const paid = payOrder(pending, march1);
const shipped = shipOrder(paid, 'ABC123', march2);
const delivered = deliverOrder(shipped, march5);
const cancelled = cancelOrder(paid, 'changed my mind', march2);

describe('types', () => {
	test('the stages are named by their status', () => {
		expectTypeOf<Order['status']>().toEqualTypeOf<'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'>();
		expectTypeOf<PendingOrder['status']>().toEqualTypeOf<'pending'>();
		expectTypeOf<PaidOrder['status']>().toEqualTypeOf<'paid'>();
		expectTypeOf<ShippedOrder['status']>().toEqualTypeOf<'shipped'>();
		expectTypeOf<DeliveredOrder['status']>().toEqualTypeOf<'delivered'>();
		expectTypeOf<CancelledOrder['status']>().toEqualTypeOf<'cancelled'>();
	});
	test('Order is the union of the five stages', () => {
		expectTypeOf<Order>().toEqualTypeOf<PendingOrder | PaidOrder | ShippedOrder | DeliveredOrder | CancelledOrder>();
	});
	test('every stage has an id and items', () => {
		expectTypeOf<Order['id']>().toEqualTypeOf<number>();
		expectTypeOf<Order['items']>().toEqualTypeOf<OrderItem[]>();
	});
	test('each stage has exactly the data it needs', () => {
		expectTypeOf<PaidOrder['paidAt']>().toEqualTypeOf<Date>();
		expectTypeOf<ShippedOrder['paidAt']>().toEqualTypeOf<Date>();
		expectTypeOf<ShippedOrder['shippedAt']>().toEqualTypeOf<Date>();
		expectTypeOf<ShippedOrder['trackingNumber']>().toEqualTypeOf<string>();
		expectTypeOf<DeliveredOrder['trackingNumber']>().toEqualTypeOf<string>();
		expectTypeOf<DeliveredOrder['deliveredAt']>().toEqualTypeOf<Date>();
		expectTypeOf<CancelledOrder['cancelledAt']>().toEqualTypeOf<Date>();
		expectTypeOf<CancelledOrder['reason']>().toEqualTypeOf<string>();
	});
	test('a stage has no data from a stage it has not reached', () => {
		expectTypeOf<PendingOrder>().not.toHaveProperty('paidAt');
		expectTypeOf<PendingOrder>().not.toHaveProperty('trackingNumber');
		expectTypeOf<PaidOrder>().not.toHaveProperty('trackingNumber');
		expectTypeOf<ShippedOrder>().not.toHaveProperty('deliveredAt');
		expectTypeOf<CancelledOrder>().not.toHaveProperty('paidAt');
		expectTypeOf<CancelledOrder>().not.toHaveProperty('trackingNumber');
	});
	test('each transition returns the next stage', () => {
		expectTypeOf(createOrder).returns.toEqualTypeOf<PendingOrder>();
		expectTypeOf(payOrder).returns.toEqualTypeOf<PaidOrder>();
		expectTypeOf(shipOrder).returns.toEqualTypeOf<ShippedOrder>();
		expectTypeOf(deliverOrder).returns.toEqualTypeOf<DeliveredOrder>();
		expectTypeOf(cancelOrder).returns.toEqualTypeOf<CancelledOrder>();
	});
	test('each transition accepts only the stages it can start from', () => {
		expectTypeOf(payOrder).parameter(0).toEqualTypeOf<PendingOrder>();
		expectTypeOf(shipOrder).parameter(0).toEqualTypeOf<PaidOrder>();
		expectTypeOf(deliverOrder).parameter(0).toEqualTypeOf<ShippedOrder>();
		expectTypeOf(cancelOrder).parameter(0).toEqualTypeOf<PendingOrder | PaidOrder>();
	});
	test('the compiler rejects a transition from the wrong stage', () => {
		// The calls below are never run. The compiler checks them, and each must be an error.
		const neverCalled = () => {
			// @ts-expect-error a paid order can't be paid again
			payOrder(paid, march1);
			// @ts-expect-error a pending order can't ship before it is paid
			shipOrder(pending, 'ABC123', march2);
			// @ts-expect-error a paid order can't be delivered before it ships
			deliverOrder(paid, march5);
			// @ts-expect-error a shipped order can't be cancelled
			cancelOrder(shipped, 'too late', march5);
		};
		expect(neverCalled).toBeTypeOf('function');
	});
	test('the compiler rejects an order with data from the wrong stage', () => {
		// @ts-expect-error a pending order has no tracking number
		const a: Order = { status: 'pending', id: 1, items, trackingNumber: 'ABC123' };
		// @ts-expect-error a shipped order needs a tracking number
		const b: Order = { status: 'shipped', id: 1, items, paidAt: march1, shippedAt: march2 };
		// @ts-expect-error a cancelled order has no payment date
		const c: Order = { status: 'cancelled', id: 1, items, cancelledAt: march1, reason: 'x', paidAt: march1 };
		// @ts-expect-error there is no "refunded" stage
		const d: Order = { status: 'refunded', id: 1, items };
		expect([a, b, c, d]).toHaveLength(4);
	});
	test('checking the status narrows the type', () => {
		function narrow(order: Order) {
			if (order.status === 'shipped') {
				expectTypeOf(order).toEqualTypeOf<ShippedOrder>();
			}
			if (order.status === 'cancelled') {
				expectTypeOf(order.reason).toBeString();
			}
		}
		expect(narrow).toBeTypeOf('function');
	});
	test('orderTotal, trackingNumberOf, and describeOrder accept an order at any stage', () => {
		expectTypeOf(orderTotal).toEqualTypeOf<(order: Order) => number>();
		expectTypeOf(trackingNumberOf).toEqualTypeOf<(order: Order) => string | undefined>();
		expectTypeOf(describeOrder).toEqualTypeOf<(order: Order) => string>();
	});
});

describe('createOrder', () => {
	test('makes a pending order', () => {
		expect(pending).toEqual({ status: 'pending', id: 7, items });
	});
});

describe('transitions', () => {
	test('payOrder marks the order paid', () => {
		expect(paid).toEqual({ status: 'paid', id: 7, items, paidAt: march1 });
	});
	test('shipOrder marks the order shipped with a tracking number', () => {
		expect(shipped).toEqual({
			status: 'shipped',
			id: 7,
			items,
			paidAt: march1,
			shippedAt: march2,
			trackingNumber: 'ABC123',
		});
	});
	test('deliverOrder marks the order delivered and keeps its history', () => {
		expect(delivered).toEqual({
			status: 'delivered',
			id: 7,
			items,
			paidAt: march1,
			shippedAt: march2,
			trackingNumber: 'ABC123',
			deliveredAt: march5,
		});
	});
	test('cancelOrder keeps only the id and items, and records when and why', () => {
		expect(cancelled).toEqual({ status: 'cancelled', id: 7, items, cancelledAt: march2, reason: 'changed my mind' });
	});
	test('cancelOrder works on a pending order too', () => {
		expect(cancelOrder(pending, 'duplicate', march1)).toEqual({
			status: 'cancelled',
			id: 7,
			items,
			cancelledAt: march1,
			reason: 'duplicate',
		});
	});
	test('a transition returns a new order and leaves the old one alone', () => {
		expect(pending.status).toBe('pending');
		expect(paid.status).toBe('paid');
		expect(shipped.status).toBe('shipped');
	});
});

describe('orderTotal', () => {
	test('adds quantity × unitPrice for every item', () => expect(orderTotal(pending)).toBe(25));
	test('is the same at every stage', () => {
		for (const order of [pending, paid, shipped, delivered, cancelled]) {
			expect(orderTotal(order)).toBe(25);
		}
	});
	test('is 0 for an order with no items', () => expect(orderTotal(createOrder(1, []))).toBe(0));
});

describe('trackingNumberOf', () => {
	test('is the tracking number once the order has shipped', () => {
		expect(trackingNumberOf(shipped)).toBe('ABC123');
		expect(trackingNumberOf(delivered)).toBe('ABC123');
	});
	test('is undefined before shipping and for a cancelled order', () => {
		expect(trackingNumberOf(pending)).toBeUndefined();
		expect(trackingNumberOf(paid)).toBeUndefined();
		expect(trackingNumberOf(cancelled)).toBeUndefined();
	});
});

describe('describeOrder', () => {
	test('describes a pending order', () => expect(describeOrder(pending)).toBe('Order 7: waiting for payment'));
	test('describes a paid order', () => expect(describeOrder(paid)).toBe('Order 7: paid on 2026-03-01'));
	test('describes a shipped order', () => {
		expect(describeOrder(shipped)).toBe('Order 7: shipped, tracking ABC123');
	});
	test('describes a delivered order', () => {
		expect(describeOrder(delivered)).toBe('Order 7: delivered on 2026-03-05');
	});
	test('describes a cancelled order', () => {
		expect(describeOrder(cancelled)).toBe('Order 7: cancelled (changed my mind)');
	});
});
