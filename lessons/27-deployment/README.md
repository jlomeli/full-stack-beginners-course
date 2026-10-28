# 27. Deployment and CI/CD

In this lesson you put the library app on the internet. You write a config module that refuses to start with bad environment variables and a `/health` route that hosts can check. Then you deploy a front end, an API, and a database, and set the app to redeploy whenever `main` changes.

## What you will be able to do

- Build for production and configure environment variables
- Deploy a front end, an API, and a database
- Deploy automatically when main changes

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-27
```

Run the tests for this lesson:

```sh
npm test 27
```

You see 23 failing tests and 1 passing. Your job is to make them all pass. Then you deploy, which no test can check. The reviewer opens your live URL.

## What "deploying" means

On your laptop, the app runs when you type a command. A deployed app runs on someone else's computer, all the time, and strangers reach it by URL. Four things change:

1. **Something else starts your app.** The host runs your build command, then your start command.
2. **Your `.env` file isn't there.** You tell the host your settings (environment variables) in its dashboard.
3. **The database is a separate service.** Your app finds it through a connection string.
4. **You can't watch it.** You read logs and a health check instead.

## Build for production

A development server is built for speed of change. A production build is built for speed of use. For the React front end, Vite compiles and bundles your files:

```sh
npx vite build lessons/26-testing-the-stack/project
```

Look in the `dist/` folder it creates. It holds plain HTML, CSS, and JavaScript with hashed file names, such as `index-3f9a1c.js`. Any static host can serve those files. No Node runs for the front end in production.

For the API, "build" means `npm ci --omit=dev`: install the packages the server needs, with the exact versions from the lock file. The start command is `node server.js`.

## Environment variables

Code is the same everywhere. Settings differ: the database address on your laptop is not the one in production. Keep settings in environment variables, which the operating system hands to your process:

```js
process.env.PORT          // '8080' (always a string, or undefined)
process.env.DATABASE_URL  // 'postgres://user:password@host:5432/library'
```

Rules:

- Never commit secrets. `.env` goes in `.gitignore`. Commit a `.env.example` with fake values so others know which names exist.
- Set production values in the host's dashboard, or in GitHub's Settings, Secrets and variables, for CI.
- A secret that was ever committed is leaked. Replace it, don't delete the commit.
- Hosts tell your app which port to listen on through `PORT`. Read it. Don't hard-code 3000.

### Validate them when the app starts

A missing `DATABASE_URL` shows up as a confusing error an hour later, on the first request. Check everything once, at startup, and crash right away with a clear message. This is called failing fast. Open `exercises/01-config.js`. You use zod, from lesson 19:

```js
import * as z from 'zod';

const Env = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

Env.parse({ PORT: '8080' });  // { PORT: 8080 }
Env.parse({ PORT: 'abc' });   // throws
```

`z.coerce.number()` turns the string `'8080'` into the number `8080` first, then checks it. `.default(3000)` fills in a missing value. For the rest of the shape, see [zod's docs](https://zod.dev).

Use `safeParse` when you want to build your own error message. It returns `{ success, data }` or `{ success: false, error }`, and `error.issues` has one entry per problem, each with a `path`. Your error lists all the bad variables at once, so a person fixing a deploy doesn't have to redeploy once per mistake. It never prints a value, only names, because deploy logs are readable by many people.

Try it. Write `loadConfig` until `npm test 27` shows the config tests passing.

## A health check route

A host needs to know whether your app is alive. It calls a URL every few seconds. If the URL stops answering with a 2xx status, the host restarts the app or stops sending it traffic. Open `exercises/02-health.js`.

A good health check runs a real, cheap query:

```js
app.get('/health', async (req, res) => {
	try {
		await db.query('SELECT 1');
		res.json({ status: 'ok' });
	} catch {
		res.status(503).json({ status: 'unavailable' });
	}
});
```

An app that can't reach its database is not healthy, even though Node is running. Status `503` means "temporarily can't serve". Don't put the error message in the response, because anyone can call `/health`.

Express 5 passes errors from async handlers to its error middleware by itself, but here you catch the error on purpose to turn it into a 503.

The tests pass a PGlite instance as `db`, and a fake whose `query` rejects. Write the route until they pass.

## Wire it together

`createApp` and `loadConfig` do nothing until a file calls them. A `server.js` for the real app looks like this. It is not tested because it listens on a real port and connects to a real database:

```js
import pg from 'pg';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

const config = loadConfig(); // crashes with a clear message if the environment is wrong
const db = new pg.Pool({ connectionString: config.databaseUrl });

