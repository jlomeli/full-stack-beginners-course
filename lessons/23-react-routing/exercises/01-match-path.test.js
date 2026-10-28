import { describe, expect, test } from 'vitest';
import { matchPath } from './01-match-path.js';

describe('matchPath', () => {
	test('matches a fixed path and returns an empty params object', () => {
		expect(matchPath('/books', '/books')).toEqual({});
	});

	test('returns null when a fixed segment differs', () => {
		expect(matchPath('/books', '/authors')).toBeNull();
	});

	test('matches the root path only against the root path', () => {
		expect(matchPath('/', '/')).toEqual({});
		expect(matchPath('/', '/books')).toBeNull();
	});

	test('captures a parameter as a string', () => {
		expect(matchPath('/books/:id', '/books/42')).toEqual({ id: '42' });
	});

	test('captures a parameter in the middle of the pattern', () => {
		expect(matchPath('/books/:id/edit', '/books/42/edit')).toEqual({ id: '42' });
	});

	test('captures several parameters', () => {
		expect(matchPath('/authors/:authorId/books/:bookId', '/authors/7/books/12')).toEqual({ authorId: '7', bookId: '12' });
	});

	test('returns null when the path has more segments than the pattern', () => {
		expect(matchPath('/books/:id', '/books/42/edit')).toBeNull();
	});

	test('returns null when the path has fewer segments than the pattern', () => {
		expect(matchPath('/books/:id', '/books')).toBeNull();
	});

	test('returns null when a fixed segment after a parameter differs', () => {
		expect(matchPath('/books/:id/edit', '/books/42/delete')).toBeNull();
	});

	test('ignores a trailing slash on the path', () => {
		expect(matchPath('/books/:id', '/books/42/')).toEqual({ id: '42' });
	});

	test('ignores a trailing slash on the pattern', () => {
		expect(matchPath('/books/', '/books')).toEqual({});
	});

	test('decodes percent-encoded characters in a captured value', () => {
		expect(matchPath('/search/:term', '/search/dune%20messiah')).toEqual({ term: 'dune messiah' });
	});

	test('compares fixed segments exactly, including case', () => {
		expect(matchPath('/books', '/Books')).toBeNull();
	});
});
