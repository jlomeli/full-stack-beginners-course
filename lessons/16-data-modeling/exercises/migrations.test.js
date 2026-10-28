import { PGlite } from '@electric-sql/pglite';
import { readdirSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { migrate } from '../migrate.js';

const migrationsDirectory = new URL('./migrations/', import.meta.url).pathname;

const NOT_NULL = '23502';
const FOREIGN_KEY = '23503';
const RESTRICTED = ['23503', '23001'];
const UNIQUE = '23505';
const CHECK = '23514';

let template;
let db;

beforeAll(async () => {
	template = new PGlite();
	await migrate(template, migrationsDirectory);
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

async function rejectedWith(promise) {
	return promise.then(
		() => null,
		(error) => error,
	);
}

async function expectRejected(promise, code, why) {
	const error = await rejectedWith(promise);
	expect([code].flat(), why).toContain(error?.code);
}

async function addBook({ title = 'Kindred', author = 'Octavia E. Butler', year = 1979 } = {}) {
	const { rows } = await db.query('INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING *', [title, author, year]);
	return rows[0];
}

async function addMember({ name = 'Ada Lovelace', email = 'ada@example.com' } = {}) {
	const { rows } = await db.query('INSERT INTO members (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
	return rows[0];
}

async function addLoan(bookId, memberId, extra = {}) {
	const { rows } = await db.query(
		`INSERT INTO loans (book_id, member_id, borrowed_at, returned_at)
		 VALUES ($1, $2, COALESCE($3, now()), $4) RETURNING *`,
		[bookId, memberId, extra.borrowedAt ?? null, extra.returnedAt ?? null],
	);
	return rows[0];
}

describe('migrations', () => {
	test('applying every migration creates books, members, and loans, and running migrate again changes nothing', async () => {
		const fresh = new PGlite();
		try {
			const files = readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql'));
			const applied = await migrate(fresh, migrationsDirectory);
			expect(applied).toEqual(files.sort());

			const { rows } = await fresh.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
			expect(rows.map((row) => row.table_name)).toEqual(['books', 'loans', 'members', 'schema_migrations']);

			expect(await migrate(fresh, migrationsDirectory)).toEqual([]);
			const recorded = await fresh.query('SELECT name FROM schema_migrations ORDER BY name');
			expect(recorded.rows).toHaveLength(files.length);
		} finally {
			await fresh.close();
		}
	}, 30_000);
});

describe('books', () => {
	test('stores a book and generates a different id for each one', async () => {
		const first = await addBook();
		const second = await addBook({ title: 'Beloved', author: 'Toni Morrison', year: 1987 });
		expect(first).toMatchObject({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
		expect(typeof first.id).toBe('number');
		expect(second.id).not.toBe(first.id);
	});

	test('rejects a book with no title, author, or year (NOT NULL)', async () => {
		await addBook();
		const insert = (title, author, year) => db.query('INSERT INTO books (title, author, year) VALUES ($1, $2, $3)', [title, author, year]);
		await expectRejected(insert(null, 'A. Author', 2000), NOT_NULL, 'title should be NOT NULL');
		await expectRejected(insert('A Title', null, 2000), NOT_NULL, 'author should be NOT NULL');
		await expectRejected(insert('A Title', 'A. Author', null), NOT_NULL, 'year should be NOT NULL');
	});

	test('rejects a title or author that is empty or only spaces (CHECK)', async () => {
		await addBook();
		await expectRejected(addBook({ title: '' }), CHECK, 'an empty title should fail a CHECK');
		await expectRejected(addBook({ title: '   ' }), CHECK, 'a title of only spaces should fail a CHECK');
		await expectRejected(addBook({ author: '' }), CHECK, 'an empty author should fail a CHECK');
		await expectRejected(addBook({ author: '  ' }), CHECK, 'an author of only spaces should fail a CHECK');
	});

	test('accepts years 1450 and 2100 and rejects years outside that range (CHECK)', async () => {
		expect((await addBook({ year: 1450 })).year).toBe(1450);
		expect((await addBook({ year: 2100 })).year).toBe(2100);
		await expectRejected(addBook({ year: 1449 }), CHECK, '1449 is before the range');
		await expectRejected(addBook({ year: 2101 }), CHECK, '2101 is after the range');
	});
});

describe('members', () => {
	test('stores a member and generates an id', async () => {
		const member = await addMember();
		expect(member).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' });
		expect(typeof member.id).toBe('number');
	});

	test('rejects a second member with the same email (UNIQUE)', async () => {
		await addMember();
		await expectRejected(addMember({ name: 'Someone Else' }), UNIQUE, 'email should be UNIQUE');
		expect((await addMember({ name: 'Grace Hopper', email: 'grace@example.com' })).name).toBe('Grace Hopper');
	});

	test('rejects a member with no name or no email (NOT NULL)', async () => {
		await addMember();
		const insert = (name, email) => db.query('INSERT INTO members (name, email) VALUES ($1, $2)', [name, email]);
		await expectRejected(insert(null, 'x@example.com'), NOT_NULL, 'name should be NOT NULL');
		await expectRejected(insert('X', null), NOT_NULL, 'email should be NOT NULL');
	});

	test('rejects a blank name and an email without an @ (CHECK)', async () => {
		await addMember();
		await expectRejected(addMember({ name: '   ', email: 'blank@example.com' }), CHECK, 'a name of only spaces should fail a CHECK');
		await expectRejected(addMember({ name: 'No At', email: 'no-at-sign.example.com' }), CHECK, 'an email with no @ should fail a CHECK');
	});
});

describe('loans', () => {
	test('records a loan that starts now and has no return date', async () => {
		const book = await addBook();
		const member = await addMember();
		const loan = await addLoan(book.id, member.id);
		expect(loan).toMatchObject({ book_id: book.id, member_id: member.id, returned_at: null });
		expect(Math.abs(Date.now() - loan.borrowed_at.getTime())).toBeLessThan(60_000);
	});

	test('rejects a loan for a book or member that does not exist (FOREIGN KEY)', async () => {
		const book = await addBook();
		const member = await addMember();
		const other = await addBook({ title: 'Beloved', author: 'Toni Morrison', year: 1987 });
		await addLoan(book.id, member.id);
		await expectRejected(addLoan(book.id + 100, member.id), FOREIGN_KEY, 'book_id should reference books');
		await expectRejected(addLoan(other.id, member.id + 100), FOREIGN_KEY, 'member_id should reference members');
	});

	test('rejects a loan with no book or no member (NOT NULL)', async () => {
		const book = await addBook();
		const member = await addMember();
		await addLoan(book.id, member.id);
		await expectRejected(addLoan(null, member.id), NOT_NULL, 'book_id should be NOT NULL');
		await expectRejected(addLoan(book.id, null), NOT_NULL, 'member_id should be NOT NULL');
	});

	test('rejects a return date earlier than the borrow date, and accepts the same moment (CHECK)', async () => {
		const book = await addBook();
		const other = await addBook({ title: 'Beloved', author: 'Toni Morrison', year: 1987 });
		const member = await addMember();
		const borrowedAt = '2026-03-10T12:00:00Z';
		await expectRejected(addLoan(book.id, member.id, { borrowedAt, returnedAt: '2026-03-09T12:00:00Z' }), CHECK, 'returned_at before borrowed_at should fail a CHECK');
		const loan = await addLoan(other.id, member.id, { borrowedAt, returnedAt: borrowedAt });
		expect(loan.returned_at).toEqual(loan.borrowed_at);
	});

	test('rejects a second open loan for the same book (partial unique index)', async () => {
		const book = await addBook();
		const first = await addMember();
		const second = await addMember({ name: 'Grace Hopper', email: 'grace@example.com' });
		await addLoan(book.id, first.id);
		await expectRejected(addLoan(book.id, second.id), UNIQUE, 'a book that is already out cannot be borrowed again');
	});

	test('lets a book be borrowed again after it comes back, and lets a member borrow many books', async () => {
		const book = await addBook();
		const other = await addBook({ title: 'Beloved', author: 'Toni Morrison', year: 1987 });
		const first = await addMember();
		const second = await addMember({ name: 'Grace Hopper', email: 'grace@example.com' });

		const loan = await addLoan(book.id, first.id);
		await db.query('UPDATE loans SET returned_at = now() WHERE id = $1', [loan.id]);
		await addLoan(book.id, second.id);
		await addLoan(other.id, first.id);

		const { rows } = await db.query('SELECT count(*)::int AS total FROM loans WHERE member_id = $1', [first.id]);
		expect(rows[0].total).toBe(2);
	});

	test('refuses to delete a book or member that has loans, but deletes one that has none (RESTRICT)', async () => {
		const book = await addBook();
		const member = await addMember();
		const unused = await addBook({ title: 'Unused', author: 'Nobody', year: 2001 });
		await addLoan(book.id, member.id);

		await expectRejected(db.query('DELETE FROM books WHERE id = $1', [book.id]), RESTRICTED, 'a book with loans should not be deletable');
		await expectRejected(db.query('DELETE FROM members WHERE id = $1', [member.id]), RESTRICTED, 'a member with loans should not be deletable');

		const result = await db.query('DELETE FROM books WHERE id = $1', [unused.id]);
		expect(result.affectedRows).toBe(1);
	});
});
