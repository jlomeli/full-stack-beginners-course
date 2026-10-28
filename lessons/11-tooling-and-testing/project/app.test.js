// @vitest-environment jsdom
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { startQuiz } from './app.js';

const questions = [
	{ prompt: 'What is the capital of France?', choices: ['Berlin', 'Paris', 'Rome'], answer: 1 },
	{ prompt: 'Which planet is closest to the sun?', choices: ['Mercury', 'Venus'], answer: 0 },
	{ prompt: 'How many legs does a spider have?', choices: ['6', '8', '10'], answer: 1 },
];

let page;
let user;

beforeEach(() => {
	document.body.innerHTML = '<main id="app"></main>';
	startQuiz(document.querySelector('#app'), questions);
	page = within(document.querySelector('#app'));
	user = userEvent.setup();
});

const pick = (choice) => user.click(page.getByRole('button', { name: choice }));
const next = () => user.click(page.getByRole('button', { name: 'Next' }));

test('shows the first question as a heading', () => {
	expect(page.getByRole('heading', { name: 'What is the capital of France?' })).toBeTruthy();
});

test('shows one button for each choice of the first question', () => {
	for (const choice of ['Berlin', 'Paris', 'Rome']) {
		expect(page.getByRole('button', { name: choice })).toBeTruthy();
	}
	expect(page.queryByRole('button', { name: 'Mercury' })).toBeNull();
});

test('shows "Question 1 of 3" at the start', () => {
	expect(page.getByText('Question 1 of 3')).toBeTruthy();
});

test('shows the choices but no Next button before the player answers', () => {
	expect(page.getByRole('button', { name: 'Paris' }).disabled).toBe(false);
	expect(page.queryByRole('button', { name: 'Next' })).toBeNull();
});

test('picking the right choice says "Correct!"', async () => {
	await pick('Paris');
	expect(page.getByText('Correct!')).toBeTruthy();
});

test('picking a wrong choice names the right answer', async () => {
	await pick('Rome');
	expect(page.getByText('Wrong. The answer is Paris.')).toBeTruthy();
	expect(page.queryByText('Correct!')).toBeNull();
});

test('after picking, every choice is disabled so the player cannot answer twice', async () => {
	await pick('Berlin');
	for (const choice of ['Berlin', 'Paris', 'Rome']) {
		expect(page.getByRole('button', { name: choice }).disabled).toBe(true);
	}
});

test('Next shows the second question as "Question 2 of 3"', async () => {
	await pick('Paris');
	await next();
	expect(page.getByRole('heading', { name: 'Which planet is closest to the sun?' })).toBeTruthy();
	expect(page.getByText('Question 2 of 3')).toBeTruthy();
	expect(page.getByRole('button', { name: 'Mercury' }).disabled).toBe(false);
	expect(page.queryByText('Correct!')).toBeNull();
});

test('after the last question it shows the final score', async () => {
	await pick('Paris');
	await next();
	await pick('Venus');
	await next();
	await pick('8');
	await next();
	expect(page.getByText('You scored 2 out of 3.')).toBeTruthy();
	expect(page.queryByRole('button', { name: 'Next' })).toBeNull();
});

test('Play again starts over from question 1 with a score of 0', async () => {
	for (const choice of ['Berlin', 'Venus', '6']) {
		await pick(choice);
		await next();
	}
	expect(page.getByText('You scored 0 out of 3.')).toBeTruthy();

	await user.click(page.getByRole('button', { name: 'Play again' }));
	expect(page.getByText('Question 1 of 3')).toBeTruthy();

	for (const choice of ['Paris', 'Mercury', '8']) {
		await pick(choice);
		await next();
	}
	expect(page.getByText('You scored 3 out of 3.')).toBeTruthy();
});
