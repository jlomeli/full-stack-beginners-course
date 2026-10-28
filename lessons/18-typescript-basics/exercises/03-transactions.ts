// Group transactions by category, written in plain JavaScript for lesson 07.
//
// Convert this file to TypeScript:
// - Export a type named Transaction: an object with an id (number), a description (string),
//   an amount (number, negative for money spent), and a category (string).
// - Give every parameter and every return value a type.
// - Give each variable that starts out empty, like {}, a type that says what goes in it.
// - Fix each error the compiler reports. Some of them are bugs that were here all along.
//
// The comment above each function is its spec. Keep the behavior it describes.

// An object with one key per category. Each value is that category's transactions, in their original order.
export function groupByCategory(transactions) {
	const groups = {};
	for (const transaction of transactions) {
		if (groups[transaction.catgory] === undefined) {
			groups[transaction.catgory] = [];
		}
		groups[transaction.catgory].push(transaction);
	}
	return groups;
}

// An object with one key per category. Each value is the sum of that category's amounts.
export function totalsByCategory(transactions) {
	const totals = {};
	for (const transaction of transactions) {
		totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
	}
	return totals;
}

// The expense (a negative amount) that spent the most money, or undefined when there are no expenses.
export function largestExpense(transactions) {
	let largest;
	for (const transaction of transactions) {
		if (transaction.amount < 0 && (largest === undefined || transaction.amount < largest.amount)) {
			largest = transaction;
		}
	}
	return largest;
}

// A sentence about the largest expense, like "Largest expense: Rent (-1200)".
// "No expenses" when there are none.
export function describeLargestExpense(transactions) {
	const expense = largestExpense(transactions);
	return `Largest expense: ${expense.description} (${expense.amount})`;
}
