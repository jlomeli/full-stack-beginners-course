# 11. Modules, npm, and testing

This is Project 2, and it takes three sessions. You write tests for a small text library that has none, then build an interactive quiz app and a test suite that proves its rules work.

## What you will be able to do

- Split code into ES modules
- Install and run packages with npm
- Write unit tests with Vitest

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-11
```

Run the tests for this lesson:

```sh
npm test 11
```

You see 34 failing tests. Your job this lesson is to make them pass. Here is where they come from:

- 13 tests check the tests you write in session 1 (exercise 1).
- 11 tests check the tests you write for `quiz.js` in session 2.
- 10 tests check the quiz page you build in session 3.

## The plan

| Session | You do |
| --- | --- |
| 1 | Learn modules and npm. Write tests for `01-text-utils.js` (exercise 1). |
| 2 | Write `quiz.js` and the tests for it. |
| 3 | Write `app.js` so the quiz runs in the browser. Add your own questions. Polish. |

## Modules

A module is a file that other files can import from. You have used `import` in every lesson since lesson 06. Now you decide what a file shares.

A file shares a value by adding `export` in front of it:

```js
// math.js
export function double(n) {
	return n * 2;
}

const secret = 42; // not exported: only math.js can see it
```

Another file imports what it needs by name. The path must start with `./` or `../` and must end with `.js`:

```js
// main.js
import { double } from './math.js';

console.log(double(21));
```

Try it. Create `lessons/11-tooling-and-testing/scratch/math.js` and `main.js` with the code above. Run:

```sh
node lessons/11-tooling-and-testing/scratch/main.js
```

You see `42`. Change `main.js` to `import { secret } from './math.js';` and run it again. Node stops with a `SyntaxError` that says `math.js` does not provide an export named `secret`. A module keeps everything private until you export it. Delete the `scratch` folder when you finish.

Why split code into modules? Each file does one job, and you can test one job at a time. This lesson's quiz has two jobs: `quiz.js` holds the rules and `app.js` draws the page. Rules with no page code are simple to test, because a test calls a function and checks what it returns.

Modules in the browser need one extra step. `index.html` loads its code with `<script type="module" src="main.js">`. Browsers refuse to load modules from a file you opened by double-clicking it, so you serve the folder over HTTP. You do that in session 3.

Read more: [MDN on JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## npm

npm installs packages: code other people wrote and published. It came with Node. Your course repo already uses it. Look at the file `package.json` in the repo root. Do not edit it in this lesson.

Open it and find three parts:

- `scripts` holds shortcuts. `npm test 11` runs the `test` script and passes it `11`.
- `devDependencies` lists the packages the project needs while you build it, such as `vitest`. Packages the finished app needs to run go under `dependencies`.
- The `"type"` field tells Node how to read `.js` files. It makes your `import` and `export` work.

When you ran `npm install` in the course setup, npm read `package.json`, downloaded every package into a folder called `node_modules`, and wrote exact versions into `package-lock.json`. Never edit `node_modules`, and never commit it. Git ignores it already.

Practice on a throwaway project outside the repo so you don't change `package.json`:

```sh
mkdir /tmp/npm-practice
cd /tmp/npm-practice
npm init -y
npm pkg set type=module
npm install ms
```

`npm init -y` creates a `package.json`. `npm pkg set type=module` lets the files here use `import`. `npm install ms` downloads the `ms` package. Open `package.json` and find `ms` under `dependencies`. Look at the new `node_modules` folder and the `package-lock.json` file.

Create `index.js` in that folder:

```js
import ms from 'ms';

console.log(ms('2 days'));
console.log(ms(60000));
```

Run `node index.js`. You see `172800000` and then `1m`. You imported code you didn't write, by package name, with no `./` in front.

Add a script. Run `npm pkg set scripts.start="node index.js"`, then `npm start`. You see the same two lines. Scripts give every project one way to run things, so a teammate types `npm test` without learning how your tests work.

When you are done, go back with `cd` to your course repo. You can delete `/tmp/npm-practice`.

You will often see `npx`. It runs a package's command without you installing it first. You use it once in session 3.

Read more: [npm docs on `package.json`](https://docs.npmjs.com/cli/configuring-npm/package-json).

## Writing tests with Vitest

A test is code that checks other code. You run it, and it tells you whether the code still does what you expect. You write a test as a function with a name:

```js
import { expect, test } from 'vitest';
import { double } from './math.js';

