import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp } from './03-app.js';
import { sendReturnReceipt } from './notify.js';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

let db;

beforeEach(async () => {
	db = new PGlite();
	await db.exec(read('./schema.sql'));
	await db.exec(`
		INSERT INTO books (title, author, year) VALUES ('Kindred', 'Octavia E. Butler', 1979);
		INSERT INTO members (name, email) VALUES ('Ada', 'ada@example.com'), ('Bo', 'bo@bounce.example');
		INSERT INTO loans (book_id, member_id, borrowed_at) VALUES (1, 1, '2026-03-01T10:00:00Z');
	`);
});

// Node ends the process on an unhandled promise rejection. Vitest would catch it and report it for us, which hides the crash.
// This helper takes over that event for one test so the test can see whether the server would have died.
async function collectUnhandledRejections(run) {
	const saved = process.listeners('unhandledRejection');
	const seen = [];
	process.removeAllListeners('unhandledRejection');
	process.on('unhandledRejection', (reason) => seen.push(reason));
	try {
		await run();
		await new Promise((resolve) => setTimeout(resolve, 50));
	} finally {
		process.removeAllListeners('unhandledRejection');
		for (const listener of saved) process.on('unhandledRejection', listener);
	}
	return seen;
}

describe('GET /api/members/:id/loans/open', () => {
	test('lists the open loans with their due dates', async () => {
		const res = await request(createApp(db)).get('/api/members/1/loans/open');
		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ id: 1, bookId: 1, title: 'Kindred', borrowedAt: expect.any(String), dueDate: '2026-03-15' }]);
	});
});

describe('POST /api/loans/:id/return', () => {
	let errors;
	beforeEach(() => {
		errors = vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => errors.mockRestore());

	test('marks the loan returned and responds 200 with how many days overdue it was', async () => {
		const res = await request(createApp(db, { sendReceipt: async () => {} })).post('/api/loans/1/return');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ id: 1, returnedAt: expect.any(String), daysOverdue: expect.any(Number) });
		const { rows } = await db.query('SELECT returned_at FROM loans WHERE id = 1');
		expect(rows[0].returned_at).not.toBeNull();
	});

	test('responds 404 when the loan is already returned or does not exist', async () => {
		const app = createApp(db, { sendReceipt: async () => {} });
		await request(app).post('/api/loans/1/return');
		expect((await request(app).post('/api/loans/1/return')).status).toBe(404);
		expect((await request(app).post('/api/loans/999/return')).status).toBe(404);
	});

	test('sends a receipt to the member who borrowed the book', async () => {
		const sendReceipt = vi.fn(async () => {});
		await request(createApp(db, { sendReceipt })).post('/api/loans/1/return');
		expect(sendReceipt).toHaveBeenCalledOnce();
		expect(sendReceipt.mock.calls[0][0]).toMatchObject({ email: 'ada@example.com' });
	});

	test('does not crash the server when the receipt email fails (no unhandled rejection)', async () => {
		const sendReceipt = async () => Promise.reject(new Error('SMTP timeout'));
		const seen = await collectUnhandledRejections(async () => {
			await request(createApp(db, { sendReceipt })).post('/api/loans/1/return');
		});
		expect(seen.map((reason) => reason.message)).toEqual([]);
	});

	test('still answers 200 and keeps the return when the receipt email fails', async () => {
		const sendReceipt = async () => Promise.reject(new Error('SMTP timeout'));
		let res;
		await collectUnhandledRejections(async () => {
			res = await request(createApp(db, { sendReceipt })).post('/api/loans/1/return');
		});
		expect(res.status).toBe(200);
		const { rows } = await db.query('SELECT returned_at FROM loans WHERE id = 1');
		expect(rows[0].returned_at).not.toBeNull();
	});

	test('writes the failure to the log so someone can find it', async () => {
		const sendReceipt = async () => Promise.reject(new Error('SMTP timeout'));
		await collectUnhandledRejections(async () => {
			await request(createApp(db, { sendReceipt })).post('/api/loans/1/return');
		});
		await vi.waitFor(() => expect(errors).toHaveBeenCalled());
		expect(JSON.stringify(errors.mock.calls.flat().map(String))).toMatch(/SMTP timeout/);
	});

	test('does not crash for a member whose mailbox bounces, using the real sender', async () => {
		await db.query("INSERT INTO books (title, author, year) VALUES ('Beloved', 'Toni Morrison', 1987)");
		await db.query("INSERT INTO loans (book_id, member_id, borrowed_at) VALUES (2, 2, '2026-03-01T10:00:00Z')");
		const seen = await collectUnhandledRejections(async () => {
			await request(createApp(db, { sendReceipt: sendReturnReceipt })).post('/api/loans/2/return');
		});
		expect(seen.map((reason) => reason.message)).toEqual([]);
	});
});
