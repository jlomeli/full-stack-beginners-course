import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { debounce, memoize, once } from './01-function-tools.js';

describe('once', () => {
	test('returns what fn returns', () => {
		const getAnswer = once(() => 42);
		expect(getAnswer()).toBe(42);
	});

	test('passes its arguments along to fn', () => {
		const add = once((a, b, c) => a + b + c);
		expect(add(1, 2, 3)).toBe(6);
	});

	test('calls fn only the first time', () => {
		const fn = vi.fn(() => 'done');
		const onlyOnce = once(fn);
		onlyOnce();
		onlyOnce();
		onlyOnce();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('keeps returning the first result, even with different arguments', () => {
		const double = once((n) => n * 2);
		expect(double(5)).toBe(10);
		expect(double(100)).toBe(10);
	});

	test('does not call fn again when its first result was undefined', () => {
		const fn = vi.fn(() => undefined);
		const onlyOnce = once(fn);
		onlyOnce();
		onlyOnce();
		expect(fn).toHaveBeenCalledTimes(1);
	});
});

describe('memoize', () => {
	test('returns what fn returns', () => {
		const square = memoize((n) => n * n);
		expect(square(9)).toBe(81);
	});

	test('calls fn only once for the same argument', () => {
		const fn = vi.fn((n) => n * n);
		const square = memoize(fn);
		expect(square(4)).toBe(16);
		expect(square(4)).toBe(16);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('calls fn again for a different argument', () => {
		const fn = vi.fn((n) => n * n);
		const square = memoize(fn);
		expect(square(2)).toBe(4);
		expect(square(3)).toBe(9);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('remembers results that are 0, false, or undefined', () => {
		const fn = vi.fn((name) => ({ zero: 0, no: false }[name]));
		const lookup = memoize(fn);
		for (const name of ['zero', 'no', 'missing']) {
			lookup(name);
			lookup(name);
		}
		expect(fn).toHaveBeenCalledTimes(3);
		expect(lookup('zero')).toBe(0);
	});

	test('each memoized function remembers its own results', () => {
		const double = memoize((n) => n * 2);
		const triple = memoize((n) => n * 3);
		expect(double(5)).toBe(10);
		expect(triple(5)).toBe(15);
	});
});

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('waits the full delay before calling fn', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced();
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(99);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('a burst of calls runs fn once, with the last arguments', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced('H');
		debounced('Hi');
		debounced('Hi!');
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('Hi!');
	});

	test('each call restarts the wait', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced();
		vi.advanceTimersByTime(80);
		debounced();
		vi.advanceTimersByTime(80);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(20);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('two bursts far apart run fn twice', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced('first');
		vi.advanceTimersByTime(500);
		debounced('second');
		vi.advanceTimersByTime(500);
		expect(fn.mock.calls).toEqual([['first'], ['second']]);
	});

	test('each debounced function has its own timer', () => {
		const save = vi.fn();
		const search = vi.fn();
		const debouncedSave = debounce(save, 100);
		const debouncedSearch = debounce(search, 100);
		debouncedSave('draft');
		debouncedSearch('shoes');
		vi.advanceTimersByTime(100);
		expect(save).toHaveBeenCalledWith('draft');
		expect(search).toHaveBeenCalledWith('shoes');
	});
});
