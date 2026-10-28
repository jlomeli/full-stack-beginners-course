// The library module from lesson 17, written without types. It keeps books, members, and loans in memory.
//
// Type it from end to end:
// - Export Book { id, title, author, year }, Member { id, name, email }, and
//   Loan { id, bookId, memberId, borrowedAt, returnedAt }. A loan that is still out has returnedAt null,
//   and a returned loan has the Date it came back. Dates are Date objects, not strings.
// - Export NewBook (a Book without its id) and NewMember (a Member without its id). Derive them from
//   Book and Member with Omit<..., "id"> so the shapes can never drift apart.
// - Export Library: an object with books, members, and loans arrays.
// - Export Result<T>: either { ok: true, value } holding a T, or { ok: false, error } holding a string.
// - Make findById and groupBy generic: they work for any item type, and each returns that item type.
//   findById only accepts items that have a numeric id.
// - Give every parameter and every return value a type. Type each variable that starts out empty.
// - Fix each error the compiler reports. Two of them are typos that were here all along.
//
// The comment above each function is its spec. Keep the behavior it describes.

// A library with no books, members, or loans.
export function createLibrary() {
	return { books: [], members: [], loans: [] };
}

// The item whose id matches, or undefined when there is none.
export function findById(items, id) {
	return items.find((item) => item.id === id);
}

// An object with one key per value that getKey returns. Each value is the items with that key, in their original order.
export function groupBy(items, getKey) {
	const groups = {};
	for (const item of items) {
		const key = getKey(item);
		if (groups[key] === undefined) {
			groups[key] = [];
		}
		groups[key].push(item);
	}
	return groups;
}

// Adds a book to the library and returns it. Its id is the number of books in the library after adding it.
export function addBook(library, input) {
	const book = { id: library.books.length + 1, ...input };
	library.books.push(book);
	return book;
}

// Adds a member and returns { ok: true, value: member }. The id works like a book's id.
// Returns { ok: false, error: "email already registered" } and adds nothing when a member has that email.
export function addMember(library, input) {
	if (library.members.some((member) => member.emial === input.email)) {
		return { ok: false, error: 'email already registered' };
	}
	const member = { id: library.members.length + 1, ...input };
	library.members.push(member);
	return { ok: true, value: member };
}

// A book is available when it has no loan that is still out.
export function isAvailable(library, bookId) {
	return !library.loans.some((loan) => loan.bookid === bookId && loan.returnedAt === null);
}

// The books that are available, in the order they were added.
export function availableBooks(library) {
	return library.books.filter((book) => isAvailable(library, book.id));
}

// The library's books grouped by author.
export function booksByAuthor(library) {
	return groupBy(library.books, (book) => book.author);
}

// Lends a book. On success returns { ok: true, value: loan }, where the loan has a new id (the number of loans
// after adding it), borrowedAt now, and returnedAt null.
// Otherwise adds nothing and returns { ok: false, error } with the first error that applies:
// "no such book", "no such member", or "book is not available".
export function borrowBook(library, bookId, memberId, now) {
	if (findById(library.books, bookId) === undefined) {
		return { ok: false, error: 'no such book' };
	}
	if (findById(library.members, memberId) === undefined) {
		return { ok: false, error: 'no such member' };
	}
	if (!isAvailable(library, bookId)) {
		return { ok: false, error: 'book is not available' };
	}
	const loan = { id: library.loans.length + 1, bookId, memberId, borrowedAt: now, returnedAt: null };
	library.loans.push(loan);
	return { ok: true, value: loan };
}

// Marks a loan as returned now and returns { ok: true, value: loan }.
// Returns { ok: false, error: "no such loan" } or { ok: false, error: "already returned" } and changes nothing.
export function returnBook(library, loanId, now) {
	const loan = findById(library.loans, loanId);
	if (loan.returnedAt !== null) {
		return { ok: false, error: 'already returned' };
	}
	loan.returnedAt = now;
	return { ok: true, value: loan };
}
