import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { csvToObjects, parseRows } from './02-csv-to-json.js';

const script = fileURLToPath(new URL('./02-csv-to-json.js', import.meta.url));

describe('parseRows', () => {
	test('splits rows on line breaks and fields on commas', () => {
		expect(parseRows('a,b\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
	});
	test('handles Windows line endings', () => {
		expect(parseRows('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
	});
	test('does not add an empty row for the final line break', () => {
		expect(parseRows('a\n1\n')).toHaveLength(2);
		expect(parseRows('a\n1')).toHaveLength(2);
	});
	test('keeps empty fields', () => {
		expect(parseRows('a,b,c\n1,,3\n')).toEqual([['a', 'b', 'c'], ['1', '', '3']]);
	});
	test('a quoted field can contain the delimiter', () => {
		expect(parseRows('title,author\n"Dune, Part One",Herbert\n')).toEqual([['title', 'author'], ['Dune, Part One', 'Herbert']]);
	});
	test('a quoted field can contain a line break', () => {
		expect(parseRows('note\n"line one\nline two"\n')).toEqual([['note'], ['line one\nline two']]);
	});
	test('a doubled quote inside a quoted field is one quote', () => {
		expect(parseRows('say\n"He said ""hi"""\n')).toEqual([['say'], ['He said "hi"']]);
	});
	test('uses the delimiter you pass in', () => {
		expect(parseRows('a;b\n1;"x;y"\n', ';')).toEqual([['a', 'b'], ['1', 'x;y']]);
	});
	test('empty text has no rows', () => {
		expect(parseRows('')).toEqual([]);
	});
});

describe('csvToObjects', () => {
	test('uses the first row as keys', () => {
		expect(csvToObjects('title,year\nDune,1965\nEmma,1815\n')).toEqual([
			{ title: 'Dune', year: '1965' },
			{ title: 'Emma', year: '1815' },
		]);
	});
	test('a file with only a header gives no objects', () => {
		expect(csvToObjects('title,year\n')).toEqual([]);
	});
	test('an empty file gives no objects', () => {
		expect(csvToObjects('')).toEqual([]);
	});
	test('passes the delimiter through', () => {
		expect(csvToObjects('a;b\n1;2\n', ';')).toEqual([{ a: '1', b: '2' }]);
	});
	test('names the row when it has the wrong number of fields', () => {
		expect(() => csvToObjects('a,b,c\n1,2,3\n4,5\n')).toThrow('Row 3 has 2 fields but the header has 3');
	});
});

describe('the command', () => {
	let dir;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'csv-to-json-'));
		writeFileSync(join(dir, 'books.csv'), 'title,author\nDune,Herbert\n"Emma, annotated",Austen\n');
		writeFileSync(join(dir, 'semi.csv'), 'title;author\nDune;Herbert\n');
		writeFileSync(join(dir, 'bad.csv'), 'a,b\n1,2\n3\n');
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	const run = (args, env = {}) =>
		spawnSync(process.execPath, [script, ...args], {
			cwd: dir,
			encoding: 'utf8',
			env: { ...process.env, CSV_DELIMITER: undefined, ...env },
		});

	const books = [
		{ title: 'Dune', author: 'Herbert' },
		{ title: 'Emma, annotated', author: 'Austen' },
	];

	test('prints the JSON, indented by 2 spaces and ending in a newline', () => {
		const result = run(['books.csv']);
		expect(result.stdout).toBe(JSON.stringify(books, null, 2) + '\n');
		expect(result.status).toBe(0);
	});

	test('writes the JSON to the output file and prints nothing', () => {
		const result = run(['books.csv', 'out.json']);
		expect(result.stdout).toBe('');
		expect(result.status).toBe(0);
		expect(readFileSync(join(dir, 'out.json'), 'utf8')).toBe(JSON.stringify(books, null, 2) + '\n');
	});

	test('reads the delimiter from the CSV_DELIMITER environment variable', () => {
		const result = run(['semi.csv'], { CSV_DELIMITER: ';' });
		expect(JSON.parse(result.stdout)).toEqual([{ title: 'Dune', author: 'Herbert' }]);
	});

	test('uses a comma when CSV_DELIMITER is not set', () => {
		const result = run(['semi.csv']);
		expect(JSON.parse(result.stdout)).toEqual([{ 'title;author': 'Dune;Herbert' }]);
	});

	test('a missing file prints an error on stderr, exits with 1, and writes nothing', () => {
		const result = run(['nope.csv', 'out.json']);
		expect(result.stderr).toBe('csv-to-json: cannot read nope.csv\n');
		expect(result.stdout).toBe('');
		expect(result.status).toBe(1);
		expect(existsSync(join(dir, 'out.json'))).toBe(false);
	});

	test('a bad row prints the parse error on stderr, exits with 1, and writes nothing', () => {
		const result = run(['bad.csv', 'out.json']);
		expect(result.stderr).toBe('csv-to-json: Row 3 has 1 fields but the header has 2\n');
		expect(result.status).toBe(1);
		expect(existsSync(join(dir, 'out.json'))).toBe(false);
	});

	test('no arguments prints the usage on stderr and exits with 1', () => {
		const result = run([]);
		expect(result.stderr).toBe('csv-to-json: usage: node 02-csv-to-json.js <input.csv> [output.json]\n');
		expect(result.status).toBe(1);
	});
});
