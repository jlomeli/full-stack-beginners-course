// A transaction looks like this:
// { id: 1, date: '2026-03-02', description: 'Corner Market', category: 'groceries', amount: 2350 }
// Amounts are whole cents: 2350 means $23.50. Dates are 'YYYY-MM-DD' strings.

// Return the transactions from one month, in their original order.
// `month` is a 'YYYY-MM' string, like '2026-03'.
export function inMonth(transactions, month) {
	// TODO
}

// Return an object whose keys are categories and whose values are arrays of
// that category's transactions, in their original order. For example:
// { groceries: [transaction, transaction], rent: [transaction] }
export function groupByCategory(transactions) {
	// TODO
}

// Return an object whose keys are categories and whose values are the total
// amount for that category. For example: { groceries: 5420, rent: 120000 }
export function totalsByCategory(transactions) {
	// TODO
}

// Return { category, total } for the category with the largest total.
// If two categories tie, return the one whose first transaction comes first.
// Return null when there are no transactions.
export function biggestCategory(transactions) {
	// TODO
}
