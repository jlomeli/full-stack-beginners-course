// The data-access layer for the library app. Every function takes `db` first, an object with query(sql, params).
// Each function runs SQL and returns plain objects. None of them knows about HTTP.
//
// Rules for every function:
//   - Pass values to the database as parameters ($1, $2, ...). Never put a value inside the SQL text.
//   - Rename snake_case columns to camelCase in SQL: book_id AS "bookId".
//   - Throw a LibraryError (below) for the failures named in each spec.
//
// Shapes:
//   book = { id, title, author, year, available }   available is true when no loan for the book is open.
//   member = { id, name, email }
//   loan = { id, bookId, memberId, borrowedAt, returnedAt }   returnedAt is null while the loan is open.
//
// The tables are in ../schema.sql.
import { withTransaction } from '../db.js';

export class LibraryError extends Error {
	constructor(code, message) {
		super(message);
		this.name = 'LibraryError';
		this.code = code;
	}
}
// The codes used in this file:
//   BOOK_NOT_FOUND, MEMBER_NOT_FOUND, LOAN_NOT_FOUND,
//   BOOK_UNAVAILABLE, ALREADY_RETURNED, EMAIL_TAKEN, BOOK_HAS_LOANS

// Resolves to an array of books, ordered by id.
// options.available: true keeps only available books, false keeps only books that are out. Leave it out for both.
// options.search: text. Keeps books whose title or author contains it, ignoring case.
export async function listBooks(db, options = {}) {
	// TODO
}

// Resolves to the book, or null when there is no book with that id.
export async function getBook(db, id) {
	// TODO
}

// Saves { title, author, year } and resolves to the new book. A new book is available.
export async function createBook(db, { title, author, year }) {
	// TODO
}

// Deletes the book. Resolves to true when it deleted one and false when there was no such book.
// A book that has any loans, open or returned, cannot be deleted: throw LibraryError BOOK_HAS_LOANS.
// Hint: the database refuses the delete. Catch its error and look at error.code.
export async function deleteBook(db, id) {
	// TODO
}

// Resolves to an array of members, ordered by id.
export async function listMembers(db) {
	// TODO
}

// Resolves to the member, or null when there is no member with that id.
export async function getMember(db, id) {
	// TODO
}

// Saves { name, email } and resolves to the new member.
// When the email is already taken, throw LibraryError EMAIL_TAKEN.
export async function createMember(db, { name, email }) {
	// TODO
}

// Lends a book to a member and resolves to the new loan, all inside one transaction (see withTransaction in ../db.js).
// Inside the transaction:
//   1. Lock the book's row with SELECT ... FOR UPDATE. If there is no such book, throw BOOK_NOT_FOUND.
//   2. If there is no such member, throw MEMBER_NOT_FOUND.
//   3. If the book has an open loan, throw BOOK_UNAVAILABLE.
//   4. Insert the loan and resolve to it.
// Two members who borrow the same book at the same moment must not both succeed.
export async function borrowBook(db, { bookId, memberId }) {
	// TODO
}

// Marks the loan returned as of now and resolves to the updated loan.
// When there is no such loan, throw LOAN_NOT_FOUND. When it was already returned, throw ALREADY_RETURNED.
export async function returnBook(db, loanId) {
	// TODO
}

// Resolves to the member's loans, newest first (by borrowedAt, then by id). Each loan has the book's title too:
//   { id, bookId, memberId, borrowedAt, returnedAt, title }
// options.active: true keeps only loans that are still open.
// When there is no such member, throw MEMBER_NOT_FOUND.
export async function listLoansForMember(db, memberId, options = {}) {
	// TODO
}
