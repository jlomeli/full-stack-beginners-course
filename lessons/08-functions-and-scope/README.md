# 08. Functions, scope, and closures

In this lesson you write four tools that real codebases use every day: `once`, `memoize`, `debounce`, and a counter factory. Each one is a function that builds and returns another function. Tests check each one, so you know when you're done.

## What you will be able to do

- Predict what a variable refers to in nested scopes
- Write higher-order functions
- Use closures to keep private state

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-08
```

Run the tests for this lesson:

```sh
npm test 08
```

You see 25 failing tests. Your job this lesson is to make them pass.

## Write functions three ways

You've seen all three of these. They do the same thing:

```js
function add(a, b) {
	return a + b;
}

const addExpression = function (a, b) {
	return a + b;
};

const addArrow = (a, b) => a + b;
```

Use a declaration (the first) for named, top-level functions. Use an arrow for short functions you pass to other functions, like the callbacks you gave to `map` in lesson 07.

### Give parameters default values

A parameter without an argument is `undefined`. A default value replaces it:

```js
function greet(name = 'friend') {
	return `Hello, ${name}!`;
}

greet('Ada');   // 'Hello, Ada!'
greet();        // 'Hello, friend!'
```

The backtick string is a template literal. `${...}` puts a value inside it.

When a function takes several options, pass one object and destructure it in the parameter list. Each key can have its own default:

```js
function formatName({ first, last, shout = false } = {}) {
	const full = `${first} ${last}`;
	return shout ? full.toUpperCase() : full;
}

formatName({ first: 'Ada', last: 'Lovelace' });                // 'Ada Lovelace'
formatName({ first: 'Ada', last: 'Lovelace', shout: true });   // 'ADA LOVELACE'
```

The `= {}` at the end lets someone call `formatName()` with no argument at all. Without it, JavaScript tries to destructure `undefined` and throws an error. The counter exercise needs this pattern.

### Accept any number of arguments

A rest parameter, `...args`, collects every argument into an array. Spread, `...args`, does the reverse when you call a function. It spreads an array back out into separate arguments:

```js
function countArgs(...args) {
	return args.length;
}
countArgs(1, 2, 3);   // 3

const numbers = [4, 9, 2];
Math.max(...numbers);   // 9, the same as Math.max(4, 9, 2)
```

The two together pass every argument through to another function, however many there are.

## Pass and return functions

A function is a value, like a number or an array. You can store it in a variable, pass it to another function, and return it from a function.

A function that takes a function or returns one is called a higher-order function. `map`, `filter`, and `reduce` are higher-order functions. You pass them a function, and they decide when to call it.

You can write your own. This one takes a function and returns a new function that logs each call before doing the real work:

```js
function logged(fn) {
	return (...args) => {
		console.log('called with', args);
		return fn(...args);
	};
}

const loggedAdd = logged(add);
loggedAdd(2, 3);
// called with [ 2, 3 ]
// 5
```

`logged` doesn't call `add`. It returns a new function that calls `add` later, whenever someone calls `loggedAdd`. A function like this is called a wrapper. Every function in the first exercise is a wrapper with this shape.

Try it. Run `node` and paste `add` and `logged`. Then wrap `Math.max` with `logged` and call the result with `7, 3, 12`. You should see the log line, then `12`.

## Predict what a name refers to

Scope is the part of your code where a name is visible. A function creates a scope. So does every block in curly braces, for names declared with `let` or `const`.

Three rules decide what a name refers to:

1. Code inside a scope can see names from the scopes around it.
2. Code outside a scope can't see names declared inside it.
3. JavaScript looks for a name in the closest scope first, then works outward. A name declared in an inner scope hides, or shadows, the same name outside.

Predict what each line gives before you run it. Then paste the code into `node` to check. The answer is under each example.

```js
const color = 'red';
function paint() {
	const color = 'blue';
	return color;
}
paint();   // ?
color;     // ?
```

<details>
<summary>Answer</summary>

`paint()` gives `'blue'`, and `color` gives `'red'`. The `color` inside `paint` shadows the outer one. They are two different variables, so assigning one doesn't touch the other.

</details>

```js
let total = 0;
function addToTotal(n) {
	total = total + n;
}
addToTotal(5);
addToTotal(5);
total;   // ?
```

<details>
<summary>Answer</summary>

`10`. `addToTotal` has no `total` of its own, so it finds the outer one and changes it.

</details>

```js
function makeSecret() {
	const secret = 'hidden';
	return secret.length;
}
makeSecret();   // ?
secret;         // ?
```

<details>
<summary>Answer</summary>

`makeSecret()` gives `6`. `secret` throws `ReferenceError: secret is not defined`. The variable lives inside the function, so code outside can't see it.

</details>

```js
const place = 'outside';
function whereAmI() {
	return place;
}
function visit() {
	const place = 'inside visit';
	return whereAmI();
}
visit();   // ?
```

<details>
<summary>Answer</summary>

`'outside'`. A function looks up names where it's **written**, not where it's called. `whereAmI` is written at the top level, so it sees the top-level `place`. The `place` inside `visit` is invisible to it.

</details>

```js
for (let i = 0; i < 3; i++) {}
i;   // ?
```

<details>
<summary>Answer</summary>

`ReferenceError: i is not defined`. `let` belongs to the loop's block, so `i` doesn't exist after the loop ends.

</details>

You may see `var` in older code. It ignores blocks and follows different rules. Use `const` and `let`.

## Keep private state with closures

Put the last two ideas together. A function can return another function, and a function sees the variables around the place it was written. So the returned function keeps access to its parent's variables, even after the parent has returned:

```js
function createIdMaker(prefix) {
	let next = 1;
	return () => {
		const id = `${prefix}-${next}`;
		next = next + 1;
		return id;
	};
}

