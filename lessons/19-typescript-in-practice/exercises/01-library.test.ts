import { beforeEach, describe, expect, expectTypeOf, test } from 'vitest';
import {
	addBook,
	addMember,
	availableBooks,
	booksByAuthor,
	borrowBook,
	createLibrary,
	findById,
	groupBy,
	isAvailable,
	returnBook,
	type Book,
	type Library,
	type Loan,
	type Member,
	type NewBook,
	type NewMember,
	type Result,
} from './01-library.ts';

const day1 = new Date('2026-03-01T00:00:00Z');
const day2 = new Date('2026-03-08T00:00:00Z');

let library: Library;

beforeEach(() => {
	library = createLibrary();
	addBook(library, { title: 'Dune', author: 'Frank Herbert', year: 1965 });
	addBook(library, { title: 'Emma', author: 'Jane Austen', year: 1815 });
	addBook(library, { title: 'Persuasion', author: 'Jane Austen', year: 1817 });
	addMember(library, { name: 'Ada', email: 'ada@example.com' });
	addMember(library, { name: 'Grace', email: 'grace@example.com' });
});

describe('types', () => {
	test('Book has an id, a title, an author, and a year', () => {
		expectTypeOf<Book>().toEqualTypeOf<{ id: number; title: string; author: string; year: number }>();
	});
	test('Member has an id, a name, and an email', () => {
		expectTypeOf<Member>().toEqualTypeOf<{ id: number; name: string; email: string }>();
	});
	test('Loan has ids, a borrowedAt Date, and a returnedAt that is a Date or null', () => {
		expectTypeOf<Loan>().toEqualTypeOf<{
			id: number;
			bookId: number;
			memberId: number;
			borrowedAt: Date;
			returnedAt: Date | null;
		}>();
	});
	test('NewBook is a Book without its id', () => {
		expectTypeOf<NewBook>().toEqualTypeOf<{ title: string; author: string; year: number }>();
	});
	test('NewMember is a Member without its id', () => {
		expectTypeOf<NewMember>().toEqualTypeOf<{ name: string; email: string }>();
	});
	test('Library holds arrays of books, members, and loans', () => {
		expectTypeOf<Library>().toEqualTypeOf<{ books: Book[]; members: Member[]; loans: Loan[] }>();
	});
	test('Result<T> is either ok with a value or not ok with an error string', () => {
		expectTypeOf<Result<number>>().toEqualTypeOf<{ ok: true; value: number } | { ok: false; error: string }>();
	});
	test('createLibrary returns a Library', () => {
		expectTypeOf(createLibrary).toEqualTypeOf<() => Library>();
	});
	test('findById keeps the type of the items it searches', () => {
		expectTypeOf(findById(library.books, 1)).toEqualTypeOf<Book | undefined>();
		expectTypeOf(findById(library.members, 1)).toEqualTypeOf<Member | undefined>();
	});
	test('findById refuses items that have no numeric id', () => {
		// @ts-expect-error strings have no id
		findById(['a', 'b'], 1);
	});
	test('groupBy keeps the type of the items it groups', () => {
		expectTypeOf(groupBy(library.members, (member) => member.name)).toEqualTypeOf<Record<string, Member[]>>();
		expectTypeOf(groupBy([1, 2, 3], (n) => String(n % 2))).toEqualTypeOf<Record<string, number[]>>();
	});
	test('the functions take and return the right types', () => {
		expectTypeOf(addBook).toEqualTypeOf<(library: Library, input: NewBook) => Book>();
		expectTypeOf(addMember).toEqualTypeOf<(library: Library, input: NewMember) => Result<Member>>();
		expectTypeOf(isAvailable).toEqualTypeOf<(library: Library, bookId: number) => boolean>();
		expectTypeOf(availableBooks).toEqualTypeOf<(library: Library) => Book[]>();
		expectTypeOf(booksByAuthor).toEqualTypeOf<(library: Library) => Record<string, Book[]>>();
		expectTypeOf(borrowBook).toEqualTypeOf<
			(library: Library, bookId: number, memberId: number, now: Date) => Result<Loan>
		>();
		expectTypeOf(returnBook).toEqualTypeOf<(library: Library, loanId: number, now: Date) => Result<Loan>>();
	});
});

