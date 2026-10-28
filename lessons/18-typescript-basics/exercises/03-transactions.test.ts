import { describe, expect, expectTypeOf, test } from 'vitest';
import {
	describeLargestExpense,
	groupByCategory,
	largestExpense,
	totalsByCategory,
	type Transaction,
} from './03-transactions.ts';

const paycheck: Transaction = { id: 1, description: 'Paycheck', amount: 2500, category: 'income' };
const rent: Transaction = { id: 2, description: 'Rent', amount: -1200, category: 'housing' };
const groceries: Transaction = { id: 3, description: 'Groceries', amount: -85, category: 'food' };
const pizza: Transaction = { id: 4, description: 'Pizza', amount: -20, category: 'food' };
const transactions = [paycheck, rent, groceries, pizza];

describe('types', () => {
	test('Transaction has an id, a description, an amount, and a category', () => {
		expectTypeOf<Transaction>().toEqualTypeOf<{ id: number; description: string; amount: number; category: string }>();
	});
	test('groupByCategory returns an object of Transaction arrays', () => {
		expectTypeOf(groupByCategory).toEqualTypeOf<(transactions: Transaction[]) => Record<string, Transaction[]>>();
	});
	test('totalsByCategory returns an object of numbers', () => {
		expectTypeOf(totalsByCategory).toEqualTypeOf<(transactions: Transaction[]) => Record<string, number>>();
	});
	test('largestExpense returns a Transaction or undefined', () => {
		expectTypeOf(largestExpense).toEqualTypeOf<(transactions: Transaction[]) => Transaction | undefined>();
	});
	test('describeLargestExpense always returns a string', () => {
		expectTypeOf(describeLargestExpense).toEqualTypeOf<(transactions: Transaction[]) => string>();
	});
});

describe('groupByCategory', () => {
	test('puts each transaction under its own category, in order', () => {
		expect(groupByCategory(transactions)).toEqual({
			income: [paycheck],
			housing: [rent],
			food: [groceries, pizza],
		});
	});
	test('returns an empty object for no transactions', () => expect(groupByCategory([])).toEqual({}));
});

describe('totalsByCategory', () => {
	test('adds up the amounts in each category', () => {
		expect(totalsByCategory(transactions)).toEqual({ income: 2500, housing: -1200, food: -105 });
	});
});

describe('largestExpense', () => {
	test('is the transaction with the most negative amount', () => expect(largestExpense(transactions)).toBe(rent));
	test('is undefined when nothing was spent', () => expect(largestExpense([paycheck])).toBeUndefined());
});

describe('describeLargestExpense', () => {
	test('names the largest expense and its amount', () => {
		expect(describeLargestExpense(transactions)).toBe('Largest expense: Rent (-1200)');
	});
	test('says "No expenses" instead of crashing when nothing was spent', () => {
		expect(describeLargestExpense([paycheck])).toBe('No expenses');
		expect(describeLargestExpense([])).toBe('No expenses');
	});
});
