// Loan dates for the library. Every date here is a UTC calendar date, the same for every reader in every timezone.
export const LOAN_DAYS = 14;

// dueDate(borrowedAt, loanDays = LOAN_DAYS)
// borrowedAt is a Date or an ISO string like '2026-03-01T10:00:00Z'.
// Return the due date as a 'YYYY-MM-DD' string: the UTC calendar day of borrowedAt plus loanDays days.
// The time of day does not matter, and neither does the timezone of the computer running this code.
export function dueDate(borrowedAt, loanDays = LOAN_DAYS) {
	const due = new Date(borrowedAt);
	due.setHours(0, 0, 0, 0);
	due.setDate(due.getDate() + loanDays);
	return due.toISOString().slice(0, 10);
}

// daysOverdue(borrowedAt, asOf = new Date())
// How many whole UTC calendar days past the due date asOf is. A book is on time through the end of its due date,
// so on the due date it is 0 days overdue, and one second after midnight UTC the next day it is 1.
// Never less than 0.
export function daysOverdue(borrowedAt, asOf = new Date()) {
	const due = Date.parse(dueDate(borrowedAt));
	const today = Date.parse(new Date(asOf).toISOString().slice(0, 10));
	return Math.max(0, Math.round((today - due) / 86_400_000));
}
