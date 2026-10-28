import { describe, expect, test } from 'vitest';
import { fizzbuzz, fizzbuzzUpTo } from './02-fizzbuzz.js';

describe('fizzbuzz', () => {
	test('plain numbers become strings', () => {
		expect(fizzbuzz(1)).toBe('1');
		expect(fizzbuzz(7)).toBe('7');
	});
	test('multiples of 3', () => expect(fizzbuzz(9)).toBe('Fizz'));
	test('multiples of 5', () => expect(fizzbuzz(10)).toBe('Buzz'));
	test('multiples of 3 and 5', () => {
		expect(fizzbuzz(15)).toBe('FizzBuzz');
		expect(fizzbuzz(45)).toBe('FizzBuzz');
	});
});

describe('fizzbuzzUpTo', () => {
	test('the first fifteen', () => {
		expect(fizzbuzzUpTo(15)).toEqual([
			'1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz',
		]);
	});
	test('zero gives an empty array', () => expect(fizzbuzzUpTo(0)).toEqual([]));
});
