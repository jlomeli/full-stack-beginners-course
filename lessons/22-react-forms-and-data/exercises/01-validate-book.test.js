import { describe, expect, test } from 'vitest';
import { validateBook } from './01-validate-book.js';

const valid = { title: 'Kindred', author: 'Octavia E. Butler', year: '1979' };
const thisYear = new Date().getFullYear();

describe('validateBook', () => {
	test('returns no messages for a valid book', () => {
		expect(validateBook(valid)).toEqual({});
	});

	test('requires a title, even when the user typed only spaces', () => {
		expect(validateBook({ ...valid, title: '' })).toEqual({ title: 'Title is required' });
		expect(validateBook({ ...valid, title: '   ' })).toEqual({ title: 'Title is required' });
	});

	test('requires an author', () => {
		expect(validateBook({ ...valid, author: ' ' })).toEqual({ author: 'Author is required' });
	});

	test('requires a year', () => {
		expect(validateBook({ ...valid, year: '' })).toEqual({ year: 'Year is required' });
	});

	test('rejects a year that is not a whole number', () => {
		for (const year of ['19x4', '1.5', 'soon', '-300']) {
			expect(validateBook({ ...valid, year })).toEqual({ year: 'Year must be a whole number' });
		}
	});

	test('rejects a year after this one, and accepts this year', () => {
		expect(validateBook({ ...valid, year: String(thisYear + 1) })).toEqual({ year: 'Year cannot be in the future' });
		expect(validateBook({ ...valid, year: String(thisYear) })).toEqual({});
	});

	test('accepts a year with spaces around it', () => {
		expect(validateBook({ ...valid, year: ' 1979 ' })).toEqual({});
	});

	test('reports every invalid field at once', () => {
		expect(validateBook({ title: '', author: '', year: 'soon' })).toEqual({
			title: 'Title is required',
			author: 'Author is required',
			year: 'Year must be a whole number',
		});
	});
});
