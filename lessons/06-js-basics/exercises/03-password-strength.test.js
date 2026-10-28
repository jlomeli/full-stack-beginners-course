import { expect, test } from 'vitest';
import { passwordStrength } from './03-password-strength.js';

test('short passwords are weak even with every kind of character', () => {
	expect(passwordStrength('aB3$')).toBe('weak');
});

test('long passwords with only one kind of character are weak', () => {
	expect(passwordStrength('correcthorsebattery')).toBe('weak');
});

test('8+ characters with 3 kinds is medium', () => {
	expect(passwordStrength('Sunshine42')).toBe('medium');
});

test('12+ characters with 3 kinds is still medium', () => {
	expect(passwordStrength('Sunshine4242')).toBe('medium');
});

test('8+ characters with all 4 kinds but under 12 is medium', () => {
	expect(passwordStrength('Sun$hine42')).toBe('medium');
});

test('12+ characters with all 4 kinds is strong', () => {
	expect(passwordStrength('Sun$hine4242')).toBe('strong');
});

test('spaces count as symbols', () => {
	expect(passwordStrength('Blue Sky 2024 x')).toBe('strong');
});

test('the empty string is weak', () => {
	expect(passwordStrength('')).toBe('weak');
});
