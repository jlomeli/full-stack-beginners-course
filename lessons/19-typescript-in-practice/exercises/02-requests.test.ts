import { beforeEach, describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { addBook, addMember, createLibrary, type Book, type Library, type Loan, type Member, type NewBook, type NewMember, type Result } from './01-library.ts';
import {
	borrowRequestSchema,
	handleAddBook,
	handleAddMember,
	handleBorrow,
	newBookSchema,
	newMemberSchema,
	parseBody,
	type BorrowRequest,
	type NewBookRequest,
	type NewMemberRequest,
} from './02-requests.ts';

const now = new Date('2026-03-01T00:00:00Z');

let library: Library;

beforeEach(() => {
	library = createLibrary();
});

describe('types', () => {
	test('the schema types match the shapes the library functions take', () => {
		expectTypeOf<NewBookRequest>().toEqualTypeOf<NewBook>();
		expectTypeOf<NewMemberRequest>().toEqualTypeOf<NewMember>();
		expectTypeOf<BorrowRequest>().toEqualTypeOf<{ bookId: number; memberId: number }>();
	});
	test('parseBody returns a Result of whatever the schema produces', () => {
		expectTypeOf(parseBody(newBookSchema, {})).toEqualTypeOf<Result<NewBook>>();
		expectTypeOf(parseBody(z.string(), 'hi')).toEqualTypeOf<Result<string>>();
	});
	test('the handlers take an unknown body and return a Result', () => {
		expectTypeOf(handleAddBook).toEqualTypeOf<(library: Library, body: unknown) => Result<Book>>();
		expectTypeOf(handleAddMember).toEqualTypeOf<(library: Library, body: unknown) => Result<Member>>();
		expectTypeOf(handleBorrow).toEqualTypeOf<(library: Library, body: unknown, now: Date) => Result<Loan>>();
	});
});

describe('newBookSchema', () => {
	const valid = { title: 'Dune', author: 'Frank Herbert', year: 1965 };

	test('accepts a valid book', () => expect(newBookSchema.safeParse(valid).success).toBe(true));
	test('trims spaces from the title and author', () => {
		expect(newBookSchema.parse({ ...valid, title: '  Dune ', author: ' Frank Herbert  ' })).toEqual(valid);
	});
	test('rejects a title that is empty after trimming', () => {
		expect(newBookSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
	});
	test('rejects an empty author', () => {
		expect(newBookSchema.safeParse({ ...valid, author: '' }).success).toBe(false);
	});
	test('rejects a year sent as text', () => {
		expect(newBookSchema.safeParse({ ...valid, year: '1965' }).success).toBe(false);
	});
	test('rejects a year that is not a whole number', () => {
		expect(newBookSchema.safeParse({ ...valid, year: 1965.5 }).success).toBe(false);
	});
	test('accepts years 1000 and 2100 and rejects the years just outside them', () => {
		expect(newBookSchema.safeParse({ ...valid, year: 1000 }).success).toBe(true);
		expect(newBookSchema.safeParse({ ...valid, year: 2100 }).success).toBe(true);
		expect(newBookSchema.safeParse({ ...valid, year: 999 }).success).toBe(false);
		expect(newBookSchema.safeParse({ ...valid, year: 2101 }).success).toBe(false);
	});
	test('drops keys it does not list', () => {
		expect(newBookSchema.parse({ ...valid, id: 99, admin: true })).toEqual(valid);
	});
});

describe('newMemberSchema', () => {
	test('accepts a valid member', () => {
		expect(newMemberSchema.parse({ name: 'Ada', email: 'ada@example.com' })).toEqual({
			name: 'Ada',
			email: 'ada@example.com',
		});
	});
	test('trims the name', () => {
		expect(newMemberSchema.parse({ name: ' Ada ', email: 'ada@example.com' }).name).toBe('Ada');
	});
	test('converts the email to lowercase', () => {
		expect(newMemberSchema.parse({ name: 'Ada', email: 'Ada@Example.COM' }).email).toBe('ada@example.com');
	});
	test('rejects text that is not an email address', () => {
		expect(newMemberSchema.safeParse({ name: 'Ada', email: 'not-an-email' }).success).toBe(false);
	});
	test('rejects an empty name', () => {
		expect(newMemberSchema.safeParse({ name: '  ', email: 'ada@example.com' }).success).toBe(false);
	});
});

describe('borrowRequestSchema', () => {
	test('accepts two positive whole numbers', () => {
		expect(borrowRequestSchema.parse({ bookId: 1, memberId: 2 })).toEqual({ bookId: 1, memberId: 2 });
	});
	test('rejects ids sent as text', () => {
		expect(borrowRequestSchema.safeParse({ bookId: '1', memberId: 2 }).success).toBe(false);
	});
	test('rejects zero, negative, and fractional ids', () => {
		expect(borrowRequestSchema.safeParse({ bookId: 0, memberId: 2 }).success).toBe(false);
		expect(borrowRequestSchema.safeParse({ bookId: 1, memberId: -2 }).success).toBe(false);
		expect(borrowRequestSchema.safeParse({ bookId: 1.5, memberId: 2 }).success).toBe(false);
	});
	test('rejects a body with a missing id', () => {
		expect(borrowRequestSchema.safeParse({ bookId: 1 }).success).toBe(false);
	});
});

describe('parseBody', () => {
	test('returns the parsed value when the body is valid', () => {
		expect(parseBody(borrowRequestSchema, { bookId: 1, memberId: 2, extra: 'x' })).toEqual({
			ok: true,
			value: { bookId: 1, memberId: 2 },
		});
	});
	test('returns an error string that names the field that failed', () => {
		const result = parseBody(newBookSchema, { title: 'Dune', author: 'Frank Herbert', year: 'old' });
		expect(result.ok).toBe(false);
		expect(result.ok === false && typeof result.error).toBe('string');
		expect(result.ok === false && result.error).toContain('year');
	});
	test('names every field that failed', () => {
		const result = parseBody(newBookSchema, { title: '', author: '', year: 1965 });
		expect(result.ok === false && result.error).toContain('title');
		expect(result.ok === false && result.error).toContain('author');
	});
	test('returns an error instead of throwing when the body is not an object', () => {
		expect(parseBody(newBookSchema, null).ok).toBe(false);
		expect(parseBody(newBookSchema, 'a string').ok).toBe(false);
		expect(parseBody(newBookSchema, undefined).ok).toBe(false);
	});
	test('works with any schema', () => {
		expect(parseBody(z.string(), 'hi')).toEqual({ ok: true, value: 'hi' });
		expect(parseBody(z.string(), 5).ok).toBe(false);
	});
});

describe('handleAddBook', () => {
	test('adds a valid book and returns it', () => {
		const result = handleAddBook(library, { title: ' Dune ', author: 'Frank Herbert', year: 1965 });
		expect(result).toEqual({ ok: true, value: { id: 1, title: 'Dune', author: 'Frank Herbert', year: 1965 } });
		expect(library.books).toHaveLength(1);
	});
	test('adds nothing and returns the error when the body is invalid', () => {
		const result = handleAddBook(library, { title: 'Dune' });
		expect(result.ok).toBe(false);
		expect(library.books).toHaveLength(0);
	});
	test('ignores an id sent in the body', () => {
		const result = handleAddBook(library, { id: 50, title: 'Dune', author: 'Frank Herbert', year: 1965 });
		expect(result.ok && result.value.id).toBe(1);
	});
});

describe('handleAddMember', () => {
	test('adds a valid member with a lowercase email', () => {
		const result = handleAddMember(library, { name: 'Ada', email: 'Ada@Example.com' });
		expect(result).toEqual({ ok: true, value: { id: 1, name: 'Ada', email: 'ada@example.com' } });
	});
	test('adds nothing and returns the error when the body is invalid', () => {
		expect(handleAddMember(library, { name: 'Ada', email: 'nope' }).ok).toBe(false);
		expect(library.members).toHaveLength(0);
	});
	test('treats emails that differ only in case as the same email', () => {
		handleAddMember(library, { name: 'Ada', email: 'ada@example.com' });
		const result = handleAddMember(library, { name: 'Ada Again', email: 'ADA@example.com' });
		expect(result).toEqual({ ok: false, error: 'email already registered' });
		expect(library.members).toHaveLength(1);
	});
});

describe('handleBorrow', () => {
	beforeEach(() => {
		addBook(library, { title: 'Dune', author: 'Frank Herbert', year: 1965 });
		addMember(library, { name: 'Ada', email: 'ada@example.com' });
	});

	test('lends the book for a valid request', () => {
		const result = handleBorrow(library, { bookId: 1, memberId: 1 }, now);
		expect(result).toEqual({
			ok: true,
			value: { id: 1, bookId: 1, memberId: 1, borrowedAt: now, returnedAt: null },
		});
	});
	test('returns the parse error and lends nothing when the body is invalid', () => {
		const result = handleBorrow(library, { bookId: '1', memberId: 1 }, now);
		expect(result.ok === false && result.error).toContain('bookId');
		expect(library.loans).toHaveLength(0);
	});
	test('returns the library error when the book does not exist', () => {
		expect(handleBorrow(library, { bookId: 9, memberId: 1 }, now)).toEqual({ ok: false, error: 'no such book' });
	});
	test('returns the library error when the book is already out', () => {
		handleBorrow(library, { bookId: 1, memberId: 1 }, now);
		expect(handleBorrow(library, { bookId: 1, memberId: 1 }, now)).toEqual({
			ok: false,
			error: 'book is not available',
		});
	});
});
