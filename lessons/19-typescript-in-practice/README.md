# 19. TypeScript in practice

In this lesson you type the library API from end to end, check request bodies with Zod, and model a bookstore order's lifecycle so the compiler rejects orders that make no sense.

## What you will be able to do

- Model data with union types
- Write generic functions
- Parse untrusted input with Zod

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-19
```

Run the tests for this lesson:

```sh
npm test 19
```

Like lesson 18, `npm test 19` runs the compiler first and stops when it finds errors. On the starter code it reports 105 compiler errors and runs no tests. Once the compiler is happy, 93 tests run.

You do not have to fix all three exercises before you see any test results. These two commands check one exercise at a time:

```sh
npx vitest run lessons/19-typescript-in-practice/exercises/01-library
npx tsc --noEmit -p lessons/19-typescript-in-practice | grep 01-library
```

The first runs the tests for `01-library`, without the compiler check. The second shows only the compiler errors that mention that file. Do the exercises in order. `02-requests.ts` imports from `01-library.ts`, so a mistake in the first one shows up in the second.

## Union types

Lesson 18 introduced unions like `'standard' | 'express'`. A union says a value is one of several types. Unions get powerful when each option carries different data.

Take a function that can succeed or fail. Returning `number | undefined` says nothing about why it failed. A better shape is an object that says which case it is:

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parseAge(text: string): Result<number> {
	const age = Number(text);
	if (Number.isNaN(age)) {
		return { ok: false, error: 'not a number' };
	}
	return { ok: true, value: age };
}
```

`ok` is the discriminant: a property whose value tells you which member of the union you have. When you check it, TypeScript narrows the type:

```ts
const result = parseAge('42');

if (result.ok) {
	console.log(result.value + 1);          // result is { ok: true; value: number }
} else {
	console.log(result.error.toUpperCase()); // result is { ok: false; error: string }
}

console.log(result.value);
// error TS2339: Property 'value' does not exist on type 'Result<number>'.
```

The last line is an error because `value` exists only on the success case. You cannot read a result before you check it. That is the point: the type forces the check that a careless programmer would forget.

Try it. Create `lessons/19-typescript-in-practice/scratch.ts` with the code above, run `npx tsc --noEmit -p lessons/19-typescript-in-practice`, and watch the one error. Delete the file when you finish.

You return errors this way throughout `01-library.ts`. The functions never throw for a missing book or a duplicate email. They return `{ ok: false, error }`, and the caller has to look.

## Discriminated unions

The same idea models anything with stages. A shape is a circle or a square, and each has its own measurements:

```ts
type Shape =
	| { kind: 'circle'; radius: number }
	| { kind: 'square'; side: number };
```

`kind` is the discriminant. A `switch` on it narrows the shape in each branch:

```ts
function area(shape: Shape): number {
	switch (shape.kind) {
		case 'circle':
			return Math.PI * shape.radius ** 2;
		case 'square':
			return shape.side ** 2;
	}
}
```

Inside `case 'circle'`, `shape.radius` exists. Inside `case 'square'`, only `shape.side` does. Add a third shape later and the compiler flags `area`: the function no longer returns on every path. You can make that explicit with a helper that only accepts `never`, the type of a value that cannot exist:

```ts
function assertNever(value: never): never {
	throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

// at the end of the switch:
default:
	return assertNever(shape);
```

If every case is handled, `shape` in the default branch has type `never` and this compiles. If you forget a case, `shape` is the unhandled shape, and the compiler reports an error. You get a to-do list from the compiler every time the union grows.

## Make illegal states unrepresentable

The orders exercise puts this to work. An order moves through stages: pending, paid, shipped, delivered, and a pending or paid order can be cancelled. A common first attempt uses one type for all of them:

```ts
type Order = {
	status: string;
	id: number;
	paidAt?: Date;
	trackingNumber?: string;
};
```

That type allows a pending order with a tracking number, a shipped order with none, and `status: 'banana'`. Every function that reads an order has to guess which fields to trust.

A discriminated union gives each stage exactly its own data:

```ts
type PendingOrder = { status: 'pending'; id: number; items: OrderItem[] };
type PaidOrder = { status: 'paid'; id: number; items: OrderItem[]; paidAt: Date };

type Order = PendingOrder | PaidOrder; // and the other stages
```

Now `{ status: 'pending', ..., trackingNumber: 'x' }` is a compile error, and so is a `paid` order with no `paidAt`. You can also type each transition for exactly the stage it starts from:

```ts
function payOrder(order: PendingOrder, paidAt: Date): PaidOrder {
	return { ...order, status: 'paid', paidAt };
}
```

Calling `payOrder` with a shipped order is now a compile error. The mistake is caught while you type, not by a customer. The spread `...order` copies every property of the old order, and the next properties override or add to it. The tests use `// @ts-expect-error` to check that these mistakes are errors. A `// @ts-expect-error` line passes only when the next line has a compile error, so the tests also fail if your types are too loose.

## Generics

Sometimes a function works on any type, and you want TypeScript to remember which one. This function returns the first item of a list:

```ts
function first<T>(items: T[]): T | undefined {
	return items[0];
}
```