test('double turns 4 into 8', () => {
	expect(double(4)).toBe(8);
});
```

`test(name, fn)` registers a test. `expect(value)` wraps the value your code produced, and a matcher such as `.toBe(8)` says what you expect. If the matcher is wrong, the test fails and Vitest prints what it got and what it wanted.

You need a handful of matchers:

```js
expect(2 + 2).toBe(4);                    // same value, compared with ===
expect([1, 2]).toEqual([1, 2]);           // same contents, for arrays and objects
expect(value).toBeNull();                 // exactly null
expect(true).toBe(true);
expect(() => explode()).toThrow();        // the function throws an error
expect(() => explode()).toThrow('boom');  // and the message contains "boom"
```

Use `toBe` for numbers, strings, and booleans. Use `toEqual` for arrays and objects: `[1, 2] === [1, 2]` is `false`, because they are two different arrays, but `toEqual` compares what's inside. To test that a function throws, pass `expect` a function that calls it. If you called it yourself, the error would escape before `expect` could see it.

Group related tests with `describe`:

```js
import { describe, expect, test } from 'vitest';

describe('double', () => {
	test('doubles a positive number', () => {
		expect(double(4)).toBe(8);
	});

	test('doubles zero to zero', () => {
		expect(double(0)).toBe(0);
	});
});
```

### What makes a good test

Name each test as a sentence about behavior: `'slugify removes dashes from the start'`. When it fails, the name tells you what's broken.

Check one idea per test. A test with five unrelated `expect` lines hides which one failed.

Test behavior, not code. Call the function and check what it returns. Don't test how it works inside.

Test the edges. A function that works for `3` can break for `0`, for an empty array, or for a value exactly at a limit. Bugs live at the edges: empty input, one item, the boundary, and the "nothing to do" case.

To prove a test is worth keeping, break the code on purpose and check that the test fails. A test that never fails protects nothing. The next exercise automates that check.

Read more: [the Vitest guide](https://vitest.dev/guide/) and [the `expect` API](https://vitest.dev/api/expect.html).

## Exercise 1: write tests for code that has none

Open `exercises/01-text-utils.js`. It holds five working helper functions for a blog: `slugify`, `truncate`, `pluralize`, `formatPrice`, and `chunk`. Each has a comment that is its spec. **Do not change this file.** You write the tests in `exercises/01-text-utils.test.js`.

Start with `slugify`. Read the spec, then write a first test:

```js
describe('slugify', () => {
	test('lowercases the title and joins words with dashes', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});
});
```

Run `npm test 11`. Your test passes. Now look at the tests named `your tests catch the bug: ...`. They are red. They are the interesting part.

### How your tests get checked

The file `exercises/01-text-utils.mutants.test.js` checks your tests, not your code. It makes copies of `01-text-utils.js` with exactly one bug in each. One copy forgets to lowercase. Another treats a title exactly at the limit as too long. Another drops the last chunk. Each broken copy is a mutant. It then runs your test file against the real module and against every mutant.

You pass when:

1. All your tests pass against the real module.
2. Every mutant fails at least one of your tests.

Each line in the output names one bug. When a line says `your tests catch the bug: truncate cuts text that is exactly maxLength long` and it is red, no test of yours fails when that bug exists. Read the name, think about what input would show the bug, and write a test for it. In this case you need a text whose length is exactly `maxLength`.

Work through the list, one red line at a time. The bug names tell you what to test. Use the spec comments to work out the expected value by hand, and don't copy the function's output into the test, or you check nothing. Do not edit the mutants file. It is not a puzzle to bypass: a passing run only means something if your tests are real.

You're done with exercise 1 when all 13 tests for it are green.

## The project: a quiz app

You build a quiz that shows one multiple-choice question at a time and gives the player a score at the end. Open `project/` and look at the files:

| File | Who writes it | What it does |
| --- | --- | --- |
| `quiz.js` | You | The rules. No page code. |
| `quiz.test.js` | You | Your tests for `quiz.js`. |
| `quiz.mutants.test.js` | Given | Checks your tests against buggy versions of your `quiz.js`. |
| `app.js` | You | Draws the page and handles clicks, using `quiz.js`. |
| `app.test.js` | Given | The exact spec for the page. |
| `questions.js` | You | Your questions. Five samples come with it. |
| `index.html`, `main.js`, `style.css` | Given | Load the app in a browser. Restyle as you like. |

### Session 2: quiz.js, test first

`quiz.js` has six functions, and you design the quiz object that flows between them. Read the comments in the file: a quiz is "a plain object, and you decide what goes in it". Keep it as small as possible. Everything else, such as the current question and the score, can be worked out from it.

Two rules trip people up:

- **Never change the quiz you were given.** `answer(quiz, 2)` returns a new quiz and leaves `quiz` as it was. Spread syntax copies an object or array: `{ ...quiz, answers: [...quiz.answers, 2] }`. You used it in lesson 07.
- **Fail loudly.** Calling `answer` on a finished quiz throws an `Error` instead of quietly doing nothing.

Work in short loops:

1. Pick one function. Write one test for it in `quiz.test.js`. Run `npm test 11`. It fails, because `quiz.js` is empty.
2. Write the least code in `quiz.js` that passes it.
3. Add a test for an edge case, then make it pass.

Start with `createQuiz` and `currentQuestion`. A test needs a small set of questions. Define it at the top of `quiz.test.js` and reuse it:

```js
const questions = [
	{ prompt: 'Capital of France?', choices: ['Berlin', 'Paris'], answer: 1 },
	{ prompt: 'Closest planet to the sun?', choices: ['Mercury', 'Venus'], answer: 0 },
];

