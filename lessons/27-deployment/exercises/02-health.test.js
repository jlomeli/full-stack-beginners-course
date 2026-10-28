import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createApp } from './02-health.js';

const config = { nodeEnv: 'production', port: 3000 };

describe('GET /health', () => {
	test('responds 200 with status ok and the environment name when the database answers', async () => {
		const res = await request(createApp({ db: new PGlite(), config })).get('/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok', env: 'production' });
	});

	test('actually asks the database a question', async () => {
		const sqls = [];
		const db = { query: async (sql) => (sqls.push(sql), { rows: [{ '?column?': 1 }] }) };
		await request(createApp({ db, config })).get('/health');
		expect(sqls).toHaveLength(1);
	});

	test('responds 503 with status unavailable when the database is down', async () => {
		const db = { query: async () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:5432')) };
		const res = await request(createApp({ db, config })).get('/health');
		expect(res.status).toBe(503);
		expect(res.body).toEqual({ status: 'unavailable' });
	});

	test('does not leak the database error in the response', async () => {
		const db = { query: async () => Promise.reject(new Error('password authentication failed for user "admin"')) };
		const res = await request(createApp({ db, config })).get('/health');
		expect(res.text).not.toContain('admin');
		expect(res.text).not.toContain('ECONNREFUSED');
	});

	test('tells caches not to store the answer, for both outcomes', async () => {
		const ok = await request(createApp({ db: new PGlite(), config })).get('/health');
		const down = await request(createApp({ db: { query: async () => Promise.reject(new Error('x')) }, config })).get('/health');
		expect(ok.headers['cache-control']).toBe('no-store');
		expect(down.headers['cache-control']).toBe('no-store');
	});
});

describe('other paths', () => {
	test('respond 404 with a JSON error', async () => {
		const res = await request(createApp({ db: new PGlite(), config })).get('/nope');
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Not found' });
	});
});