`T` is a type parameter. It stands for whatever type the caller uses. TypeScript works out `T` from the argument:

```ts
const n = first([1, 2, 3]);   // number | undefined
const w = first(['a']);       // string | undefined
const x: number = w;
// error TS2322: Type 'string | undefined' is not assignable to type 'number'.
```

You wrote `first` once, and it is type-safe for numbers, strings, and books. Without `T`, you would write `any`, and every result would lose its type.

A generic function may need to know a little about `T`. `findById` reads `item.id`, so every item must have one. State that with `extends`:

```ts
function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
	return items.find((item) => item.id === id);
}

findById(['a'], 1);
// error TS2322: Type 'string' is not assignable to type '{ id: number; }'.
```

`T extends { id: number }` means "any type, as long as it has a numeric `id`". Books, members, and loans all qualify. Call `findById(library.books, 1)` and the result is `Book | undefined`, not just "some item".

Generic types work the same way. `Result<T>` above is one. `Record<string, T[]>` is another: an object whose values are arrays of `T`.

## Parse untrusted input with Zod

TypeScript checks types while you write code. It cannot check data that arrives while the program runs. A request body from a browser is `unknown`: it might be anything. Request data is never safe to trust, and TypeScript makes that rule enforceable, because it will not let you use an `unknown` value until you check it:

```ts
function handle(body: unknown) {
	return body.name;
	// error TS18046: 'body' is of type 'unknown'.
}
```

You could write the checks by hand with `typeof`. Zod does it for you. You describe the shape once, as a schema, and Zod gives you both the check and the TypeScript type:

```ts
import { z } from 'zod';

const userSchema = z.object({
	name: z.string().trim().min(1),
	age: z.number().int().min(0),
});

type User = z.infer<typeof userSchema>;   // { name: string; age: number }
```

`z.infer` reads the type out of the schema, so the schema and the type cannot disagree. Run the schema on untrusted data with `safeParse`. It never throws. It returns an object that says whether the data was valid:

```ts
const parsed = userSchema.safeParse({ name: '  ', age: 'x' });

if (parsed.success) {
	parsed.data;      // a User, trimmed and checked
} else {
	parsed.error.issues;
}
```

Each entry in `issues` has a `path` (the field that failed) and a `message`:

```
[
  { path: ['name'], message: 'Too small: expected string to have >=1 characters', ... },
  { path: ['age'],  message: 'Invalid input: expected number, received string', ... }
]
```

A schema does more than check:

- `.trim()` and `.toLowerCase()` change the value as they check it. The parsed output is already cleaned up.
- `z.email()` checks the text is shaped like an email address.
- Keys the schema doesn't list are dropped. A client that sends `{ id: 99, admin: true }` along with a new book cannot sneak those in.

This is the pattern for the rest of the course. The edge of your program, where requests arrive, takes `unknown` and parses it with a schema. Everything after that works with real types and never re-checks. Read more in the [Zod documentation](https://zod.dev/api).

## Type the library end to end

The three exercises are one pipeline:

```
request body (unknown) -> Zod schema -> NewBook -> addBook -> Book in the Library
```

`01-library.ts` defines the types and the in-memory library. `02-requests.ts` parses a body with Zod, then calls the library. Because the schemas and the library types meet in `NewBook`, `NewMember`, and `Result`, the compiler checks the whole path: if you change a field in `Book`, every function from the request to the stored record shows an error.

The library's types are the course's usual domain:

- `Book`: `id`, `title`, `author`, `year`
- `Member`: `id`, `name`, `email`
- `Loan`: `id`, `bookId`, `memberId`, `borrowedAt`, and `returnedAt`, which is a `Date` when the book came back and `null` while it is still out

A book is available when no loan for it has `returnedAt` equal to `null`. Notice that `returnedAt: Date | null` is a union too. The compiler makes you check for `null` before you treat it as a date.

## Exercises

Each exercise has a matching `.test.ts` file. Read the tests too. They check your types as well as your code.

1. `01-library.ts` is the library module, written without types. Add the types, make `findById` and `groupBy` generic, and fix the bugs the compiler finds.
2. `02-requests.ts` writes three Zod schemas and four functions that turn an unknown request body into a library action.
3. `03-orders.ts` models the order lifecycle as a discriminated union and types each transition.

Run `npm test 19` after each change. When every test passes, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Make `Library` hold a `nextId` counter instead of computing ids from array lengths. What breaks if a book could be deleted?
- Add a `refunded` stage to the orders. Which functions does the compiler flag? Does it flag `describeOrder`?
- Write `parseBody` so that a failed parse returns every issue as an array instead of one joined string. What does `Result` have to become?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/19-typescript-in-practice
git commit -m "Complete lesson 19 exercises"
git push -u origin lesson-19
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- No `any`, and no `as` assertions used to silence the compiler
- Zod schemas are the source of the request types, with `z.infer` and not a second hand-written copy
- Every `switch` over an order's status handles every stage, with `assertNever` as the default
- `findById` and `groupBy` are generic, not typed for books
- Errors are returned as `{ ok: false, error }`, not thrown
- No `scratch.ts` or other leftover files
