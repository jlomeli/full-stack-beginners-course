# 12. Node.js fundamentals

In this lesson you build two command-line tools in Node.js: a word counter and a CSV-to-JSON converter. You run them in your terminal, the way you run `git` and `npm`.

## What you will be able to do

- Run JavaScript outside the browser
- Read and write files, and read environment variables
- Build a small command-line tool

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-12
```

Run the tests for this lesson:

```sh
npm test 12
```

You see 34 failing tests. Your job this lesson is to make them pass.

## JavaScript without a browser

Until now your JavaScript ran inside a web page. The browser gave it `document`, `window`, and `fetch`. Node.js is a program that runs JavaScript on its own. It has no page, so there is no `document`. Instead it gives you tools for the computer you are on: files, folders, environment variables, and the terminal.

Check that you have Node 22 or newer:

```sh
node --version
```

Start the interactive prompt by typing `node` and pressing Enter. Try a few lines, then press Ctrl+D to leave:

```js
2 + 2
[1, 2, 3].map((n) => n * 2)
process.platform
```

To run a file, give `node` its path. Create `hello.js` anywhere outside the `lessons/` folder:

```js
console.log('Hello from Node');
```

```sh
node hello.js
```

You see `Hello from Node`. `console.log` writes to the terminal instead of a browser console.

## Modules in Node

This course's `package.json` has `"type": "module"`, so every `.js` file here is an ES module. You write `import` and `export` the same way you did in the browser.

Node's built-in tools live in modules whose names start with `node:`. You import them with that prefix:

```js
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
```

You need no `npm install` for these. They ship with Node. See the [Node.js API docs](https://nodejs.org/docs/latest/api/) for the full list.

## Reading and writing files

The `node:fs` module reads and writes files:

```js
import { readFileSync, writeFileSync } from 'node:fs';

const text = readFileSync('notes.txt', 'utf8');
writeFileSync('copy.txt', text);
```

Pass `'utf8'` to get a string back. Without it, you get raw bytes.

A relative path like `'notes.txt'` is relative to the folder you ran `node` from, not to the file with the code in it. That is why the tests for this lesson run your tools from a temporary folder.

Reading a file that doesn't exist throws an error. Catch it and decide what to tell the user:

```js
try {
	const text = readFileSync('missing.txt', 'utf8');
} catch (error) {
	console.log(error.code);   // 'ENOENT': no such file or directory
}
```

`readFileSync` blocks until the file is read. That is fine for a small script. For a server that handles many requests, you use `readFile` from `node:fs/promises`, which returns a promise like `fetch` does:

```js
import { readFile } from 'node:fs/promises';

const text = await readFile('notes.txt', 'utf8');
```

Build file paths with `node:path` instead of gluing strings together with `/`, because Windows uses `\`:

```js
import { join } from 'node:path';

join('data', 'books', 'dune.json');   // 'data/books/dune.json'
```

## Arguments, environment variables, and exit codes

A command-line tool takes its input from the command line. `process.argv` is an array of everything you typed:

```js
console.log(process.argv);
```

Save that as `args.js` and run `node args.js one two`. You see an array whose first item is the path of `node`, whose second is the path of `args.js`, and whose last two are `'one'` and `'two'`. Your own arguments start at index 2, so `process.argv.slice(2)` gives you exactly those.

An **environment variable** is a named setting that the shell passes to a program. You read it from `process.env`:

```sh
GREETING=Hi node -e "console.log(process.env.GREETING)"
```

You see `Hi`. Reading a variable that isn't set gives `undefined`, so supply a default with `??`:

```js
const delimiter = process.env.CSV_DELIMITER ?? ',';
```

Environment variables are how programs get settings that change between computers, such as a port number or an API key. Never write a secret in your code. Read it from `process.env`.

A program talks to the terminal through two output streams. `console.log` writes to **stdout**, the normal output. `console.error` writes to **stderr**, for errors and warnings. They look the same on screen, but a user can send stdout to a file and still see the errors:

```sh
node 02-csv-to-json.js books.csv > out.json
```

When a program finishes, it reports an **exit code**. `0` means success. Any other number means failure. Scripts and CI use the code to decide whether to continue. Set it with `process.exitCode`:

```js
if (!path) {
	console.error('Usage: node tool.js <file>');
	process.exitCode = 1;
}
```

Setting `process.exitCode` lets the program finish what it is doing and then exit with that code. `process.exit(1)` stops immediately, which can cut off output that is still being written. Prefer `process.exitCode`.

Check an exit code in your shell with `echo $?` right after a command:

```sh
node -e "process.exitCode = 3"
echo $?
```

You see `3`.

## Structure of a good command-line tool

Both tools in this lesson have two layers:

- **Pure functions** like `countText` and `parseRows`. They take values and return values. They don't read files or print anything, so a test can call them directly.
- **`main()`**, which reads `process.argv` and `process.env`, touches files, prints, and sets the exit code. It calls the pure functions.

Each starter file ends with this guard:

```js
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
```

`process.argv[1]` is the file `node` was started with, and `import.meta.url` is the address of the current file. They match only when you run this file directly. When a test imports the file to call `countText`, they differ, so `main()` stays quiet. The guard is already written. Leave it as it is.

The tests check your tools two ways. They import the pure functions and check what comes back. They also start your tool as a real process with `node` in a temporary folder, hand it real files, and check stdout, stderr, and the exit code.

## Exercises

Open each file in `exercises/`, read the comments, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-word-count.js` counts lines, words, and characters in files, like the Unix `wc` command.
2. `02-csv-to-json.js` converts a CSV file to JSON. It handles quoted fields, reads its delimiter from an environment variable, and can write to a file.

Run `npm test 12` after each change. Build the pure functions first, and run the tool by hand once they pass.

### Run your tools by hand

Make a folder outside `lessons/` for test files, for example `~/scratch`. Create `notes.txt` with a few lines of text and `books.csv` like this:

```csv
title,author,year
Dune,Frank Herbert,1965
"Emma, annotated",Jane Austen,1815
```

Run the tools from that folder, giving the path to your code:

```sh
cd ~/scratch
node ~/path/to/course/lessons/12-node-fundamentals/exercises/01-word-count.js notes.txt
node ~/path/to/course/lessons/12-node-fundamentals/exercises/02-csv-to-json.js books.csv
node ~/path/to/course/lessons/12-node-fundamentals/exercises/02-csv-to-json.js books.csv books.json
```

Try the failure paths too. Give a file that doesn't exist, run with no arguments, and check `echo $?` after each.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Make `01-word-count.js` read from stdin when you give it no files, so `cat notes.txt | node 01-word-count.js` works.
- Add a `CSV_PRETTY=0` environment variable that prints compact JSON.
- Convert numeric-looking values like `1965` to numbers. What goes wrong for a book titled `1984`, or for a phone number that starts with `0`?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/12-node-fundamentals
git commit -m "Complete lesson 12 exercises"
git push -u origin lesson-12
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Pure functions stay pure: no file access or printing inside `countText`, `formatCounts`, `parseRows`, or `csvToObjects`
- Errors go to stderr with `console.error`, and failures set a non-zero exit code with `process.exitCode`
- No `process.exit()` calls in the middle of the program
- A missing file produces a friendly message, not a stack trace
- The CSV parser reads one character at a time with clear state (inside quotes or not), not a pile of `split` calls that break on quoted commas