describe('findById', () => {
	test('finds the item with that id', () => expect(findById(library.books, 2)?.title).toBe('Emma'));
	test('is undefined when no item has that id', () => expect(findById(library.books, 99)).toBeUndefined());
});

describe('groupBy', () => {
	test('groups items under the key the function returns, in order', () => {
		expect(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? 'even' : 'odd'))).toEqual({
			odd: [1, 3, 5],
			even: [2, 4],
		});
	});
	test('returns an empty object for no items', () => expect(groupBy([], () => 'x')).toEqual({}));
});

describe('addBook', () => {
	test('gives each book the next id and returns it', () => {
		const book = addBook(library, { title: 'Ulysses', author: 'James Joyce', year: 1922 });
		expect(book).toEqual({ id: 4, title: 'Ulysses', author: 'James Joyce', year: 1922 });
		expect(library.books).toHaveLength(4);
	});
});

describe('addMember', () => {
	test('adds a member and returns it', () => {
		const result = addMember(library, { name: 'Linus', email: 'linus@example.com' });
		expect(result).toEqual({ ok: true, value: { id: 3, name: 'Linus', email: 'linus@example.com' } });
		expect(library.members).toHaveLength(3);
	});
	test('refuses an email that is already registered', () => {
		const result = addMember(library, { name: 'Ada Again', email: 'ada@example.com' });
		expect(result).toEqual({ ok: false, error: 'email already registered' });
		expect(library.members).toHaveLength(2);
	});
});

describe('isAvailable and availableBooks', () => {
	test('every book is available before anyone borrows', () => {
		expect(isAvailable(library, 1)).toBe(true);
		expect(availableBooks(library).map((book) => book.title)).toEqual(['Dune', 'Emma', 'Persuasion']);
	});
	test('a borrowed book is not available', () => {
		borrowBook(library, 2, 1, day1);
		expect(isAvailable(library, 2)).toBe(false);
		expect(isAvailable(library, 1)).toBe(true);
		expect(availableBooks(library).map((book) => book.title)).toEqual(['Dune', 'Persuasion']);
	});
	test('a returned book is available again', () => {
		borrowBook(library, 2, 1, day1);
		returnBook(library, 1, day2);
		expect(isAvailable(library, 2)).toBe(true);
	});
});

describe('booksByAuthor', () => {
	test('groups the library by author', () => {
		const grouped = booksByAuthor(library);
		expect(Object.keys(grouped)).toEqual(['Frank Herbert', 'Jane Austen']);
		expect(grouped['Jane Austen']?.map((book) => book.title)).toEqual(['Emma', 'Persuasion']);
	});
});

describe('borrowBook', () => {
	test('lends an available book to a member', () => {
		const result = borrowBook(library, 1, 2, day1);
		expect(result).toEqual({
			ok: true,
			value: { id: 1, bookId: 1, memberId: 2, borrowedAt: day1, returnedAt: null },
		});
		expect(library.loans).toHaveLength(1);
	});
	test('refuses a book that does not exist', () => {
		expect(borrowBook(library, 99, 1, day1)).toEqual({ ok: false, error: 'no such book' });
	});
	test('refuses a member that does not exist', () => {
		expect(borrowBook(library, 1, 99, day1)).toEqual({ ok: false, error: 'no such member' });
	});
	test('refuses a book that is already out', () => {
		borrowBook(library, 1, 1, day1);
		expect(borrowBook(library, 1, 2, day1)).toEqual({ ok: false, error: 'book is not available' });
		expect(library.loans).toHaveLength(1);
	});
});

describe('returnBook', () => {
	test('marks the loan as returned', () => {
		borrowBook(library, 1, 1, day1);
		const result = returnBook(library, 1, day2);
		expect(result).toEqual({
			ok: true,
			value: { id: 1, bookId: 1, memberId: 1, borrowedAt: day1, returnedAt: day2 },
		});
	});
	test('says so instead of crashing when the loan does not exist', () => {
		expect(returnBook(library, 99, day2)).toEqual({ ok: false, error: 'no such loan' });
	});
	test('refuses a loan that was already returned', () => {
		borrowBook(library, 1, 1, day1);
		returnBook(library, 1, day2);
		expect(returnBook(library, 1, new Date('2026-03-09T00:00:00Z'))).toEqual({ ok: false, error: 'already returned' });
		expect(library.loans[0]?.returnedAt).toEqual(day2);
	});
});
