import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { delay, fetchJson, loadAll, withTimeout } from './01-async-basics.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

test('delay does not resolve before the time is up', async () => {
	const onResolve = vi.fn();
	delay(1000, 'done').then(onResolve);
	await vi.advanceTimersByTimeAsync(999);
	expect(onResolve).not.toHaveBeenCalled();
});

test('delay resolves with the value once the time is up', async () => {
	const onResolve = vi.fn();
	delay(1000, 'done').then(onResolve);
	await vi.advanceTimersByTimeAsync(1000);
	expect(onResolve).toHaveBeenCalledWith('done');
});

test('fetchJson requests the URL and returns the parsed JSON', async () => {
	const fetchMock = vi.fn(async () => Response.json({ title: 'Dune' }));
	vi.stubGlobal('fetch', fetchMock);
	await expect(fetchJson('/api/books/1')).resolves.toEqual({ title: 'Dune' });
	expect(fetchMock).toHaveBeenCalledWith('/api/books/1');
});

test('fetchJson rejects with the status code when the response is not ok', async () => {
	vi.stubGlobal('fetch', async () => Response.json({}, { status: 404 }));
	await expect(fetchJson('/api/books/99')).rejects.toThrow('Request failed with status 404');
});

test('fetchJson lets a network failure through unchanged', async () => {
	vi.stubGlobal('fetch', async () => {
		throw new TypeError('Failed to fetch');
	});
	await expect(fetchJson('/api/books')).rejects.toThrow('Failed to fetch');
});

test('loadAll returns each URL JSON in the order of the URLs', async () => {
	const pending = { '/a': deferred(), '/b': deferred(), '/c': deferred() };
	vi.stubGlobal('fetch', (url) => pending[url].promise);

	const result = loadAll(['/a', '/b', '/c']);
	pending['/c'].resolve(Response.json('third'));
	pending['/a'].resolve(Response.json('first'));
	pending['/b'].resolve(Response.json('second'));

	await expect(result).resolves.toEqual(['first', 'second', 'third']);
});

test('loadAll starts every request before waiting for any of them', () => {
	const fetchMock = vi.fn(() => new Promise(() => {}));
	vi.stubGlobal('fetch', fetchMock);
	loadAll(['/a', '/b', '/c']);
	expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('loadAll rejects when any request fails', async () => {
	vi.stubGlobal('fetch', async (url) => Response.json({}, { status: url === '/b' ? 500 : 200 }));
	await expect(loadAll(['/a', '/b'])).rejects.toThrow('Request failed with status 500');
});

test('loadAll of no URLs resolves to an empty array', async () => {
	vi.stubGlobal('fetch', vi.fn());
	await expect(loadAll([])).resolves.toEqual([]);
});

test('withTimeout resolves with the value when the promise is fast enough', async () => {
	const slow = new Promise((resolve) => setTimeout(resolve, 100, 'ready'));
	const result = withTimeout(slow, 500);
	await vi.advanceTimersByTimeAsync(100);
	await expect(result).resolves.toBe('ready');
});

test('withTimeout rejects with the original error when the promise fails first', async () => {
	const failing = new Promise((_, reject) => setTimeout(reject, 100, new Error('disk on fire')));
	const result = withTimeout(failing, 500);
	const outcome = expect(result).rejects.toThrow('disk on fire');
	await vi.advanceTimersByTimeAsync(100);
	await outcome;
});

test('withTimeout rejects with "Timed out after 500ms" when the promise is too slow', async () => {
	const never = new Promise(() => {});
	const result = withTimeout(never, 500);
	const outcome = expect(result).rejects.toThrow('Timed out after 500ms');
	await vi.advanceTimersByTimeAsync(500);
	await outcome;
});

test('withTimeout does not time out before the time is up', async () => {
	const never = new Promise(() => {});
	const onSettle = vi.fn();
	withTimeout(never, 500).then(onSettle, onSettle);
	await vi.advanceTimersByTimeAsync(499);
	expect(onSettle).not.toHaveBeenCalled();
});

test('withTimeout clears its timer once the promise settles', async () => {
	const result = withTimeout(Promise.resolve('fast'), 5000);
	await expect(result).resolves.toBe('fast');
	expect(vi.getTimerCount()).toBe(0);
});
