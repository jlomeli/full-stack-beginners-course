import express from 'express';
import { randomUUID } from 'node:crypto';

// THIS APP IS DELIBERATELY INSECURE. It has six security holes, and the tests in 01-vulnerable-app.test.js
// attack each one. Find them, fix them, and write what you found in findings.md.
//
// createApp(db, env) builds the app. `db` has a query(sql, params) method that resolves to { rows }, like a pg pool.
// `env` holds environment variables. The server passes process.env, and the tests pass their own object.
//
// Members log in with just their email address. A real app would check a password too (lesson 24); this one
// skips that so the lesson stays on the six holes.
//
// Routes:
// - POST   /login               body { email }. 200 with the member, and sets the "sid" cookie. 401 for an unknown email.
// - GET    /books               200 with every book. ?author=Name lists only that author's books.
// - GET    /books/:id/page      200 with an HTML page for the book and its reviews.
// - POST   /books/:id/reviews   body { body }. Needs a log-in. 201 with the review.
// - POST   /me/email            body { email }, as JSON or as a form. Needs a log-in. 200 with the updated member.
// - DELETE /books/:id           Needs the header x-admin-key. 204 on success, 401 without the right key.
// - GET    /loans/:id           200 with one loan.

// The websites that are allowed to talk to this API from a browser. The front end runs here during development.
const ALLOWED_ORIGINS = ['http://localhost:5173'];

const ADMIN_KEY = 'library-admin-7f3a9c';

export function createApp(db, env = process.env) {
	const app = express();
	const sessions = new Map(); // session id -> member id

	app.use((req, res, next) => {
		const origin = req.headers.origin;
		if (origin) {
			res.setHeader('Access-Control-Allow-Origin', origin);
			res.setHeader('Access-Control-Allow-Credentials', 'true');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
		}
		if (req.method === 'OPTIONS') {
			res.status(204).end();
			return;
		}
		next();
	});

	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));

	function readCookie(req, name) {
		for (const part of (req.headers.cookie ?? '').split(';')) {
			const [key, ...rest] = part.trim().split('=');
			if (key === name) return rest.join('=');
		}
		return undefined;
	}

	async function currentMember(req) {
		const memberId = sessions.get(readCookie(req, 'sid'));
		if (memberId === undefined) return undefined;
		const { rows } = await db.query('SELECT id, name, email FROM members WHERE id = $1', [memberId]);
		return rows[0];
	}

	async function requireLogin(req, res, next) {
		const member = await currentMember(req);
		if (!member) {
			res.status(401).json({ error: 'Log in first' });
			return;
		}
		req.member = member;
		next();
	}

	app.post('/login', async (req, res) => {
		const { rows } = await db.query('SELECT id, name, email FROM members WHERE email = $1', [req.body?.email]);
		const member = rows[0];
		if (!member) {
			res.status(401).json({ error: 'Unknown email' });
			return;
		}
		const sessionId = randomUUID();
		sessions.set(sessionId, member.id);
		res.setHeader('Set-Cookie', `sid=${sessionId}; Path=/`);
		res.json(member);
	});

	app.get('/books', async (req, res) => {
		const { author } = req.query;
		const sql = author
			? `SELECT id, title, author, year FROM books WHERE author = '${author}' ORDER BY id`
			: 'SELECT id, title, author, year FROM books ORDER BY id';
		const { rows } = await db.query(sql);
		res.json(rows);
	});

	app.get('/books/:id/page', async (req, res) => {
		const { rows: books } = await db.query('SELECT id, title, author, year FROM books WHERE id = $1', [req.params.id]);
		const book = books[0];
		if (!book) {
			res.status(404).send('<h1>Book not found</h1>');
			return;
		}
		const { rows: reviews } = await db.query('SELECT body FROM reviews WHERE book_id = $1 ORDER BY id', [book.id]);
		const items = reviews.map((review) => `<li>${review.body}</li>`).join('');
		res.send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${book.title}</title></head>
<body>
<h1>${book.title}</h1>
<p>${book.author}, ${book.year}</p>
<h2>Reviews</h2>
<ul>${items}</ul>
</body>
</html>`);
	});

	app.post('/books/:id/reviews', requireLogin, async (req, res) => {
		const { rows: books } = await db.query('SELECT id FROM books WHERE id = $1', [req.params.id]);
		if (!books[0]) {
			res.status(404).json({ error: 'Book not found' });
			return;
		}
		const { rows } = await db.query(
			'INSERT INTO reviews (book_id, member_id, body) VALUES ($1, $2, $3) RETURNING id, book_id AS "bookId", body',
			[books[0].id, req.member.id, String(req.body?.body ?? '')],
		);
		res.status(201).json(rows[0]);
	});

	app.post('/me/email', requireLogin, async (req, res) => {
		const { rows } = await db.query('UPDATE members SET email = $1 WHERE id = $2 RETURNING id, name, email', [
			req.body?.email,
			req.member.id,
		]);
		res.json(rows[0]);
	});

	app.delete('/books/:id', async (req, res) => {
		if (req.get('x-admin-key') !== ADMIN_KEY) {
			res.status(401).json({ error: 'Admin key required' });
			return;
		}
		await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
		res.status(204).end();
	});

	app.get('/loans/:id', async (req, res) => {
		const { rows } = await db.query(
			'SELECT id, book_id AS "bookId", member_id AS "memberId", borrowed_at AS "borrowedAt", returned_at AS "returnedAt" FROM loans WHERE id = $1',
			[req.params.id],
		);
		if (!rows[0]) {
			res.status(404).json({ error: 'Loan not found' });
			return;
		}
		res.json(rows[0]);
	});

	app.use((err, req, res, next) => {
		res.status(500).json({ error: 'Internal server error' });
	});

	return app;
}
