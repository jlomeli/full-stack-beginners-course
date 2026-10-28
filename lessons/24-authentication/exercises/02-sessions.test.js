import { describe, expect, test } from 'vitest';
import { createSessionStore, parseCookies, serializeCookie } from './02-sessions.js';

describe('parseCookies', () => {
	test('returns an empty object for a missing or empty header', () => {
		expect(parseCookies(undefined)).toEqual({});
		expect(parseCookies('')).toEqual({});
	});

	test('reads several cookies separated by "; "', () => {
		expect(parseCookies('theme=dark; sid=abc123')).toEqual({ theme: 'dark', sid: 'abc123' });
	});

	test('trims spaces around names and values', () => {
		expect(parseCookies('  a = 1 ;b=2  ')).toEqual({ a: '1', b: '2' });
	});

	test('keeps every "=" after the first one in the value', () => {
		expect(parseCookies('token=a=b==')).toEqual({ token: 'a=b==' });
	});

	test('ignores a part that has no "="', () => {
		expect(parseCookies('oops; sid=abc')).toEqual({ sid: 'abc' });
	});

	test('decodes percent-encoded values', () => {
		expect(parseCookies('name=Ada%20Lovelace')).toEqual({ name: 'Ada Lovelace' });
	});

	test('keeps a value that cannot be decoded as it is, without throwing', () => {
		expect(parseCookies('bad=100%; sid=abc')).toEqual({ bad: '100%', sid: 'abc' });
	});

	test('keeps the first value when a name appears twice', () => {
		expect(parseCookies('sid=first; sid=second')).toEqual({ sid: 'first' });
	});
});

describe('serializeCookie', () => {
	test('writes only name=value when there are no options', () => {
		expect(serializeCookie('sid', 'abc')).toBe('sid=abc');
	});

	test('adds the attributes in the documented order', () => {
		const header = serializeCookie('sid', 'abc', {
			sameSite: 'Strict',
			secure: true,
			httpOnly: true,
			maxAge: 60,
			path: '/',
		});
		expect(header).toBe('sid=abc; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=Strict');
	});

	test('writes Max-Age=0, which tells the browser to delete the cookie', () => {
		expect(serializeCookie('sid', '', { path: '/', maxAge: 0 })).toBe('sid=; Path=/; Max-Age=0');
	});

	test('leaves out HttpOnly and Secure when they are false or missing', () => {
		expect(serializeCookie('sid', 'abc', { httpOnly: false, secure: false, path: '/' })).toBe('sid=abc; Path=/');
	});

	test('encodes the value so it cannot add attributes', () => {
		expect(serializeCookie('note', 'a; b=c')).toBe('note=a%3B%20b%3Dc');
	});
});

describe('createSessionStore', () => {
	test('create returns a 64-character hex id', () => {
		const store = createSessionStore();
		expect(store.create(1)).toMatch(/^[0-9a-f]{64}$/);
	});

	test('create returns a different id every time, even for the same user', () => {
		const store = createSessionStore();
		const ids = new Set(Array.from({ length: 20 }, () => store.create(1)));
		expect(ids.size).toBe(20);
	});

	test('get returns the user id stored for a session id', () => {
		const store = createSessionStore();
		const ada = store.create(1);
		const grace = store.create(2);
		expect(store.get(ada)).toBe(1);
		expect(store.get(grace)).toBe(2);
	});

	test('get returns undefined for an id it has never seen', () => {
		const store = createSessionStore();
		const known = store.create(1);
		expect(store.get(known)).toBe(1);
		expect(store.get('nope')).toBeUndefined();
		expect(store.get(undefined)).toBeUndefined();
	});

	test('destroy ends the session, and only that one', () => {
		const store = createSessionStore();
		const first = store.create(1);
		const second = store.create(1);
		store.destroy(first);
		expect(store.get(first)).toBeUndefined();
		expect(store.get(second)).toBe(1);
	});

	test('destroy does not throw for an unknown id', () => {
		const store = createSessionStore();
		const id = store.create(1);
		expect(() => store.destroy('nope')).not.toThrow();
		expect(store.get(id)).toBe(1);
	});

	test('a session is valid until ttlMs has passed and expired after that', () => {
		let time = 1_000;
		const store = createSessionStore({ ttlMs: 500, now: () => time });
		const id = store.create(7);
		time = 1_499;
		expect(store.get(id)).toBe(7);
		time = 1_500;
		expect(store.get(id)).toBeUndefined();
	});

	test('an expired session stays gone', () => {
		let time = 0;
		const store = createSessionStore({ ttlMs: 10, now: () => time });
		const id = store.create(7);
		expect(store.get(id)).toBe(7);
		time = 50;
		store.get(id);
		time = 0;
		expect(store.get(id)).toBeUndefined();
	});

	test('sessions last 7 days by default', () => {
		let time = 0;
		const store = createSessionStore({ now: () => time });
		const id = store.create(3);
		time = 7 * 24 * 60 * 60 * 1000 - 1;
		expect(store.get(id)).toBe(3);
		time = 7 * 24 * 60 * 60 * 1000;
		expect(store.get(id)).toBeUndefined();
	});
});
