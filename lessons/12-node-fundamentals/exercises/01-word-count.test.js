import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { countText, formatCounts } from './01-word-count.js';

const script = fileURLToPath(new URL('./01-word-count.js', import.meta.url));

describe('countText', () => {
	test('counts lines, words, and characters', () => {
		expect(countText('one two\nthree\n')).toEqual({ lines: 2, words: 3, chars: 14 });
	});
	test('a last line without a newline does not count as a line', () => {
		expect(countText('a\nb')).toEqual({ lines: 1, words: 2, chars: 3 });
	});
	test('extra spaces, tabs, and blank lines do not make extra words', () => {
		expect(countText('  hello \t big\n\n\n world  ').words).toBe(3);
	});
	test('empty text has nothing in it', () => {
		expect(countText('')).toEqual({ lines: 0, words: 0, chars: 0 });
	});
	test('counts a multi-byte character as one character the way string length does', () => {
		expect(countText('café').chars).toBe(4);
	});
});

describe('formatCounts', () => {
	test('right-aligns each number in a 6-character column and adds the label', () => {
		expect(formatCounts({ lines: 2, words: 3, chars: 14 }, 'notes.txt')).toBe('     2     3    14 notes.txt');
	});
	test('leaves off the label and its space when there is none', () => {
		expect(formatCounts({ lines: 2, words: 3, chars: 14 })).toBe('     2     3    14');
	});
	test('does not cut off numbers wider than 6 characters', () => {
		expect(formatCounts({ lines: 1234567, words: 1, chars: 1 }, 'big')).toBe('1234567     1     1 big');
	});
});

describe('the command', () => {
	let dir;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'word-count-'));
		writeFileSync(join(dir, 'notes.txt'), 'one two\nthree\n');
		writeFileSync(join(dir, 'todo.txt'), 'buy milk\n');
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });

	test('prints one row for one file', () => {
		const result = run('notes.txt');
		expect(result.stdout).toBe('     2     3    14 notes.txt\n');
		expect(result.status).toBe(0);
	});

	test('prints a row for each file and a total row for several files', () => {
		const result = run('notes.txt', 'todo.txt');
		expect(result.stdout).toBe(
			['     2     3    14 notes.txt', '     1     2     9 todo.txt', '     3     5    23 total', ''].join('\n'),
		);
		expect(result.status).toBe(0);
	});

	test('reads the path relative to where the command runs', () => {
		const result = run(join(dir, 'todo.txt'));
		expect(result.stdout).toBe(`     1     2     9 ${join(dir, 'todo.txt')}\n`);
	});

	test('reports a missing file on stderr, still counts the others, and exits with 1', () => {
		const result = run('missing.txt', 'todo.txt');
		expect(result.stderr).toBe('word-count: missing.txt: No such file\n');
		expect(result.stdout).toBe('     1     2     9 todo.txt\n');
		expect(result.status).toBe(1);
	});

	test('prints a usage message on stderr and exits with 2 when given no files', () => {
		const result = run();
		expect(result.stderr).toBe('Usage: node 01-word-count.js <file>...\n');
		expect(result.stdout).toBe('');
		expect(result.status).toBe(2);
	});
});