const userId = createIdMaker('user');
userId();   // 'user-1'
userId();   // 'user-2'
```

The returned function plus the variables it holds on to is called a closure. `createIdMaker` finished running after its first call, but `next` lives on, because the returned function still uses it.

Two facts make closures useful:

- **Every call makes new variables.** Call `createIdMaker('order')` and you get a second function with its own `next`, starting at 1. The two never interfere.
- **Nothing else can reach them.** No code outside can read or change `next`. The only way in is through the function you returned. The variable is private.

Try it. Paste `createIdMaker` into `node`. Make `userId` and `orderId`. Call `userId()` twice and `orderId()` once. `orderId()` gives `'order-1'`.

To share private state between several functions, return an object of functions. Each function in the object closes over the same variables:

```js
function createGuestList() {
	const names = [];
	return {
		add: (name) => {
			names.push(name);
			return names.length;
		},
		count: () => names.length,
	};
}

const party = createGuestList();
party.add('Ada');
party.add('Grace');
party.count();   // 2
party.names;     // undefined: the array is private
```

This is the shape of the counter exercise. Because `add` and `count` use `names` directly, and not `this.names`, they keep working when you take them off the object: `const { count } = party; count()` still gives `2`.

## Two tools you need for the exercises

### Map remembers values by key

A `Map` stores values under keys, like an object, but any value can be a key, and it has clear methods:

```js
const cache = new Map();
cache.set(4, 16);
cache.has(4);   // true
cache.get(4);   // 16
cache.has(5);   // false
cache.get(5);   // undefined
```

Use `has` to ask whether a key is stored. Don't use the value as the test, as in `if (cache.get(key))`. The values `false`, `0`, `''`, `null`, `undefined`, and `NaN` count as false in an `if`. They are called falsy. A cached result of `0` is still a cached result. The `once` and `memoize` tests check for this.

### setTimeout runs code later

`setTimeout(fn, ms)` calls `fn` after `ms` milliseconds. It returns an id. Pass the id to `clearTimeout` to cancel the call before it happens:

```js
const timerId = setTimeout(() => console.log('too late'), 2000);
clearTimeout(timerId);
// nothing is logged
```

Try it. Run the first line by itself in `node` and wait two seconds. Then run both lines together. The message doesn't appear.

`debounce` uses these two together. Think of a search box that searches as you type. Searching on every keystroke wastes work, so the app waits until typing pauses. Each keystroke cancels the waiting timer and starts a new one. Only the last timer gets to finish.

### How the tests watch your functions

The tests use two Vitest helpers you haven't seen yet:

- `vi.fn(...)` makes a function that records every call. `expect(fn).toHaveBeenCalledTimes(1)` checks how many times your code called it.
- `vi.useFakeTimers()` replaces the real clock. `vi.advanceTimersByTime(100)` moves time forward 100 milliseconds instantly, so the `debounce` tests don't wait.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-function-tools.js` has three wrappers:
   - `once` lets a function run only the first time.
   - `memoize` remembers a function's results so it never computes the same one twice.
   - `debounce` waits for calls to stop before running a function.
2. `02-counter.js` builds counters that keep their count private.

Run `npm test 08` after each change. When every test passes, you're ready to submit.

Start each wrapper by deciding what it has to remember between calls. That's the variable you declare before the `return`.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Write `throttle(fn, wait)`. It runs `fn` at most once every `wait` milliseconds. How is that different from `debounce`?
- Make `memoize` work for functions with more than one argument. What could you use as the cache key?
- What does your `once` do if `fn` throws an error the first time? Is that what you want?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/08-functions-and-scope
git commit -m "Complete lesson 08 exercises"
git push -u origin lesson-08
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- State lives inside the function that owns it, never in a variable at the top of the file
- Wrappers pass every argument through with `...args`, not a fixed number of parameters
- The counter uses closures, not `this`
- `let` only for variables a closure reassigns, `const` for everything else
- No leftover `console.log` calls
