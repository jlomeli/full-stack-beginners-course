# 26. Testing across the stack

In this lesson you finish Project 4, the full-stack library app: an Express API on PostgreSQL and a React front end. You test it at three levels (API, component, and whole browser), then run those tests on every push with GitHub Actions. This is a three-session project. Plan three days.

## What you will be able to do

- Choose between unit, integration, and end-to-end tests
- Write end-to-end tests with Playwright
- Run tests in GitHub Actions

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-26
```

Run the tests for this lesson:

```sh
npm test 26
```

You see 40 failing tests and 5 passing. The 5 that pass check things already built, such as "responds 401 when nobody is logged in". Your job is to make all 45 pass, then add the browser tests and the CI workflow, which Vitest can't check.

## What is in `project/`

```
project/
  schema.sql         books, members, loans (the tables you know from lessons 15 and 16)
  server/
    app.js           createApp(db): sign-up, log-in, and /api/me are done. You write the book and loan routes.
    passwords.js     hashing from lesson 24 (done)
    dev.js           runs the API by hand on an in-memory Postgres with sample data
    app.test.js      API tests: Supertest against createApp(db) with PGlite
  client/
    api.js           fetch wrappers (done)
    App.jsx          the page (done). It wires the three components below together.
    LoginForm.jsx, AddBookForm.jsx, BookList.jsx    you write these
    App.test.jsx, forms-and-list.test.jsx           component tests
  main.jsx, index.html, vite.config.js              the browser entry point (done)
  e2e/playwright.config.js                          settings for the browser tests you write
```

Read `server/app.js` and `client/App.jsx` first. Every comment above a `// TODO` is the spec for that piece.

## The test pyramid

You can test an app at three sizes. Each size trades speed against how much it proves.

| Level | What runs | Speed | Example in this project |
| --- | --- | --- | --- |
| Unit and component | One function or one component. Everything it talks to is faked. | Milliseconds | `BookList` shows "On loan" for a borrowed book |
| Integration | Several real parts together, such as your routes and a real database | Tens of milliseconds | `POST /api/loans` twice returns 409 the second time |
| End-to-end (E2E) | The real browser, the real page, the real API | Seconds | A visitor logs in and adds a book |

Write many fast tests at the bottom, fewer in the middle, and a handful at the top. Draw it as a pyramid: wide base, narrow tip. Fast tests tell you which line broke. E2E tests tell you whether the pieces still fit together. They are slow and they break for reasons unrelated to your change (timing, a slow machine), so keep E2E for the journeys that would hurt most if they broke: log in, add a book, borrow a book.

Choose the lowest level that can catch the bug:

