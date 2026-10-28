# 18. TypeScript basics

In this lesson you convert three JavaScript modules from lesson 07 to TypeScript: gradebook statistics, shopping cart totals, and grouping transactions by category. The compiler finds bugs that were hiding in them, and you fix those too.

## What you will be able to do

- Annotate variables, functions, and objects
- Read and fix compiler errors
- Convert a JavaScript module to TypeScript

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-18
```

Run the tests for this lesson:

```sh
npm test 18
```

This lesson works differently from earlier ones. `npm test 18` runs the TypeScript compiler first, and it stops there when it finds errors. On the starter code it reports 46 compiler errors and runs no tests. Fixing those errors is your job. Once the compiler is happy, the tests run, and 16 of the 50 tests fail until your code behaves correctly too.

## What TypeScript adds

TypeScript is JavaScript plus types. A type says what kind of value a variable, parameter, or return value holds. A program called the compiler (`tsc`) checks the types before your code runs. It never changes how your code behaves. It only tells you where the code contradicts itself.

Here is a bug from lesson 07's cart code:

```js
const percent = DISCOUNT_PERCENTS[code.toUppercase()] ?? 0;
```

`toUppercase` has a typo. In JavaScript you find out when the code runs and crashes. In TypeScript the compiler reports it as you write it:

```
error TS2551: Property 'toUppercase' does not exist on type 'string'. Did you mean 'toUpperCase'?
```

You will meet this exact error in the exercises.

TypeScript files end in `.ts`. Vitest runs them directly, and `tsc` checks them. To check without running anything, use the command that `npm test` runs for you:

```sh
npx tsc --noEmit -p lessons/18-typescript-basics
```

`-p` points `tsc` at the folder's `tsconfig.json`. That file turns on `strict` mode, which is the setting you want: it makes the compiler as thorough as it can be.

## Annotate variables

Add a type after a name with a colon:

```ts
const count: number = 3;
const name: string = 'Ada';
const done: boolean = false;
```

You rarely need to. TypeScript works out the type from the value, which is called inference. Hover over `count` in VS Code to see what it inferred:

```ts
const count = 3;        // TypeScript knows this is a number
let message = 'hi';     // and this is a string
```

Types protect you from mixing things up. Try this. Create `lessons/18-typescript-basics/scratch.ts`:

```ts
const count: number = 'three';
```

Run `npx tsc --noEmit -p lessons/18-typescript-basics`. You see:

```
lessons/18-typescript-basics/scratch.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.
```

Delete `scratch.ts` before you commit. It makes the type check fail on purpose.

Arrays have a type too. `number[]` is an array of numbers and `string[]` is an array of strings:

```ts
const scores: number[] = [90, 72, 85];
scores.push('A');       // error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

## Annotate functions

Annotate each parameter, and the return value after the parentheses:

```ts
function double(n: number): number {
	return n * 2;
}
```

A parameter with no type is an error in strict mode. TypeScript will not guess it for you:

```ts
function double(n) {      // error TS7006: Parameter 'n' implicitly has an 'any' type.
	return n * 2;
}
```

`any` means "turn the checking off", so strict mode refuses to use it by accident. Most of the errors you fix in this lesson are this one. The fix is always the same: say what the parameter is.

A default value gives the parameter its type, so `passMark = 60` needs no annotation. Add a `?` to make a parameter optional:

```ts
function greet(name: string, greeting?: string): string {
	return `${greeting ?? 'Hello'}, ${name}`;
}
```

An optional parameter has the type `string | undefined` inside the function, which leads to the next idea.

## Describe objects with a type

An object type lists each property and its type. Give it a name with `type`:

```ts
type Student = {
	name: string;
	scores: number[];
};

const ada: Student = { name: 'Ada', scores: [90, 95, 100] };
```

Now the compiler knows what a `Student` has. It catches a misspelled property:

```ts
const grace: Student = { name: 'Grace', score: [70, 80] };
// error TS2561: Object literal may only specify known properties, but 'score' does not exist in type 'Student'. Did you mean to write 'scores'?

console.log(ada.email);
// error TS2339: Property 'email' does not exist on type 'Student'.
```

Add `export` in front of `type` so other files, and the tests, can import it:

```ts
export type Student = { name: string; scores: number[] };
```

The tests check your types. A test like `expectTypeOf<Student>().toEqualTypeOf<{ name: string; scores: number[] }>()` fails when your `Student` has a different shape, even though no code runs.

## Union types

A union type says "one of these". The `|` is read as "or":

```ts
type ShippingMethod = 'standard' | 'express';

let method: ShippingMethod = 'standard';
method = 'overnight';
// error TS2322: Type '"overnight"' is not assignable to type 'ShippingMethod'.
```

Each option is a specific string, not just any string. The compiler now rejects typos in every function that takes a `ShippingMethod`.

You can also combine a type with `undefined`. This is how TypeScript describes a function that sometimes finds nothing:

```ts
function first(list: string[]): string | undefined {
	return list[0];
}

const word = first(['apple']);
word.toUpperCase();
// error TS18048: 'word' is possibly 'undefined'.
```

The compiler will not let you use a value that might not exist. Check first, and TypeScript narrows the type inside the check:

```ts
if (word !== undefined) {
	word.toUpperCase();   // fine: word is a string here
}
```

This catches the crash that JavaScript only shows you at runtime, when the list happens to be empty. You will fix one in `03-transactions.ts`.

A function with a declared return type must return a value on every path:

```ts
function grade(score: number): string {
	if (score >= 90) {
		return 'A';
	}
}
// error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
```

That is a real bug the compiler found: `grade(50)` would return `undefined`. Add the missing case.

## Objects used as dictionaries

Sometimes an object has no fixed property names. It maps any string to a value, like a count per category. `Record<string, number>` describes that:

```ts
const totals: Record<string, number> = {};
totals['food'] = 105;
```

Without the annotation, `const totals = {}` has the type `{}`, which has no properties, and the compiler rejects `totals['food']` with `error TS7053: Element implicitly has an 'any' type`. Whenever a variable starts out as `{}` or `[]`, tell TypeScript what will go in it:

```ts
const groups: Record<string, Transaction[]> = {};
const names: string[] = [];
```

`Record<ShippingMethod, number>` is a dictionary with exactly the keys `'standard'` and `'express'`. It makes the compiler check that every key is there and every value is a number.

## Read compiler errors

An error looks like this:

```
lessons/18-typescript-basics/exercises/02-cart.ts(38,9): error TS7053: Element implicitly has an 'any' type ...
```

- `02-cart.ts(38,9)` is the file, line 38, column 9. Click it in VS Code, or open the file at that line.
- `TS7053` is the error code. Search for it when the message is unclear.
- The message says what is wrong. Some errors continue on the next indented line with more detail.

Read the first error, fix it, and run the check again. One mistake often causes several errors, so fixing the first can clear many. If you fix errors from the bottom of the list, you may fix things that were never wrong.

The errors you will see most:

| Error | Usual meaning | Usual fix |
| --- | --- | --- |
| `TS7006` parameter implicitly has an `any` type | You did not say what a parameter is | Add a type after the parameter name |
| `TS7053` element implicitly has an `any` type | You indexed an object with a key TypeScript cannot check | Annotate the object as a `Record`, or type the key as a union |
| `TS2339` property does not exist | A typo, or the type is missing the property | Fix the spelling, or add the property to the type |
| `TS2322` type is not assignable | A value has a different type than the place it goes | Fix the value or fix the type, whichever is wrong |
| `TS18048` is possibly `undefined` | The value might not exist | Check for `undefined` before you use it |
| `TS2366` function lacks ending return statement | Some path through the function returns nothing | Return a value on every path |

Some errors are not about missing annotations. They are bugs that already existed, and that is the point of the exercise. Every time the compiler complains about something other than "add a type", stop and ask what the code was doing wrong.

## Convert a JavaScript module

This is the process for the exercises, and for any JavaScript file you convert later:

1. Open the file and read the comment at the top. It lists the types to export.
2. Add the exported types first.
3. Run `npx tsc --noEmit -p lessons/18-typescript-basics`.
4. Take the errors for your file one at a time, from the top.
5. Annotate parameters and return values. Type every variable that starts out empty.
6. When the compiler reports something that is not a missing type, work out the bug and fix it. The comment above each function says what it should do.
7. Run `npm test 18` for the tests.

## Exercises

Each exercise is a `.ts` file that contains the plain JavaScript from lesson 07. The comment at the top says what to do. Each has a matching `.test.ts` file. Read the tests too. They check your types as well as your code.

1. `01-gradebook.ts` converts gradebook statistics. Export `Student` and `ReportRow`, and fix the bugs the compiler finds.
2. `02-cart.ts` converts shopping cart totals. Export `CartItem` and `ShippingMethod`, and fix the bugs the compiler finds.
3. `03-transactions.ts` converts transaction grouping. Export `Transaction`, and fix the bugs the compiler finds.

Run `npm test 18` after each change. When every test passes, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- In `02-cart.ts`, change `DISCOUNT_PERCENTS` from `Record<string, number>` to a type that lists the real codes. What does `applyDiscount` have to do before it can look a code up?
- Change `average` to accept `readonly number[]`. What does `readonly` stop a function from doing?
- Change `grade` in `ReportRow` and the return type of `letterGrade` to a union of the five letters. Run `npm test 18`. Which test fails, and why does it make sense?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/18-typescript-basics
git commit -m "Complete lesson 18 exercises"
git push -u origin lesson-18
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- No `any` anywhere, written or implied
- No type assertions (`as Something`) used to silence an error
- Types on parameters and return values, and no annotations that only repeat what TypeScript infers
- A short explanation in the PR of each bug the compiler found, and how you fixed it
- No `scratch.ts` or other leftover files
