import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { requestLogger } from './02-request-logger.js';

function appWithLogger(log) {
	const app = express();
	app.use(requestLogger(log));
	app.get('/hello', (req, res) => {
		res.send('hi');
	});
	app.post('/things', (req, res) => {
		res.status(201).json({ ok: true });
	});
	app.get('/slow', async (req, res) => {
		await new Promise((resolve) => setTimeout(resolve, 50));
		res.send('done');
	});
	return app;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('requestLogger', () => {
	test('calls next(), so the route registered after it still answers', async () => {
		const res = await request(appWithLogger(vi.fn())).get('/hello');
		expect(res.status).toBe(200);
		expect(res.text).toBe('hi');
	});

	test('logs one line with the method, path, status, and duration', async () => {
		const log = vi.fn();
		await request(appWithLogger(log)).get('/hello');
		expect(log).toHaveBeenCalledTimes(1);
		expect(log.mock.calls[0][0]).toMatch(/^GET \/hello 200 \d+ms$/);
	});

	test('logs the status the route chose, not the default 200', async () => {
		const log = vi.fn();
		await request(appWithLogger(log)).post('/things');
		expect(log.mock.calls[0]?.[0]).toMatch(/^POST \/things 201 \d+ms$/);
	});

	test('logs requests that no route matched with status 404', async () => {
		const log = vi.fn();
		await request(appWithLogger(log)).get('/missing');
		expect(log.mock.calls[0]?.[0]).toMatch(/^GET \/missing 404 \d+ms$/);
	});

	test('keeps the query string in the logged URL', async () => {
		const log = vi.fn();
		await request(appWithLogger(log)).get('/hello?name=Ada');
		expect(log.mock.calls[0]?.[0]).toMatch(/^GET \/hello\?name=Ada 200 \d+ms$/);
	});

	test('measures the time until the response is sent, including slow routes', async () => {
		const log = vi.fn();
		await request(appWithLogger(log)).get('/slow');
		const duration = Number(log.mock.calls[0]?.[0].match(/ (\d+)ms$/)?.[1]);
		expect(duration).toBeGreaterThanOrEqual(40);
	});

	test('writes to console.log when no log function is passed', async () => {
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		await request(appWithLogger()).get('/hello');
		expect(consoleLog).toHaveBeenCalledTimes(1);
		expect(consoleLog.mock.calls[0][0]).toMatch(/^GET \/hello 200 \d+ms$/);
	});
});
