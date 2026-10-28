import { randomBytes } from 'node:crypto';
import express from 'express';
import * as z from 'zod';
import { hashPassword, verifyPassword } from './passwords.js';

const SignUp = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	email: z.email('Enter a valid email'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LogIn = z.object({ email: z.string(), password: z.string() });

const NewBook = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	author: z.string().trim().min(1, 'Author is required'),
	year: z
		.number('Year must be a whole number')
		.int('Year must be a whole number')
		.max(new Date().getFullYear(), 'Year cannot be in the future'),
});

const UNIQUE_VIOLATION = '23505';

const LOAN_COLUMNS = `id, book_id AS "bookId", member_id AS "memberId", borrowed_at AS "borrowedAt", returned_at AS "returnedAt"`;

export function createApp(db) {
	const app = express();
	app.use(express.json());

	const sessions = new Map();

	function startSession(res, memberId) {
		const sessionId = randomBytes(24).toString('hex');
		sessions.set(sessionId, memberId);
		res.cookie('sid', sessionId, { httpOnly: true, sameSite: 'lax' });
	}

	function sessionIdOf(req) {
		const pair = (req.headers.cookie ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith('sid='));
		return pair?.slice('sid='.length);
	}

	function requireMember(req, res, next) {
		const memberId = sessions.get(sessionIdOf(req));
		if (!memberId) return res.status(401).json({ error: 'Log in first' });
		req.memberId = memberId;
		next();
	}

	app.post('/api/signup', async (req, res) => {
		const parsed = SignUp.safeParse(req.body);
		if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
		const { name, email, password } = parsed.data;
		try {
			const { rows } = await db.query(
				'INSERT INTO members (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
				[name, email.toLowerCase(), await hashPassword(password)],
			);
			startSession(res, rows[0].id);
			res.status(201).json(rows[0]);
		} catch (error) {
			if (error.code === UNIQUE_VIOLATION) return res.status(409).json({ error: 'That email is already registered' });
			throw error;
		}
	});

	app.post('/api/login', async (req, res) => {
		const parsed = LogIn.safeParse(req.body);
		if (!parsed.success) return res.status(400).json({ error: 'Email and password are required' });
		const { rows } = await db.query('SELECT id, name, email, password_hash FROM members WHERE email = $1', [
			parsed.data.email.toLowerCase(),
		]);
		const member = rows[0];
		if (!member || !(await verifyPassword(parsed.data.password, member.password_hash))) {
			return res.status(401).json({ error: 'Wrong email or password' });
		}
		startSession(res, member.id);
		res.json({ id: member.id, name: member.name, email: member.email });
	});

	app.post('/api/logout', (req, res) => {
		sessions.delete(sessionIdOf(req));
		res.clearCookie('sid');
		res.status(204).end();
	});

	app.get('/api/me', requireMember, async (req, res) => {
		const { rows } = await db.query('SELECT id, name, email FROM members WHERE id = $1', [req.memberId]);
		res.json(rows[0]);
	});

	// GET /api/books
	// Respond 200 with every book as { id, title, author, year, available }, ordered by title.
	// A book is available when no loan for it has returned_at NULL. This SQL computes that:
	//   SELECT b.id, b.title, b.author, b.year,
	//     NOT EXISTS (SELECT 1 FROM loans l WHERE l.book_id = b.id AND l.returned_at IS NULL) AS available
	//   FROM books b ORDER BY b.title
	// With ?available=true, respond with only the available books.
	app.get('/api/books', async (req, res) => {
		// TODO
	});

	// POST /api/books (members only)
	// Validate the body with NewBook. On failure respond 400 { error } with the first issue's message.
	// Otherwise insert the book and respond 201 with { id, title, author, year, available: true }.
	app.post('/api/books', requireMember, async (req, res) => {
		// TODO
	});

	// POST /api/loans (members only)
	// The body is { bookId }. Respond:
	//   400 { error } when bookId is not a whole number
	//   404 { error } when no book has that id
	//   409 { error } when the book is already on loan (the unique index in schema.sql raises code UNIQUE_VIOLATION)
	//   201 with the new loan { id, bookId, memberId, borrowedAt, returnedAt: null } otherwise.
	//     LOAN_COLUMNS renames the columns to that shape: RETURNING ${LOAN_COLUMNS}
	app.post('/api/loans', requireMember, async (req, res) => {
		// TODO
	});

	// POST /api/loans/:id/return (members only)
	// Mark the logged-in member's loan as returned by setting returned_at to now(). Respond:
	//   404 { error } when no loan has that id
	//   403 { error } when the loan belongs to a different member
	//   409 { error } when the loan was already returned
	//   200 with the updated loan, in the same shape as POST /api/loans, otherwise.
	app.post('/api/loans/:id/return', requireMember, async (req, res) => {
		// TODO
	});

	app.use((error, req, res, next) => {
		console.error(error);
		res.status(500).json({ error: 'Something went wrong' });
	});

	return app;
}