- A rule about data (year can't be in the future)? Test the API with Supertest.
- A rule about what one component shows (no Borrow button for visitors)? Render the component.
- Does clicking "Log in" in a real browser reach the real server and change the page? E2E.

## Level 1: API tests with Supertest and PGlite

The API tests build a fresh in-memory database for every test, so no test sees another test's rows:

```js
let db;
let app;

beforeEach(async () => {
	db = new PGlite();
	await db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
	app = createApp(db);
});

test('responds 201 with the new book, which starts out available', async () => {
	const ada = await logIn();
	const res = await ada.post('/api/books').send({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
	expect(res.status).toBe(201);
});
```

`createApp(db)` takes the database as an argument. In a test you pass PGlite. In production you pass a `pg` pool. Both have `query(sql, params)`, so the routes don't change.

Open `server/app.test.js` and read the `describe` blocks. Each test name says what is wrong when it fails. Then write the four routes in `server/app.js` one at a time:

1. `GET /api/books`
2. `POST /api/books`
3. `POST /api/loans`
4. `POST /api/loans/:id/return`

Run `npm test 26` after each route. Watch the failing count drop.

Two ideas to keep in mind while you write them:

- Let the database enforce rules it can enforce. The unique index in `schema.sql` allows one open loan per book. When two requests borrow the same book at once, the second INSERT fails with error code `23505`. Catch it and answer 409. A check-then-insert in JavaScript can lose that race.
- Always pass user input as `$1`, `$2` parameters, never by string concatenation (lesson 25).

## Level 2: component tests

Component tests render one component in a fake DOM (jsdom) and act like a user:

```jsx
render(<LoginForm onLogin={async () => Promise.reject(new Error('Wrong email or password'))} />);
await user.type(screen.getByLabelText('Email'), 'ada@example.com');
await user.click(screen.getByRole('button', { name: 'Log in' }));
expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password');
```

They find things the way a person or a screen reader does: by label and role, not by CSS class. If a test can find your input with `getByLabelText`, a screen reader user can find it too.

Write `LoginForm.jsx`, `AddBookForm.jsx`, and `BookList.jsx` until `forms-and-list.test.jsx` passes. Then run `App.test.jsx`. It renders the whole `App` against a fake server (`fakeFetch` in the test file) and checks the page works as one piece. This is an integration test on the front end: real components, fake network.

## Level 3: end-to-end tests with Playwright

[Playwright](https://playwright.dev) drives a real browser. The repo doesn't install it, because it downloads browsers and the course CI runs only Vitest. You install it in your own copy:

```sh
npm install --save-dev @playwright/test
npx playwright install chromium
```

This edits `package.json` and `package-lock.json` in your copy. Commit both in this PR: the CI job below runs `npm ci`, which needs Playwright in the lock file.

The file `project/e2e/playwright.config.js` is already written. It starts the API (`server/dev.js`, with an in-memory database and one member, `ada@example.com` / `correct-horse-battery`) and the Vite page on port 5173, then stops them when the run ends. It only picks up files named `*.e2e.js`, so `npm test` never tries to run them.

Create `project/e2e/library.e2e.js`:

```js
import { expect, test } from '@playwright/test';

async function logIn(page) {
	await page.goto('/');
	await page.getByLabel('Email').fill('ada@example.com');
	await page.getByLabel('Password').fill('correct-horse-battery');
	await page.getByRole('button', { name: 'Log in' }).click();
}

test('a member can log in and sees their name', async ({ page }) => {
	await logIn(page);
	await expect(page.getByText('Signed in as Ada Lovelace')).toBeVisible();
});
```

Run it from the repo root:

```sh
npx playwright test -c lessons/26-testing-the-stack/project/e2e
```

Playwright waits for `expect(...)` assertions to become true, up to a timeout. Use those assertions instead of `page.waitForTimeout(1000)`. A fixed sleep is either too short (flaky) or too long (slow).

The server keeps its data between tests in one run. Make your tests independent: give each book a title no other test uses, and don't assume the list is empty.

Write these E2E tests:

1. Log in with the right password. The page shows "Signed in as Ada Lovelace".
2. Log in with the wrong password. The page shows "Wrong email or password" and no "Log out" button.
3. Log in, add a book with a unique title, and see it in the list as "Available".
4. Log in, borrow a book, and see "On loan" for it.

When a test fails, run `npx playwright test -c lessons/26-testing-the-stack/project/e2e --ui` to step through it, or open the HTML report with `npx playwright show-report`.

## Run the tests in GitHub Actions

A test that only runs on your laptop protects nobody. A workflow file tells GitHub to run your tests on every push and pull request. Create `.github/workflows/library.yml` in your own repo:

```yaml
name: Library app tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  vitest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx vitest run lessons/26-testing-the-stack

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test -c lessons/26-testing-the-stack/project/e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

Read it top to bottom:

- `on` says when it runs: on every push to `main` and on every pull request.
- Each job runs on a fresh Linux machine. `checkout` copies your code onto it, `setup-node` installs Node, and `npm ci` installs exactly the versions in `package-lock.json`.
- `vitest` and `e2e` are separate jobs, so a slow browser test doesn't hide a fast failure and the two run side by side.
- `upload-artifact` with `if: failure()` saves the Playwright report only when something broke, so you can download it and see what the browser saw.

Check your own copy's `.github/workflows/` folder for the lesson checks that already run on your PRs. Your workflow is an addition, not a replacement. Whether the Playwright job passes on GitHub depends on Playwright being in your `package.json`, which is why the instructor reviews this part.

Workflow files are YAML, and indentation is the syntax. After you push, open the Actions tab of your repo and read the log of a run. Break a test on purpose, push, and watch the run fail. Then fix it.

## Project 4: the full-stack library app

The tests in `project/` define the app's behavior. The project asks for more than green tests: a working app, tested at every level, with a pipeline.

Work in three sessions:

1. **Session 1, the API.** Write the four routes. Get `server/app.test.js` to pass. Start the API with `node lessons/26-testing-the-stack/project/server/dev.js` and call it with `curl` or the browser to see the real responses.
2. **Session 2, the front end.** Write the three components. Get both `.test.jsx` files to pass. Then run the API and the page together (`node .../server/dev.js` in one terminal, `npx vite lessons/26-testing-the-stack/project` in another) and use the app by hand at `http://localhost:5173`.
3. **Session 3, the safety net.** Write the Playwright tests, add the GitHub Actions workflow, and paste a passing run into your PR.

### Rubric

The reviewer grades each row as Meets, Close, or Not yet.

| Area | Meets |
| --- | --- |
| API | All 45 Vitest tests pass. Routes use parameterized SQL. The loan rules are enforced by the database index, not by a check in JavaScript. |
| Components | Inputs have labels. Errors show in an element with `role="alert"`. Visitors never see Borrow or Add book. |
| E2E | The four journeys above are tested with `expect` assertions, not fixed sleeps. Each test works alone and in any order. |
| CI | The workflow runs Vitest and Playwright on pull requests. A failing test fails the run. |
| Test choice | The PR description gives one bug that a component test would catch and an E2E test would not, and why. |
| Evidence | The PR has the spec files committed and the pasted output of a passing `npx playwright test` run. |

## Exercises

1. Make the Vitest tests pass in `project/`: `server/app.js` (4 routes), `client/LoginForm.jsx`, `client/AddBookForm.jsx`, and `client/BookList.jsx`. `npm test 26` checks all 45.
2. Add Playwright tests for log-in and adding a book (plus the wrong-password and borrow journeys) in `project/e2e/library.e2e.js`. No test checks these. Commit the spec file and paste a passing run into your PR.
3. Add the GitHub Actions workflow and link a green run in your PR.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a test for `POST /api/loans/:id/return` that tries to return someone else's loan. Which level of the pyramid is the right one?
- Break the app on purpose (remove the `aria-label` from the Borrow button). Which tests fail? Which levels caught it?
- Use `page.route('/api/books', ...)` in Playwright to make the API fail, and check the page's behavior.
- Add `npx playwright test --retries=2` in CI. What does a retry hide?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/26-testing-the-stack .github/workflows/library.yml
git commit -m "Complete lesson 26 project"
git push -u origin lesson-26
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Tests at the right level: no E2E test for something an API test could catch
- No fixed sleeps in Playwright tests, and no test that depends on another test running first
- SQL parameters (`$1`) everywhere, with no string-built queries
- The pasted Playwright run is real, and the workflow file is valid and runs on pull requests
- Test names that read as sentences
