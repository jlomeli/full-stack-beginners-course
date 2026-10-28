import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from './03-auth-api.js';

let app;
beforeEach(() => {
	app = createApp();
});

const ada = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'analytical-engine' };
const grace = { name: 'Grace Hopper', email: 'grace@example.com', password: 'compiler-first' };

// An agent remembers cookies between requests, like a browser does.
function browser() {
	return request.agent(app);
}

async function signedUp(person) {
	const agent = browser();
	const res = await agent.post('/signup').send(person);
	return { agent, res };
}

describe('POST /signup', () => {
	test('responds 201 with the new member and no password or hash', async () => {
		const { res } = await signedUp(ada);
		expect(res.status).toBe(201);
		expect(res.body).toEqual({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' });
	});

	test('gives each member the next id', async () => {
		await signedUp(ada);
		const { res } = await signedUp(grace);
		expect(res.body.id).toBe(2);
	});

	test('logs the new member in, so GET /me works straight away', async () => {
		const { agent } = await signedUp(ada);
		const me = await agent.get('/me');
		expect(me.status).toBe(200);
		expect(me.body.email).toBe('ada@example.com');
	});

	test('responds 400 when name, email, or password is missing', async () => {
		for (const field of ['name', 'email', 'password']) {
			const body = { ...ada };
			delete body[field];
			const res = await request(app).post('/signup').send(body);
			expect(res.status, `without ${field}`).toBe(400);
			expect(res.body.error).toEqual(expect.any(String));
		}
		const noBody = await request(app).post('/signup');
		expect(noBody.status).toBe(400);
	});

	test('responds 400 when the email has no @ or the password is shorter than 8 characters', async () => {
		const badEmail = await request(app).post('/signup').send({ ...ada, email: 'ada.example.com' });
		expect(badEmail.status).toBe(400);
		const shortPassword = await request(app).post('/signup').send({ ...ada, password: '1234567' });
		expect(shortPassword.status).toBe(400);
	});

	test('responds 409 when the email is taken, whatever its case', async () => {
		await signedUp(ada);
		const res = await request(app)
			.post('/signup')
			.send({ ...grace, email: ' ADA@Example.com ' });
		expect(res.status).toBe(409);
		expect(res.body).toEqual({ error: 'Email already in use' });
	});

	test('sets a session cookie that JavaScript cannot read and other sites cannot send', async () => {
		const { res } = await signedUp(ada);
		const header = res.headers['set-cookie'].join('\n');
		expect(header).toMatch(/^sid=[0-9a-f]{64}/);
		expect(header).toContain('HttpOnly');
		expect(header).toContain('SameSite=Lax');
		expect(header).toContain('Path=/');
		expect(header).toMatch(/Max-Age=\d+/);
	});
});

describe('POST /login', () => {
	test('responds 200 with the member and logs them in', async () => {
		await signedUp(ada);
		const agent = browser();
		const res = await agent.post('/login').send({ email: ada.email, password: ada.password });
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' });
		expect((await agent.get('/me')).status).toBe(200);
	});

	test('accepts the email in any case with spaces around it', async () => {
		await signedUp(ada);
		const res = await request(app).post('/login').send({ email: '  Ada@EXAMPLE.com ', password: ada.password });
		expect(res.status).toBe(200);
	});

	test('responds 401 with the same message for a wrong password and an unknown email', async () => {
		await signedUp(ada);
		const wrongPassword = await request(app).post('/login').send({ email: ada.email, password: 'not-the-password' });
		const unknownEmail = await request(app).post('/login').send({ email: 'nobody@example.com', password: ada.password });
		expect(wrongPassword.status).toBe(401);
		expect(unknownEmail.status).toBe(401);
		expect(wrongPassword.body).toEqual({ error: 'Invalid email or password' });
		expect(unknownEmail.body).toEqual({ error: 'Invalid email or password' });
	});

	test('does not set a cookie when the log-in fails', async () => {
		await signedUp(ada);
		const res = await request(app).post('/login').send({ email: ada.email, password: 'not-the-password' });
		expect(res.status).toBe(401);
		expect(res.headers['set-cookie']).toBeUndefined();
	});

	test('responds 401, not a crash, when the body has no email or password', async () => {
		await signedUp(ada);
		expect((await request(app).post('/login')).status).toBe(401);
		expect((await request(app).post('/login').send({ email: ada.email })).status).toBe(401);
		expect((await request(app).post('/login').send({ email: 42, password: 7 })).status).toBe(401);
	});

	test('gives each log-in its own session, so two browsers can be logged in as different members', async () => {
		const { agent: adaBrowser } = await signedUp(ada);
		const { agent: graceBrowser } = await signedUp(grace);
		expect((await adaBrowser.get('/me')).body.name).toBe('Ada Lovelace');
		expect((await graceBrowser.get('/me')).body.name).toBe('Grace Hopper');
	});
});

describe('POST /logout', () => {
	test('responds 204 and ends the session', async () => {
		const { agent } = await signedUp(ada);
		const res = await agent.post('/logout');
		expect(res.status).toBe(204);
		expect((await agent.get('/me')).status).toBe(401);
	});

	test('ends the session on the server, so a copied cookie stops working too', async () => {
		const { agent, res: signup } = await signedUp(ada);
		const cookie = signup.headers['set-cookie'][0].split(';')[0];
		await agent.post('/logout');
		const stolen = await request(app).get('/me').set('Cookie', cookie);
		expect(stolen.status).toBe(401);
	});

	test('tells the browser to delete the cookie', async () => {
		const { agent } = await signedUp(ada);
		const res = await agent.post('/logout');
		const header = res.headers['set-cookie'].join('\n');
		expect(header).toMatch(/^sid=;/);
		expect(header).toContain('Max-Age=0');
	});

	test('responds 204 when nobody is logged in', async () => {
		const res = await request(app).post('/logout');
		expect(res.status).toBe(204);
	});

	test('leaves other members logged in', async () => {
		const { agent: adaBrowser } = await signedUp(ada);
		const { agent: graceBrowser } = await signedUp(grace);
		await adaBrowser.post('/logout');
		expect((await graceBrowser.get('/me')).status).toBe(200);
	});
});

describe('GET /me', () => {
	test('responds 401 when there is no cookie', async () => {
		const res = await request(app).get('/me');
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ error: 'Log in first' });
	});

	test('responds 401 for a session id the server never made', async () => {
		const res = await request(app).get('/me').set('Cookie', `sid=${'0'.repeat(64)}`);
		expect(res.status).toBe(401);
	});

	test('responds 401, not a crash, for a cookie header it cannot decode', async () => {
		const res = await request(app).get('/me').set('Cookie', 'sid=%');
		expect(res.status).toBe(401);
	});

	test('finds the session among other cookies', async () => {
		const { res: signup } = await signedUp(ada);
		const sid = signup.headers['set-cookie'][0].split(';')[0];
		const res = await request(app).get('/me').set('Cookie', `theme=dark; ${sid}; lang=en`);
		expect(res.status).toBe(200);
	});
});

