import { describe, expect, test } from 'vitest';
import { loadConfig } from './01-config.js';

const valid = {
	DATABASE_URL: 'postgres://user:pw@db.example.com:5432/library',
	SESSION_SECRET: 'a-secret-that-is-at-least-32-characters-long',
};

describe('loadConfig', () => {
	test('returns the config with camelCase keys', () => {
		const config = loadConfig({ ...valid, NODE_ENV: 'production', PORT: '8080', CORS_ORIGIN: 'https://library.example.com' });
		expect(config).toEqual({
			nodeEnv: 'production',
			port: 8080,
			databaseUrl: valid.DATABASE_URL,
			sessionSecret: valid.SESSION_SECRET,
			corsOrigin: 'https://library.example.com',
		});
	});

	test('converts PORT from a string to a number', () => {
		expect(loadConfig({ ...valid, PORT: '4000' }).port).toBe(4000);
	});

	test('uses development and port 3000 when NODE_ENV and PORT are missing', () => {
		const config = loadConfig(valid);
		expect(config.nodeEnv).toBe('development');
		expect(config.port).toBe(3000);
	});

	test('leaves corsOrigin undefined when CORS_ORIGIN is missing', () => {
		expect(loadConfig(valid).corsOrigin).toBeUndefined();
	});

	test('accepts a postgresql:// URL', () => {
		expect(loadConfig({ ...valid, DATABASE_URL: 'postgresql://localhost/library' }).databaseUrl).toBe('postgresql://localhost/library');
	});

	test('throws "Invalid environment" when DATABASE_URL is missing, and names it', () => {
		const { DATABASE_URL, ...rest } = valid;
		expect(() => loadConfig(rest)).toThrow(/Invalid environment:/);
		expect(() => loadConfig(rest)).toThrow(/DATABASE_URL/);
	});

	test('throws when DATABASE_URL is not a postgres URL', () => {
		expect(() => loadConfig({ ...valid, DATABASE_URL: 'mysql://localhost/library' })).toThrow(/DATABASE_URL/);
	});

	test('throws when SESSION_SECRET is shorter than 32 characters', () => {
		expect(() => loadConfig({ ...valid, SESSION_SECRET: 'too-short' })).toThrow(/SESSION_SECRET/);
	});

	test.each(['abc', '0', '70000', '30.5', ''])('throws when PORT is %j', (port) => {
		expect(() => loadConfig({ ...valid, PORT: port })).toThrow(/PORT/);
	});

	test('throws when NODE_ENV is not development, test, or production', () => {
		expect(() => loadConfig({ ...valid, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
	});

	test('throws when CORS_ORIGIN is not a URL', () => {
		expect(() => loadConfig({ ...valid, CORS_ORIGIN: 'not a url' })).toThrow(/CORS_ORIGIN/);
	});

	test('reports every bad variable in one error, one per line', () => {
		let message = '';
		try {
			loadConfig({ SESSION_SECRET: 'short', PORT: 'abc' });
		} catch (error) {
			message = error.message;
		}
		const lines = message.split('\n');
		expect(lines[0]).toBe('Invalid environment:');
		expect(lines.slice(1).sort().map((line) => line.slice(0, line.indexOf(':')))).toEqual(['- DATABASE_URL', '- PORT', '- SESSION_SECRET']);
	});

	test('never puts a secret value in the error message', () => {
		let message = '';
		try {
			loadConfig({ DATABASE_URL: 'mysql://admin:hunter2@localhost/library', SESSION_SECRET: 'hunter3', PORT: '80' });
		} catch (error) {
			message = error.message;
		}
		expect(message).toMatch(/SESSION_SECRET/);
		expect(message).not.toContain('hunter2');
		expect(message).not.toContain('hunter3');
	});

	test('reads process.env when called with no argument', () => {
		const before = { ...process.env };
		Object.assign(process.env, valid, { PORT: '5555' });
		try {
			expect(loadConfig().port).toBe(5555);
		} finally {
			process.env = before;
		}
	});
});
