import { describe, expect, test } from 'vitest';
import { celsiusToFahrenheit, fahrenheitToCelsius } from './01-temperature.js';

describe('celsiusToFahrenheit', () => {
	test('water freezes at 32°F', () => expect(celsiusToFahrenheit(0)).toBe(32));
	test('water boils at 212°F', () => expect(celsiusToFahrenheit(100)).toBe(212));
	test('-40 is the same in both scales', () => expect(celsiusToFahrenheit(-40)).toBe(-40));
	test('body temperature', () => expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6));
});

describe('fahrenheitToCelsius', () => {
	test('32°F is 0°C', () => expect(fahrenheitToCelsius(32)).toBe(0));
	test('212°F is 100°C', () => expect(fahrenheitToCelsius(212)).toBe(100));
	test('converting there and back gives the original value', () => {
		expect(fahrenheitToCelsius(celsiusToFahrenheit(21.5))).toBeCloseTo(21.5);
	});
});