describe('GET /books', () => {
	test('lists the three books without a log-in', async () => {
		const res = await request(app).get('/books');
		expect(res.status).toBe(200);
		expect(res.body.map((book) => book.title)).toEqual(['Kindred', 'The Left Hand of Darkness', 'Beloved']);
		expect(res.body[0]).toEqual({ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
	});
});

describe('POST /loans', () => {
	test('responds 401 when nobody is logged in', async () => {
		const res = await request(app).post('/loans').send({ bookId: 1 });
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ error: 'Log in first' });
	});

	test('responds 201 with a loan for the logged-in member', async () => {
		const { agent } = await signedUp(ada);
		const res = await agent.post('/loans').send({ bookId: 2 });
		expect(res.status).toBe(201);
		expect(res.body).toEqual({
			id: 1,
			bookId: 2,
			memberId: 1,
			borrowedAt: expect.any(String),
			returnedAt: null,
		});
	});

	test('ignores a memberId in the body: the loan belongs to whoever is logged in', async () => {
		await signedUp(ada);
		const { agent } = await signedUp(grace);
		const res = await agent.post('/loans').send({ bookId: 1, memberId: 1 });
		expect(res.body.memberId).toBe(2);
	});

	test('responds 404 when no book has that id', async () => {
		const { agent } = await signedUp(ada);
		const res = await agent.post('/loans').send({ bookId: 99 });
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Book not found' });
	});

	test('responds 409 when the book is already on loan, to anyone', async () => {
		const { agent: adaBrowser } = await signedUp(ada);
		const { agent: graceBrowser } = await signedUp(grace);
		await adaBrowser.post('/loans').send({ bookId: 1 });
		const res = await graceBrowser.post('/loans').send({ bookId: 1 });
		expect(res.status).toBe(409);
		expect(res.body).toEqual({ error: 'Book is already on loan' });
	});
});

describe('GET /loans', () => {
	test('responds 401 when nobody is logged in', async () => {
		const res = await request(app).get('/loans');
		expect(res.status).toBe(401);
	});

	test('lists only the logged-in member\'s loans', async () => {
		const { agent: adaBrowser } = await signedUp(ada);
		const { agent: graceBrowser } = await signedUp(grace);
		await adaBrowser.post('/loans').send({ bookId: 1 });
		await graceBrowser.post('/loans').send({ bookId: 2 });

		const adaLoans = await adaBrowser.get('/loans');
		expect(adaLoans.status).toBe(200);
		expect(adaLoans.body.map((loan) => loan.bookId)).toEqual([1]);
		const graceLoans = await graceBrowser.get('/loans');
		expect(graceLoans.body.map((loan) => loan.bookId)).toEqual([2]);
	});

	test('lists nothing for a member who has borrowed nothing', async () => {
		const { agent } = await signedUp(ada);
		const res = await agent.get('/loans');
		expect(res.body).toEqual([]);
	});
});

describe('the home page', () => {
	test('GET / serves the log-in page', async () => {
		const res = await request(app).get('/');
		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toMatch(/text\/html/);
		expect(res.text).toContain('<title>Library log-in</title>');
	});
});
