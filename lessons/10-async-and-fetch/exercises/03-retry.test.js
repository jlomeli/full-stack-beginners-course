import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fetchJsonWithRetry, retry } from './03-retry.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

// Runs `promise` to the end under fake timers and returns how it settled.
async function settle(promise) {
	const outcome = promise.then(
		(value) => ({ value }),
		(error) => ({ error }),
	);
	await vi.runAllTimersAsync();
	return outcome;
}

const gaps = (times) => times.slice(1).map((time, i) => time - times[i]);

function failingTask(failures, result = 'ok') {
	const times = [];
	const task = vi.fn(async () => {
		times.push(Date.now());
		if (times.length <= failures) throw new Error(`failure ${times.length}`);
		return result;
	});
	return { task, times };
}

test('retry returns the result and calls the task once when it succeeds first time', async () => {
	const { task } = failingTask(0, 'fine');
	expect(await settle(retry(task))).toEqual({ value: 'fine' });
	expect(task).toHaveBeenCalledTimes(1);
});

test('retry does not wait when the first attempt succeeds', async () => {
	const { task } = failingTask(0);
	const result = retry(task);
	await Promise.resolve();
	expect(vi.getTimerCount()).toBe(0);
	await expect(result).resolves.toBe('ok');
});

test('retry tries again after a failure and returns the first success', async () => {
	const { task } = failingTask(2, 'third time lucky');
	expect(await settle(retry(task))).toEqual({ value: 'third time lucky' });
	expect(task).toHaveBeenCalledTimes(3);
});

test('retry waits 100, 200, then 400 milliseconds by default, doubling each time', async () => {
	const { task, times } = failingTask(3);
	await settle(retry(task));
	expect(gaps(times)).toEqual([100, 200, 400]);
});

test('retry uses the baseDelay you pass in', async () => {
	const { task, times } = failingTask(2);
	await settle(retry(task, { baseDelay: 1000 }));
	expect(gaps(times)).toEqual([1000, 2000]);
});

test('retry gives up after 3 retries by default and rejects with the last error', async () => {
	const { task } = failingTask(Infinity);
	const outcome = await settle(retry(task));
	expect(task).toHaveBeenCalledTimes(4);
	expect(outcome.error.message).toBe('failure 4');
});

test('retry honors the retries option', async () => {
	const { task } = failingTask(Infinity);
	await settle(retry(task, { retries: 1 }));
	expect(task).toHaveBeenCalledTimes(2);
});

test('retries: 0 means one attempt and no waiting', async () => {
	const { task } = failingTask(Infinity);
	const outcome = await settle(retry(task, { retries: 0 }));
	expect(task).toHaveBeenCalledTimes(1);
	expect(outcome.error.message).toBe('failure 1');
});

test('retry does not wait after the final failure', async () => {
	const { task } = failingTask(Infinity);
	const result = retry(task, { retries: 1, baseDelay: 100 });
	const outcome = settle(result);
	await vi.advanceTimersByTimeAsync(100);
	expect(task).toHaveBeenCalledTimes(2);
	expect(vi.getTimerCount()).toBe(0);
	await outcome;
});

test('retry stops right away when shouldRetry says no', async () => {
	const { task } = failingTask(Infinity);
	const outcome = await settle(retry(task, { shouldRetry: () => false }));
	expect(task).toHaveBeenCalledTimes(1);
	expect(outcome.error.message).toBe('failure 1');
});

test('retry gives shouldRetry the error from the failed attempt', async () => {
	const { task } = failingTask(Infinity);
	const shouldRetry = vi.fn((error) => error.message !== 'failure 2');
	const outcome = await settle(retry(task, { shouldRetry }));
	expect(shouldRetry).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: 'failure 1' }));
	expect(task).toHaveBeenCalledTimes(2);
	expect(outcome.error.message).toBe('failure 2');
});

function stubFetch(...statuses) {
	let call = 0;
	const fetchMock = vi.fn(async () => {
		const status = statuses[Math.min(call++, statuses.length - 1)];
		if (status === 'network') throw new TypeError('Failed to fetch');
		return Response.json({ call }, { status });
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

test('fetchJsonWithRetry returns the JSON when the first request works', async () => {
	const fetchMock = stubFetch(200);
	expect(await settle(fetchJsonWithRetry('/api/books'))).toEqual({ value: { call: 1 } });
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('fetchJsonWithRetry retries a 503 and returns the JSON from the request that works', async () => {
	const fetchMock = stubFetch(503, 503, 200);
	expect(await settle(fetchJsonWithRetry('/api/books'))).toEqual({ value: { call: 3 } });
	expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('fetchJsonWithRetry retries when the network fails', async () => {
	const fetchMock = stubFetch('network', 200);
	expect(await settle(fetchJsonWithRetry('/api/books'))).toEqual({ value: { call: 2 } });
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('fetchJsonWithRetry does not retry a 404', async () => {
	const fetchMock = stubFetch(404);
	const outcome = await settle(fetchJsonWithRetry('/api/books/99'));
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(outcome.error.message).toBe('Request failed with status 404');
});

test('fetchJsonWithRetry gives up on a server that stays down', async () => {
	const fetchMock = stubFetch(500);
	const outcome = await settle(fetchJsonWithRetry('/api/books'));
	expect(fetchMock).toHaveBeenCalledTimes(4);
	expect(outcome.error.message).toBe('Request failed with status 500');
});
