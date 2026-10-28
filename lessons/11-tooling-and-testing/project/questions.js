// Add your own questions. `answer` is the index of the correct choice, counting from 0.
export const questions = [
	{
		prompt: 'Which HTML element holds the main heading of a page?',
		choices: ['<head>', '<h1>', '<header>', '<title>'],
		answer: 1,
	},
	{
		prompt: 'Which CSS property makes an element a flex container?',
		choices: ['display', 'position', 'flex-wrap'],
		answer: 0,
	},
	{
		prompt: 'What does `[1, 2, 3].map((n) => n * 2)` return?',
		choices: ['[1, 2, 3]', '6', '[2, 4, 6]', 'undefined'],
		answer: 2,
	},
	{
		prompt: 'Which keyword waits for a promise inside an async function?',
		choices: ['then', 'await', 'yield'],
		answer: 1,
	},
	{
		prompt: 'What does `npm install` read to know which packages to install?',
		choices: ['README.md', 'node_modules', 'package.json'],
		answer: 2,
	},
];
