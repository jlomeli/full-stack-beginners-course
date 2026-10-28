// Checks the tests YOU write in quiz.test.js.
// It runs your test file against your quiz.js and against copies of it with one bug added.
// Each bug wraps one of your functions, so it works however you wrote quiz.js.
// Your tests must pass against your quiz.js and catch every bug. Don't change this file.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { runTestFileAgainst } from '../mutation-check.js';

const folder = fileURLToPath(new URL('.', import.meta.url));
const yourQuiz = readFileSync(new URL('./quiz.js', import.meta.url), 'utf8');

const bugs = [
	{
		bug: 'createQuiz keeps only the first question',
		code: 'export function createQuiz(questions) { return real.createQuiz(questions.slice(0, 1)); }',
	},
	{
		bug: 'answer records the choice after the one the player picked',
		code: 'export function answer(quiz, choiceIndex) { return real.answer(quiz, choiceIndex + 1); }',
	},
	{
		bug: 'answer stays on the same question',
		code: 'export function answer(quiz, choiceIndex) { return real.isFinished(quiz) ? real.answer(quiz, choiceIndex) : quiz; }',
	},
	{
		bug: 'answer changes the quiz you pass in',
		code: 'export function answer(quiz, choiceIndex) { const next = real.answer(quiz, choiceIndex); Object.assign(quiz, next); return next; }',
	},
	{
		bug: 'answer does not throw after the last question',
		code: 'export function answer(quiz, choiceIndex) { return real.isFinished(quiz) ? quiz : real.answer(quiz, choiceIndex); }',
	},
	{
		bug: 'isFinished is never true',
		code: 'export function isFinished(quiz) { return false; }',
	},
	{
		bug: 'isFinished is true one question early',
		code: 'export function isFinished(quiz) { return real.isFinished(quiz) || real.isFinished(real.answer(quiz, 0)); }',
	},
	{
		bug: 'score is one too high',
		code: 'export function score(quiz) { return real.score(quiz) + 1; }',
	},
	{
		bug: 'score counts every answer as correct',
		code: 'export function score(quiz) { return real.progress(quiz).answered; }',
	},
	{
		bug: 'progress counts one more answer than the player gave',
		code: 'export function progress(quiz) { const { answered, total } = real.progress(quiz); return { answered: answered + 1, total }; }',
	},
].map((entry, index) => ({ ...entry, version: `bug-${index + 1}` }));

let results;

beforeAll(() => {
	const versions = { original: {} };
	for (const { version, code } of bugs) {
		versions[version] = {
			'quiz.real.js': yourQuiz,
			'quiz.js': `import * as real from './quiz.real.js';\nexport * from './quiz.real.js';\n${code}\n`,
		};
	}
	results = runTestFileAgainst({ folder, testFile: 'quiz.test.js', versions });
}, 120_000);

const yourTestsPass = () => results.original.total > 0 && results.original.failed === 0;

test('your quiz.test.js has tests and they all pass against your quiz.js', () => {
	expect(results.original.total, 'Write some tests in quiz.test.js').toBeGreaterThan(0);
	expect(results.original.failed, 'Some of your tests fail against your quiz.js. Fix quiz.js or the test.').toBe(0);
});

test.each(bugs)('your tests catch the bug: $bug', ({ version }) => {
	expect(yourTestsPass(), 'Make your tests pass against your quiz.js first').toBe(true);
	expect(results[version].failed, 'All your tests still pass with this bug in quiz.js. Add a test that fails because of it.').toBeGreaterThan(0);
});
