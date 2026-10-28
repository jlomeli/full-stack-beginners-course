import { describe, expect, test } from 'vitest';
import { biggestCategory, groupByCategory, inMonth, totalsByCategory } from './03-transactions.js';

const coffee = { id: 1, date: '2026-02-28', description: 'Bean There', category: 'eating out', amount: 450 };
const market = { id: 2, date: '2026-03-01', description: 'Corner Market', category: 'groceries', amount: 2350 };
const rent = { id: 3, date: '2026-03-01', description: 'March rent', category: 'rent', amount: 120000 };
const tacos = { id: 4, date: '2026-03-14', description: 'Taco Truck', category: 'eating out', amount: 1275 };
const superstore = { id: 5, date: '2026-03-31', description: 'Superstore', category: 'groceries', amount: 3070 };
const bakery = { id: 6, date: '2026-04-01', description: 'Bakery', category: 'groceries', amount: 600 };

const transactions = [coffee, market, rent, tacos, superstore, bakery];

describe('inMonth', () => {
	test('keeps only the transactions from that month, first day to last', () => {
		expect(inMonth(transactions, '2026-03')).toEqual([market, rent, tacos, superstore]);
	});
	test('a month with no transactions gives an empty array', () => {
		expect(inMonth(transactions, '2025-03')).toEqual([]);
	});
});

describe('groupByCategory', () => {
	test('puts each transaction under its category, in the original order', () => {
		expect(groupByCategory(transactions)).toEqual({
			'eating out': [coffee, tacos],
			groceries: [market, superstore, bakery],
			rent: [rent],
		});
	});
	test('no transactions gives an empty object', () => {
		expect(groupByCategory([])).toEqual({});
	});
});

describe('totalsByCategory', () => {
	test('adds up the amounts in each category', () => {
		expect(totalsByCategory(transactions)).toEqual({
			'eating out': 1725,
			groceries: 6020,
			rent: 120000,
		});
	});
	test('no transactions gives an empty object', () => {
		expect(totalsByCategory([])).toEqual({});
	});
});

describe('biggestCategory', () => {
	test('returns the category with the largest total, and that total', () => {
		expect(biggestCategory(transactions)).toEqual({ category: 'rent', total: 120000 });
	});
	test('works on one month of transactions', () => {
		const withoutRent = inMonth(transactions, '2026-03').filter((transaction) => transaction.category !== 'rent');
		expect(biggestCategory(withoutRent)).toEqual({ category: 'groceries', total: 5420 });
	});
	test('the category that appears first wins a tie', () => {
		const tied = [
			{ id: 1, date: '2026-05-01', description: 'Bus pass', category: 'transport', amount: 500 },
			{ id: 2, date: '2026-05-02', description: 'Movie', category: 'fun', amount: 500 },
		];
		expect(biggestCategory(tied)).toEqual({ category: 'transport', total: 500 });
	});
	test('returns null when there are no transactions', () => {
		expect(biggestCategory([])).toBe(null);
	});
});
