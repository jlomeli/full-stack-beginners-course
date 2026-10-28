import { PGlite } from '@electric-sql/pglite';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { applySchema } from '../db.js';
import { LibraryError, borrowBook, createBook, createMember, deleteBook, getBook, getMember, listBooks, listLoansForMember, listMembers, returnBook } from './library.js';

let template;
let db;

beforeAll(async () => {
	template = new PGlite();
	await applySchema(template);
}, 30_000);

afterAll(async () => {
	await template.close();
});

beforeEach(async () => {
	db = await template.clone();
});

afterEach(async () => {
	await db.close();
});

async function insertBook(title = 'Kindred', author = 'Octavia E. Butler', year = 1979) {
	const { rows } = await db.query('INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING id', [title, author, year]);
	return rows[0].id;
}

async function insertMember(name = 'Ada Lovelace', email = 'ada@example.com') {
	const { rows } = await db.query('INSERT INTO members (name, email) VALUES ($1, $2) RETURNING id', [name, email]);
	return rows[0].id;
}

async function insertLoan(bookId, memberId, returned = false) {
	const { rows } = await db.query('INSERT INTO loans (book_id, member_id, returned_at) VALUES ($1, $2, CASE WHEN $3 THEN now() END) RETURNING id', [bookId, memberId, returned]);
	return rows[0].id;
}

async function count(table) {
	const { rows } = await db.query(`SELECT count(*)::int AS total FROM ${table}`);
	return rows[0].total;
}

async function failureOf(promise) {
	return promise.then(
		() => null,
		(error) => error,
	);
}

async function expectLibraryError(promise, code) {
	const error = await failureOf(promise);
	expect(error, `expected a LibraryError ${code}`).toBeInstanceOf(LibraryError);
	expect(error.code).toBe(code);
}

