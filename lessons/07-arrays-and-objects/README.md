# 07. Arrays and objects

In this lesson you write code for three kinds of real data: a class gradebook, a shopping cart, and a few months of bank transactions. Tests check each one, so you know when you're done.

## What you will be able to do

- Model data with arrays and objects
- Transform data with map, filter, and reduce
- Copy and compare objects without mutation bugs

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-07
```

Run the tests for this lesson:

```sh
npm test 07
```

You see 35 failing tests. Your job this lesson is to make them pass.

## Arrays hold lists

An array is an ordered list of values. Each value has a position, called its index. The first index is 0:

```js
const scores = [90, 72, 85];
scores[0];         // 90
scores.length;     // 3
scores.push(64);   // adds 64 to the end
scores;            // [90, 72, 85, 64]
```

You looped over arrays with `for...of` in lesson 06. That still works:

```js
let sum = 0;
for (const score of scores) {
	sum = sum + score;
}
sum;   // 311
```

Try it. Run `node`, type the lines above, and check that `sum` is 311.

## Objects hold named values

An object groups values under names. Each name is a key, and the value stored under it is a property:

```js
const student = { name: 'Ada', scores: [90, 85, 95] };
student.name;        // 'Ada'
student.scores[1];   // 85
student.year = 2;    // adds a new property
student.nickname;    // undefined: there's no such key
```

When the key is in a variable, use square brackets:

```js
const key = 'name';
student[key];   // 'Ada'
```

Square brackets let you build an object one key at a time. You need this to group transactions by category. This counts how many of each fruit there are:

```js
const counts = {};
for (const fruit of ['apple', 'pear', 'apple']) {
	if (counts[fruit] === undefined) {
		counts[fruit] = 0;
	}
	counts[fruit] = counts[fruit] + 1;
}
counts;   // { apple: 2, pear: 1 }
```

To loop over an object, turn it into an array first. `Object.keys` gives the keys, `Object.values` gives the values, and `Object.entries` gives `[key, value]` pairs:

```js
Object.keys(counts);      // ['apple', 'pear']
Object.entries(counts);   // [['apple', 2], ['pear', 1]]

for (const [fruit, count] of Object.entries(counts)) {
	console.log(fruit, count);
}
// apple 2
// pear 1
```

`[fruit, count]` unpacks each pair into two variables. This is called destructuring. It works on objects too:

```js
const { name, year } = student;
name;   // 'Ada'
year;   // 2
```

Try it. In `node`, build the `counts` object above for `['red', 'blue', 'red', 'red']`. You should get `{ red: 3, blue: 1 }`.

## Model data as an array of objects

Most data in a real app is a list of things that share a shape. Write it as an array of objects:

```js
const students = [
	{ name: 'Ada', scores: [90, 85, 95] },
	{ name: 'Grace', scores: [70, 95] },
	{ name: 'Alan', scores: [] },
];
```

Every object has the same keys, so code that works on one student works on all of them. Each starter file opens with a comment that shows the shape of its data. Read it first.

Pick shapes that make the math come out right. Money is the classic example. Try this in `node`:

```js
0.1 + 0.2   // 0.30000000000000004
```

JavaScript stores decimals as close approximations, not exact values. Store money as whole cents instead: `75` means $0.75. Adding whole numbers is always exact. The cart and transaction exercises use cents.

## Write short functions with arrows

The array methods in the next section take a function as an argument. An arrow function is a short way to write one:

```js
function double(n) {
	return n * 2;
}

