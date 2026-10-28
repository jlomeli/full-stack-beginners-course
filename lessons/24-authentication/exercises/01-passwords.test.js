import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword } from './01-passwords.js';

// Made with scrypt, the 16 bytes 00112233445566778899aabbccddeeff as the salt, and the password "correct horse".
const KNOWN =
	'scrypt$00112233445566778899aabbccddeeff$f5206d570fcd120bd1f23a8cd186bd87c04ac1db00e9ac1efca589774ae6ecb894992b7ee89035d39ef675dceec6f03c56434def62315db0afa7af5990f9b57b';

describe('hashPassword', () => {
	test('returns scrypt$<32 hex characters of salt>$<128 hex characters of hash>', async () => {
		expect(await hashPassword('correct horse')).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
	});

	test('uses a new random salt on every call, so the same password gives different results', async () => {
		const first = await hashPassword('correct horse');
		const second = await hashPassword('correct horse');
		expect(first).not.toBe(second);
	});

	test('does not contain the password', async () => {
		expect(await hashPassword('hunter2hunter2')).not.toContain('hunter2');
	});
});

describe('verifyPassword', () => {
	test('accepts the password that was hashed', async () => {
		const stored = await hashPassword('correct horse');
		expect(await verifyPassword('correct horse', stored)).toBe(true);
	});

	test('rejects a different password', async () => {
		const stored = await hashPassword('correct horse');
		expect(await verifyPassword('correct horse!', stored)).toBe(false);
		expect(await verifyPassword('', stored)).toBe(false);
	});

	test('accepts the known password for a stored value made with the documented format', async () => {
		expect(await verifyPassword('correct horse', KNOWN)).toBe(true);
	});

	test('rejects the wrong password for the known stored value', async () => {
		expect(await verifyPassword('Correct horse', KNOWN)).toBe(false);
	});

	test('resolves to false, and never throws, for values that are not in the stored format', async () => {
		const [, salt, hash] = KNOWN.split('$');
		const malformed = [
			'',
			'correct horse',
			`bcrypt$${salt}$${hash}`,
			`scrypt$${salt}`,
			`scrypt$$${hash}`,
			`scrypt$${salt}$`,
			`scrypt$${salt}$abcd`,
			`scrypt$${salt}$${hash.slice(0, -2)}`,
			undefined,
			null,
		];
		for (const stored of malformed) {
			expect(await verifyPassword('correct horse', stored), `stored value: ${String(stored)}`).toBe(false);
		}
	});
});