describe('books', () => {
	test('createBook saves the book and returns it as available', async () => {
		const book = await createBook(db, { title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
		expect(book).toEqual({ id: expect.any(Number), title: 'Kindred', author: 'Octavia E. Butler', year: 1979, available: true });
		const { rows } = await db.query('SELECT title FROM books WHERE id = $1', [book.id]);
		expect(rows).toEqual([{ title: 'Kindred' }]);
	});

	test('getBook returns the book, or null when there is none', async () => {
		const id = await insertBook();
		expect(await getBook(db, id)).toEqual({ id, title: 'Kindred', author: 'Octavia E. Butler', year: 1979, available: true });
		expect(await getBook(db, id + 100)).toBeNull();
	});

	test('listBooks returns every book ordered by id, and marks a borrowed book unavailable', async () => {
		const first = await insertBook('Kindred');
		const second = await insertBook('Beloved', 'Toni Morrison', 1987);
		const member = await insertMember();
		await insertLoan(second, member);
		const books = await listBooks(db);
		expect(books.map((book) => [book.id, book.available])).toEqual([
			[first, true],
			[second, false],
		]);
	});

	test('a returned book is available again', async () => {
		const id = await insertBook();
		const member = await insertMember();
		await insertLoan(id, member, true);
		expect((await getBook(db, id)).available).toBe(true);
	});

	test('listBooks filters by available: true and by available: false', async () => {
		const free = await insertBook('Kindred');
		const out = await insertBook('Beloved', 'Toni Morrison', 1987);
		await insertLoan(out, await insertMember());
		expect((await listBooks(db, { available: true })).map((book) => book.id)).toEqual([free]);
		expect((await listBooks(db, { available: false })).map((book) => book.id)).toEqual([out]);
	});

	test('listBooks searches title and author, ignoring case, and combines with available', async () => {
		const kindred = await insertBook('Kindred', 'Octavia E. Butler', 1979);
		await insertBook('Beloved', 'Toni Morrison', 1987);
		const parable = await insertBook('Parable of the Sower', 'Octavia E. Butler', 1993);
		await insertLoan(kindred, await insertMember());
		expect((await listBooks(db, { search: 'BUTLER' })).map((book) => book.id)).toEqual([kindred, parable]);
		expect((await listBooks(db, { search: 'belov' })).map((book) => book.title)).toEqual(['Beloved']);
		expect((await listBooks(db, { search: 'butler', available: true })).map((book) => book.id)).toEqual([parable]);
	});

	test('a search that looks like SQL is plain text: nothing matches and the table survives', async () => {
		await insertBook();
		const found = await listBooks(db, { search: "x'; DROP TABLE books; --" });
		expect(found).toEqual([]);
		expect(await count('books')).toBe(1);
	});

	test('a search with a quote in it finds the book', async () => {
		await insertBook("Ender's Game", 'Orson Scott Card', 1985);
		expect((await listBooks(db, { search: "Ender's" })).map((book) => book.title)).toEqual(["Ender's Game"]);
	});

	test('values go to the database as parameters, never inside the SQL text', async () => {
		await insertBook();
		const calls = [];
		const spy = {
			query: (sql, params) => {
				calls.push(sql);
				return db.query(sql, params);
			},
		};
		await listBooks(spy, { search: 'zq-needle', available: true });
		await createBook(spy, { title: 'unique-title-77', author: 'unique-author-88', year: 2000 });
		expect(calls.length).toBeGreaterThan(1);
		for (const sql of calls) {
			expect(sql).not.toContain('zq-needle');
			expect(sql).not.toContain('unique-title-77');
			expect(sql).not.toContain('unique-author-88');
		}
	});

	test('deleteBook removes a book, answers false for a missing one, and refuses a book that has loans', async () => {
		const unused = await insertBook('Unused');
		const lent = await insertBook('Kindred');
		const returned = await insertBook('Beloved', 'Toni Morrison', 1987);
		const member = await insertMember();
		await insertLoan(lent, member);
		await insertLoan(returned, member, true);

		expect(await deleteBook(db, unused)).toBe(true);
		expect(await deleteBook(db, unused)).toBe(false);
		await expectLibraryError(deleteBook(db, lent), 'BOOK_HAS_LOANS');
		await expectLibraryError(deleteBook(db, returned), 'BOOK_HAS_LOANS');
		expect(await count('books')).toBe(2);
	});
});

describe('members', () => {
	test('createMember saves the member and returns it', async () => {
		const member = await createMember(db, { name: 'Ada Lovelace', email: 'ada@example.com' });
		expect(member).toEqual({ id: expect.any(Number), name: 'Ada Lovelace', email: 'ada@example.com' });
		expect(await count('members')).toBe(1);
	});

	test('listMembers returns members ordered by id and getMember finds one or returns null', async () => {
		const ada = await insertMember();
		const grace = await insertMember('Grace Hopper', 'grace@example.com');
		expect((await listMembers(db)).map((member) => member.id)).toEqual([ada, grace]);
		expect(await getMember(db, grace)).toEqual({ id: grace, name: 'Grace Hopper', email: 'grace@example.com' });
		expect(await getMember(db, grace + 100)).toBeNull();
	});

	test('createMember with an email that is taken throws EMAIL_TAKEN and saves nothing', async () => {
		await createMember(db, { name: 'Ada Lovelace', email: 'ada@example.com' });
		await expectLibraryError(createMember(db, { name: 'Imposter', email: 'ada@example.com' }), 'EMAIL_TAKEN');
		expect(await count('members')).toBe(1);
	});
});

describe('borrowing and returning', () => {
	test('borrowBook creates an open loan and the book stops being available', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const loan = await borrowBook(db, { bookId, memberId });
		expect(loan).toEqual({ id: expect.any(Number), bookId, memberId, borrowedAt: expect.any(Date), returnedAt: null });
		expect((await getBook(db, bookId)).available).toBe(false);
	});

	test('borrowBook refuses a missing book, a missing member, and a book that is already out, and creates no loan', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const other = await insertMember('Grace Hopper', 'grace@example.com');
		await borrowBook(db, { bookId, memberId });
		expect(await count('loans')).toBe(1);

		await expectLibraryError(borrowBook(db, { bookId: bookId + 100, memberId }), 'BOOK_NOT_FOUND');
		await expectLibraryError(borrowBook(db, { bookId, memberId: memberId + 100 }), 'MEMBER_NOT_FOUND');
		await expectLibraryError(borrowBook(db, { bookId, memberId: other }), 'BOOK_UNAVAILABLE');
		expect(await count('loans')).toBe(1);
	});

	test('two members borrowing the same book at the same moment: one gets it, the other is told it is unavailable', async () => {
		const bookId = await insertBook();
		const first = await insertMember();
		const second = await insertMember('Grace Hopper', 'grace@example.com');
		const results = await Promise.allSettled([borrowBook(db, { bookId, memberId: first }), borrowBook(db, { bookId, memberId: second })]);

		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		const rejected = results.find((result) => result.status === 'rejected');
		expect(rejected?.reason).toMatchObject({ code: 'BOOK_UNAVAILABLE' });
		const { rows } = await db.query('SELECT count(*)::int AS total FROM loans WHERE book_id = $1 AND returned_at IS NULL', [bookId]);
		expect(rows[0].total).toBe(1);
	});

	test('returnBook closes the loan, and the book can be borrowed again', async () => {
		const bookId = await insertBook();
		const first = await insertMember();
		const second = await insertMember('Grace Hopper', 'grace@example.com');
		const loan = await borrowBook(db, { bookId, memberId: first });

		const returned = await returnBook(db, loan.id);
		expect(returned).toMatchObject({ id: loan.id, bookId, memberId: first, returnedAt: expect.any(Date) });
		expect((await getBook(db, bookId)).available).toBe(true);
		expect(await borrowBook(db, { bookId, memberId: second })).toMatchObject({ memberId: second, returnedAt: null });
	});

	test('returnBook throws LOAN_NOT_FOUND for a missing loan and ALREADY_RETURNED for a loan that is closed', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const loan = await borrowBook(db, { bookId, memberId });
		await returnBook(db, loan.id);
		await expectLibraryError(returnBook(db, loan.id), 'ALREADY_RETURNED');
		await expectLibraryError(returnBook(db, loan.id + 100), 'LOAN_NOT_FOUND');
	});

	test('listLoansForMember returns the newest loans first with the book title, and can keep only open loans', async () => {
		const memberId = await insertMember();
		const other = await insertMember('Grace Hopper', 'grace@example.com');
		const kindred = await insertBook('Kindred');
		const beloved = await insertBook('Beloved', 'Toni Morrison', 1987);
		const old = await borrowBook(db, { bookId: kindred, memberId });
		await returnBook(db, old.id);
		const recent = await borrowBook(db, { bookId: beloved, memberId });
		await borrowBook(db, { bookId: kindred, memberId: other });

		const all = await listLoansForMember(db, memberId);
		expect(all.map((loan) => [loan.id, loan.title])).toEqual([
			[recent.id, 'Beloved'],
			[old.id, 'Kindred'],
		]);
		expect(all[0]).toEqual({ id: recent.id, bookId: beloved, memberId, borrowedAt: expect.any(Date), returnedAt: null, title: 'Beloved' });
		const open = await listLoansForMember(db, memberId, { active: true });
		expect(open.map((loan) => loan.id)).toEqual([recent.id]);
	});

	test('listLoansForMember throws MEMBER_NOT_FOUND for a member that does not exist', async () => {
		const memberId = await insertMember();
		expect(await listLoansForMember(db, memberId)).toEqual([]);
		await expectLibraryError(listLoansForMember(db, memberId + 100), 'MEMBER_NOT_FOUND');
	});
});