test('currentQuestion starts on the first question', () => {
	const quiz = createQuiz(questions);
	expect(currentQuestion(quiz)).toEqual(questions[0]);
});
```

Test the quiz only through its functions: call `answer`, then check `currentQuestion`, `score`, and `progress`. Never read a field like `quiz.answers` in a test. If you do, a correct quiz that stores its data another way fails your test, and the mutants file builds its bugs around the functions, not around your data layout.

The mutants for the project work as in exercise 1. They wrap the functions of your `quiz.js` with one bug each, such as an `answer` that changes the quiz you passed in. Read each red line and write the test that catches it. Think about what a player would notice: answering twice, a score that counts wrong answers, a finished quiz that keeps going.

You're done with session 2 when the 11 `quiz.mutants.test.js` tests pass.

### Session 3: the page

Open `app.test.js` and read it. It describes the page the way a player sees it: a heading, buttons, and messages. The comment at the top of `app.js` lists the same behavior in words.

You write `startQuiz(root, questions)`. It keeps the current quiz in a variable and has a `render` function that rebuilds the contents of `root` from that quiz. Each click replaces the quiz with a new one, then calls `render` again. You built the same loop with the DOM in lesson 09:

```js
export function startQuiz(root, questions) {
	let quiz = createQuiz(questions);

	function render() {
		root.replaceChildren(); // clear the page, then add elements
		// ...
	}

	render();
}
```

Build the page in small steps, and run `npm test 11` after each one:

1. Show "Question 1 of 5" and the prompt as an `<h2>`.
2. Show a `<button>` for each choice.
3. On a click, answer the quiz and show "Correct!" or "Wrong. The answer is ...". Disable every choice button.
4. Show the "Next" button.
5. After the last question, show "You scored 3 out of 5." and a "Play again" button.

Use the functions from `quiz.js` for every decision. `app.js` shouldn't compute the score itself. Use `textContent` to put text on the page, not `innerHTML`. The prompt could contain `<` characters, and `textContent` shows them as text.

Debug by reading the failure message. `app.test.js` finds elements by role and name, as a screen reader would, so a missing button or a wrong sentence shows up in the error.

### Try it in the browser

When `app.test.js` passes, run the page. Install nothing. `npx` fetches a tiny static file server and runs it. It asks "Ok to proceed?" the first time:

```sh
npx serve lessons/11-tooling-and-testing/project
```

Open the address it prints, usually <http://localhost:3000>. You see your first question. Answer every question and check the score. Press Play again and take the quiz again. If you see a blank page, open DevTools (F12) and read the Console.

Then make it yours:

- Replace the sample questions in `questions.js` with at least eight of your own, about a topic you know well. Keep the same shape: `prompt`, `choices`, and `answer`.
- Edit `style.css`. Style the buttons, the correct and wrong messages, and the result.
- Run `npm test 11` again. Your tests still pass, because `app.test.js` and your tests use their own questions.

### Rubric

The tests cover most of the grade. Your reviewer checks the rest:

| Area | A good submission |
| --- | --- |
| Tests (`quiz.test.js`) | Each test has a sentence for a name, checks one idea, and covers edge cases. Tests use only the exported functions. |
| `quiz.js` | The rules are small, readable, and change nothing they are given. No page code. |
| `app.js` | One `render` function drives the page. All decisions go through `quiz.js`. Text goes in with `textContent`. |
| Questions and styling | At least eight real questions with correct answers. The page is readable and the correct and wrong messages look different. |
| Git | Small commits with messages that say what changed. |

## Exercises

1. `exercises/01-text-utils.test.js` holds your tests for the untested utility module. `01-text-utils.js` is the code under test and stays unchanged. The mutants file checks your tests.
2. Project 2, the quiz app. In `project/`: `quiz.js`, `quiz.test.js`, `app.js`, and `questions.js`. `app.test.js` and `quiz.mutants.test.js` check your work.

Run `npm test 11` after each change.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Show a progress bar from `progress(quiz)`.
- Shuffle the questions each time the player starts. Write a test for your shuffle first. Pass the random function in as an argument so the test can control it.
- Save the best score in `localStorage` and show it on the results screen.
- Add a `timeLimit` to each question and count a timeout as a wrong answer.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/11-tooling-and-testing
git commit -m "Complete lesson 11 exercises"
git push -u origin lesson-11
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Test names read as sentences, and each test checks one idea
- Tests use expected values worked out from the spec, not copied from the code's output
- `quiz.js` never changes the quiz it receives, and has no DOM code
- `app.js` leaves the rules to `quiz.js` and puts text on the page with `textContent`
- At least eight original questions, and a page that is pleasant to use