const doubleArrow = (n) => n * 2;   // the same function, written as an arrow
```

With no curly braces, the arrow returns the value after `=>`. With curly braces, you write `return` yourself:

```js
const doubleWithBraces = (n) => {
	return n * 2;
};
```

To return an object without braces, wrap it in parentheses. Otherwise JavaScript reads `{` as the start of the function body:

```js
const describe = (name) => ({ name, passed: true });
describe('Ada');   // { name: 'Ada', passed: true }
```

`{ name }` is shorthand for `{ name: name }`. Lesson 08 covers functions in depth.

## Transform arrays with map, filter, and reduce

These three methods replace most loops that you'd otherwise write by hand. None of them change the array you call them on. Each one returns something new.

### map changes every item

`map` calls your function on each item and collects what it returns into a new array of the same length:

```js
const prices = [100, 250, 75];
prices.map((price) => price * 2);          // [200, 500, 150]
students.map((student) => student.name);   // ['Ada', 'Grace', 'Alan']
```

### filter keeps some items

`filter` keeps the items where your function returns `true`:

```js
prices.filter((price) => price >= 100);   // [100, 250]
```

`find` works like `filter` but returns only the first match, or `undefined` when nothing matches. `some` returns `true` if any item matches:

```js
students.find((student) => student.name === 'Grace');   // { name: 'Grace', scores: [70, 95] }
students.some((student) => student.scores.length === 0); // true
```

### reduce combines items into one value

`reduce` walks the array and carries a running result from item to item. That running result is called the accumulator. You give `reduce` a function and a starting value:

```js
prices.reduce((total, price) => total + price, 0);   // 425
```

Step by step, `total` starts at 0. Then 0 + 100 is 100, 100 + 250 is 350, and 350 + 75 is 425.

The accumulator can be any value, including an object:

```js
const fruitCounts = ['apple', 'pear', 'apple'].reduce((counts, fruit) => {
	counts[fruit] = (counts[fruit] ?? 0) + 1;
	return counts;
}, {});
// { apple: 2, pear: 1 }
```

`a ?? b` gives `b` when `a` is `null` or `undefined`, and `a` otherwise. Changing `counts` inside the function is fine here, because `reduce` created it from the `{}` you passed and nothing else uses it.

Two mistakes catch everyone at least once:

- Forgetting `return` inside curly braces. The next step gets `undefined` as its accumulator.
- Leaving out the starting value. On an empty array, `reduce` then throws an error.

### Chain them

`map` and `filter` return arrays, so you can call another method on the result:

```js
students
	.filter((student) => student.scores.length > 0)
	.map((student) => student.name);
// ['Ada', 'Grace']
```

Try it. In `node`, paste the `students` array, then write one expression that adds up all of Ada's scores. You should get 270.

MDN has the full list of [array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).

## Copy instead of change

This section explains the bug that the shopping cart tests check for. Try it in `node`:

```js
const original = [1, 2, 3];
const copy = original;
copy.push(4);
original;   // [1, 2, 3, 4]
```

`copy = original` doesn't copy the array. A variable holds a reference to an array, like a street address, not the array itself. Both names now point at the same array. Objects work the same way.

This matters when you pass data to a function. If the function changes its argument, the caller's data changes too. Changing a value in place is called mutation. The bug it causes often shows up far from the line that caused it. Every exercise in this lesson leaves its inputs alone and returns new arrays and objects.

Make copies with spread syntax, `...`:

```js
const copied = [...original];           // a new array with the same items
const longer = [...original, 5];        // a new array with one more item
const older = { ...student, year: 3 };  // a new object with year replaced
```

Spread copies one level deep. This is called a shallow copy. Anything nested inside is still shared:

```js
const ada = { name: 'Ada', scores: [90] };
const adaCopy = { ...ada };
adaCopy.scores.push(100);
ada.scores;   // [90, 100]: the original changed
```

To change something nested, copy every level on the way down:

```js
const alan = { name: 'Alan', scores: [60] };
const updatedAlan = { ...alan, scores: [...alan.scores, 100] };
alan.scores;          // [60]
updatedAlan.scores;   // [60, 100]
```

To change one object in an array, `map` the array and replace only the matching object with a changed copy:

```js
const updatedStudents = students.map((student) =>
	student.name === 'Grace' ? { ...student, scores: [...student.scores, 88] } : student,
);
```

`condition ? a : b` is the conditional operator. It gives `a` when the condition is true and `b` when it's false. The other students come through as the same objects, which is fine because nothing changed them.

Watch for code that changes an array in place: `push`, `pop`, `shift`, `splice`, `sort`, and `reverse`. Assigning to a property, like `item.quantity = 2`, changes the object. These return new arrays instead: `map`, `filter`, `slice`, `concat`, `toSorted`, and spread.

Try it. In `node`, run the `updatedStudents` example, then check that `students[1].scores` still has two scores and `updatedStudents[1].scores` has three.

## Compare objects

On arrays and objects, `===` asks "is this the same object?", not "does it hold the same values?":

```js
[1, 2] === [1, 2];   // false: two different arrays
const a = [1, 2];
const b = a;
a === b;             // true: one array with two names
```

To compare contents, compare the values you care about:

```js
const sameStudent = (x, y) => x.name === y.name;
```

The tests use both kinds of comparison. `expect(result).toBe(expected)` uses `===`. `expect(result).toEqual(expected)` compares contents, key by key and item by item. That's why the tests use `toEqual` for every array and object.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-gradebook.js` computes averages, finds the passing students, and finds the top student.
2. `02-shopping-cart.js` adds products, changes quantities, and totals a cart, without changing the cart it's given.
3. `03-transactions.js` filters transactions by month, groups them by category, and finds the category with the most spending.

Run `npm test 07` after each change. When every test passes, you're ready to submit.

Functions can call each other. `passingStudents` and `topStudent` get shorter if they call `studentAverages`.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Rewrite `groupByCategory` with [`Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy). Do the tests still pass?
- Add `removeItem(cart, id)` to the cart. Which function you already wrote can do the work?
- Write `topStudent` with one `reduce` and no other loop.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/07-arrays-and-objects
git commit -m "Complete lesson 07 exercises"
git push -u origin lesson-07
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- No function changes its arguments: no `push`, `sort`, `splice`, or `item.key = ...` on data that was passed in
- `map`, `filter`, and `reduce` where they read more clearly than a `for` loop
- Every `reduce` has a starting value
- Money stays in whole cents, and only tax gets rounded
- Callback parameters named for what they hold (`student`, `item`), not `x` or `el`
