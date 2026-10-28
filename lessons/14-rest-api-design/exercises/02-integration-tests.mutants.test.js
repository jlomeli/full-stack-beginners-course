// Checks the tests YOU write in 02-integration-tests.test.js.
// It runs your test file against your Notes API and against broken copies of it, one bug in each.
// Your tests must pass against your API and fail against every broken copy. Don't change this file.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { runTestFileAgainst } from '../mutation-check.js';
import { mutants } from './mutants.js';

const folder = fileURLToPath(new URL('.', import.meta.url));
const yourApi = readFileSync(new URL('./01-notes-api.js', import.meta.url), 'utf8');

const bugs = mutants.map(({ bug }, index) => ({ bug, version: `bug-${index + 1}` }));

let results;

beforeAll(() => {
	const versions = { original: {} };
	for (const { bug, version } of bugs) {
		versions[version] = {
			'01-notes-api.real.js': yourApi,
			'01-notes-api.js': [
				"import { createApp as real, createMemoryStore } from './01-notes-api.real.js';",
				"import { createMutantApp } from './mutants.js';",
				'export { createMemoryStore };',
				`export const createApp = (options) => createMutantApp(${JSON.stringify(bug)}, { real, createMemoryStore, options });`,
				'',
			].join('\n'),
		};
	}
	results = runTestFileAgainst({ folder, testFile: '02-integration-tests.test.js', versions });
}, 180_000);

const yourTestsPass = () => results.original.total > 0 && results.original.failed === 0;

test('your 02-integration-tests.test.js has tests and they all pass against your API', () => {
	expect(results.original.total, 'Write some tests in 02-integration-tests.test.js').toBeGreaterThan(0);
	expect(results.original.failed, 'Some of your tests fail against your API. Fix 01-notes-api.js or the test.').toBe(0);
});

test.each(bugs)('your tests catch the bug: $bug', ({ version }) => {
	expect(yourTestsPass(), 'Make your tests pass against your API first').toBe(true);
	expect(results[version].failed, 'All your tests still pass with this bug in the API. Add a test that fails because of it.').toBeGreaterThan(0);
});
