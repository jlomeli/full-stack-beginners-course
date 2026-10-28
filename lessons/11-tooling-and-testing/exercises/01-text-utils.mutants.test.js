// Checks the tests YOU write in 01-text-utils.test.js.
// It runs your test file against the real 01-text-utils.js and against copies with one bug each.
// Your tests must pass against the real module and catch every bug. Don't change this file.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { replaceOnce, runTestFileAgainst } from '../mutation-check.js';

const folder = fileURLToPath(new URL('.', import.meta.url));
const original = readFileSync(new URL('./01-text-utils.js', import.meta.url), 'utf8');

const bugs = [
	{ bug: 'slugify keeps capital letters', find: '\t\t.toLowerCase()\n', replace: '' },
	{ bug: 'slugify turns every symbol into its own dash', find: '/[^a-z0-9]+/g', replace: '/[^a-z0-9]/g' },
	{ bug: 'slugify leaves a dash at the start', find: '/^-+|-+$/g', replace: '/-+$/g' },
	{ bug: 'slugify leaves a dash at the end', find: '/^-+|-+$/g', replace: '/^-+/g' },
	{ bug: 'truncate cuts text that is exactly maxLength long', find: 'text.length <= maxLength', replace: 'text.length < maxLength' },
	{ bug: 'truncate returns text longer than maxLength', find: 'maxLength - 3', replace: 'maxLength' },
	{ bug: 'pluralize uses the singular for 0', find: 'count === 1', replace: 'count <= 1' },
	{ bug: 'pluralize ignores the plural you pass in', find: '? singular : plural', replace: "? singular : singular + 's'" },
	{ bug: 'formatPrice drops the trailing zero, like $12.5', find: '(cents / 100).toFixed(2)', replace: 'cents / 100' },
	{
		bug: 'formatPrice shows 5 cents as $0.5',
		find: '(cents / 100).toFixed(2)',
		replace: "Math.floor(cents / 100) + '.' + String(cents % 100).padEnd(2, '0')",
	},
	{ bug: 'chunk drops the last, shorter chunk', find: 'start < items.length', replace: 'start + size <= items.length' },
	{ bug: 'chunk puts one item too few in each chunk', find: 'start + size)', replace: 'start + size - 1)' },
].map((entry, index) => ({ ...entry, version: `bug-${index + 1}` }));

let results;

beforeAll(() => {
	const versions = { original: {} };
	for (const { version, find, replace } of bugs) {
		versions[version] = { '01-text-utils.js': replaceOnce(original, find, replace) };
	}
	results = runTestFileAgainst({ folder, testFile: '01-text-utils.test.js', versions });
}, 120_000);

const yourTestsPassOnTheRealModule = () => results.original.total > 0 && results.original.failed === 0;

test('your test file has tests and they all pass against the real module', () => {
	expect(results.original.total, 'Write some tests in 01-text-utils.test.js').toBeGreaterThan(0);
	expect(results.original.failed, 'Some of your tests fail against the real module. The module is correct, so fix those tests.').toBe(0);
});

test.each(bugs)('your tests catch the bug: $bug', ({ version }) => {
	expect(yourTestsPassOnTheRealModule(), 'Make your tests pass against the real module first').toBe(true);
	expect(results[version].failed, 'All your tests still pass with this bug in the code. Add a test that fails because of it.').toBeGreaterThan(0);
});