createApp({ db, config }).listen(config.port, () => {
	console.log(`Listening on port ${config.port} (${config.nodeEnv})`);
});
```

Copy `loadConfig` and the `/health` route into your Project 4 app, and install `pg` there (`npm install pg`).

## Choose hosts

You need a place for each of the three parts. These are examples of what exists today. Offers and limits change often, so read each site's current pricing page before you sign up, and don't enter a payment card you don't need to.

| Part | Examples | What it gives you |
| --- | --- | --- |
| Front end (static files) | [Vercel](https://vercel.com), [Netlify](https://www.netlify.com) | Builds on push, serves `dist/` on a CDN |
| API (a running Node process) | [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io) | Runs your start command, injects `PORT` and variables, restarts on a failed health check |
| PostgreSQL | [Neon](https://neon.tech), [Supabase](https://supabase.com), or the database offered by your API host | A connection string |

Any combination works. The steps below are the same on every host, with different names for the buttons.

## Deploy the database

1. Create a Postgres database on your chosen provider.
2. Copy its **connection string**. It looks like `postgres://user:password@host/dbname`. Treat it as a password.
3. Load your schema. From your laptop, with `psql`:

```sh
psql "$DATABASE_URL" -f lessons/26-testing-the-stack/project/schema.sql
```

Set `DATABASE_URL` in your terminal first, or paste the string in quotes. Your shell history keeps what you type, so prefer the variable.

Check it with `psql "$DATABASE_URL" -c '\dt'`. You see `books`, `loans`, and `members`.

## Deploy the API

1. Create a new web service on your API host and connect your GitHub repo.
2. Set the build command (`npm ci --omit=dev`) and the start command (`node server.js`). Set the root directory if your server is in a subfolder.
3. Add the environment variables: `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), and `CORS_ORIGIN` if your front end is on another domain.
4. Set the health check path to `/health`.
5. Deploy and read the logs. Your `Listening on port ...` line should appear.
6. Open `https://<your-api-url>/health`. You see `{"status":"ok","env":"production"}`.

Now break it on purpose. Delete `SESSION_SECRET` in the dashboard and redeploy. The deploy should fail, and the log should start with `Invalid environment:`. That is the config module doing its job. Put the variable back.

## Deploy the front end

1. Create a new static site on your front-end host and connect the same repo.
2. Build command: `npx vite build`. Publish directory: `dist`. Set the root directory to the folder with `index.html`.
3. The browser calls `/api/...` on the same origin during development because Vite's proxy forwards it. In production there is no proxy. Pick one:
   - Have the static host rewrite `/api/*` to your API's URL. Hosts call these "rewrites" or "redirects with status 200".
   - Or build the API's full URL into the front end, and set `CORS_ORIGIN` on the API to your front end's address.
4. Open the front-end URL. Log in, add a book, borrow a book.

A cookie set by the API only reaches the API when the browser considers the request same-site. Rewrites keep everything on one origin, which makes this the simpler choice for this course.

## Deploy automatically when main changes

CI/CD is two ideas:

- **Continuous integration (CI):** run the tests on every change.
- **Continuous delivery (CD):** when the tests pass on `main`, ship it.

Most hosts can deploy on every push to a branch, with no extra setup. Turn on "auto deploy" for `main` in each service. To make a deploy wait until tests pass, use your host's option "deploy after CI checks pass" if it has one, or let GitHub Actions call a deploy hook:

```yaml
name: Test and deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx vitest run

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger the API deploy
        run: curl --fail -X POST "$DEPLOY_HOOK_URL"
        env:
          DEPLOY_HOOK_URL: ${{ secrets.DEPLOY_HOOK_URL }}
```

`needs: test` means the deploy job runs only when the test job passes. A deploy hook is a secret URL that your host gives you; calling it starts a deploy. Store it in GitHub under Settings, Secrets and variables, Actions. Never paste it into the file.

Test your pipeline: change the heading in `App.jsx`, merge to `main`, and watch the live site update. Then break a test, merge, and confirm that nothing deploys.

## Exercises

1. `01-config.js` validates environment variables with zod and builds the config object.
2. `02-health.js` creates the Express app with a `/health` route and a 404 handler.
3. Deploy the library app and post the live URL in your PR. Fill in `03-deployment.md` and paste it into your PR description. No test checks this. The reviewer opens your URL.

Run `npm test 27` after each change to the first two.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a `/health` response field `commit` that shows the deployed commit hash. Where does the host expose it?
- Add a staging environment that deploys from a `staging` branch with its own database.
- Add a `.env.example` and a README section that lists every variable.
- Find your host's rollback feature and use it once.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/27-deployment
git commit -m "Complete lesson 27 exercises"
git push -u origin lesson-27
gh pr create --fill
```

Put the live front-end URL and the `/health` URL in the PR description. The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- The live URL loads, and log-in, add book, and borrow work on it
- `/health` on the live API answers `ok`
- No secret in the repo, the PR, or the logs; `.env` is ignored
- Environment variables are read in one place (`loadConfig`), not scattered through the code
- `03-deployment.md` is filled in honestly, including what went wrong
