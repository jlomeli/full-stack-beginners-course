# 06. JavaScript basics

In this lesson you write three small programs: a temperature converter, FizzBuzz, and a password strength checker. Tests check each one, so you know when you're done.

## What you will be able to do

- Use values, variables, and operators
- Control flow with conditionals and loops
- Write and call functions that return values

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-06
```

Run the tests for this lesson:

```sh
npm test 06
```

You see 21 failing tests. Your job this lesson is to make them pass.

## Values and variables

A value is a piece of data. JavaScript has a few kinds you use every day:

```js
42          // number
3.14        // number (JavaScript has one number type for whole numbers and decimals)
'hello'     // string
true        // boolean
undefined   // "no value yet"
```

A variable is a name for a value. Use `const` when the name always points at the same value, and `let` when you reassign it:

```js
const name = 'Ada';
let count = 0;
count = count + 1;
```

Default to `const`. Reach for `let` only when you need to reassign.

Try it. Open a terminal, type `node`, and press Enter. Type each line above and press Enter. Type `count` to see its value. Press Ctrl+D to leave.

## Operators

```js
7 + 2     // 9
7 - 2     // 5
7 * 2     // 14
7 / 2     // 3.5
7 % 2     // 1  (the remainder after dividing)
'Hi ' + 'there'   // 'Hi there'
```

`%` is the one that's new to most people. `n % 3 === 0` is true when `n` divides evenly by 3. You need this for FizzBuzz.

Compare values with `===` and `!==`. They return a boolean:

```js
5 === 5      // true
5 === '5'    // false: a number is not a string
5 !== 6      // true
5 > 3        // true
```

Use `===`, not `==`. The double-equals version converts types before comparing, and its rules surprise everyone.

Combine booleans with `&&` (and), `||` (or), and `!` (not):

```js
const age = 20;
age >= 18 && age < 65   // true
```

## Functions

A function is a named recipe. It takes inputs (parameters) and gives back an output with `return`:

```js
function double(n) {
	return n * 2;
}

double(4);   // 8
```

A function without `return` gives back `undefined`. That's why every test fails right now. The starter functions don't return anything yet.

## Conditionals

`if` runs code only when a condition is true:

```js
function describe(temperature) {
	if (temperature > 30) {
		return 'hot';
	} else if (temperature > 15) {
		return 'warm';
	} else {
		return 'cold';
	}
}
```

JavaScript checks each condition from top to bottom and runs the first branch that matches. Order matters. In FizzBuzz, think about which check has to come first.

## Loops

A `for` loop repeats code a set number of times:

```js
for (let i = 1; i <= 3; i++) {
	console.log(i);
}
// 1
// 2
// 3
```

To build up an array, start with an empty one and `push` onto it:

```js
const squares = [];
for (let i = 1; i <= 3; i++) {
	squares.push(i * i);
}
squares;   // [1, 4, 9]
```

To look at each character of a string, use `for...of`:

```js
for (const char of 'abc') {
	console.log(char);
}
```

To test what kind of character you have, a regular expression is the shortest way:

```js
/[a-z]/.test('q')   // true: a lowercase letter
/[A-Z]/.test('q')   // false
/[0-9]/.test('7')   // true: a digit
```

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-temperature.js` converts between Celsius and Fahrenheit.
2. `02-fizzbuzz.js` plays FizzBuzz for one number and for a range.
3. `03-password-strength.js` rates a password as `weak`, `medium`, or `strong`.

Run `npm test 06` after each change. When every test passes, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Make `celsiusToFahrenheit` round to one decimal place. What breaks?
- Write `fizzbuzzUpTo` without a `for` loop.
- What password does your checker rate `strong` that you would never use? What rule would catch it?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/06-js-basics
git commit -m "Complete lesson 06 exercises"
git push -u origin lesson-06
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Names that say what a value is (`fahrenheit`, not `x`)
- `const` by default, `let` only where you reassign
- `===` everywhere, never `==`
- No leftover `console.log` calls
