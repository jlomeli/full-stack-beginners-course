# 30. Capstone project and job search

In this project you design, build, and ship a full-stack app of your own over 15 sessions, with one pull request per milestone. You finish with a live app, a five-minute demo, and a GitHub profile, portfolio, and resume that point to it.

## What you will be able to do

- Plan, build, and ship an app of your own design
- Present your project and explain its trade-offs
- Prepare your portfolio, resume, and GitHub profile

## Where your work lives

The capstone is the first project you'll show employers, so it lives in its own repo on your own GitHub account, not in the course repo.

| Where | What's there | Who can see it |
| --- | --- | --- |
| `github.com/<you>/<app-name>` | All of the app's code, one pull request per milestone | Everyone. It's public. |
| Your course repo, branch `lesson-30` | `lessons/30-capstone/capstone.md`, a page of links | You and your instructors |

A hiring manager who opens your capstone repo sees your app's README at the top, its commit history, and nine reviewed pull requests. That reads as real work. The same app buried in `lessons/30-capstone/` of a private course repo can't be seen at all.

Public means anyone can read every commit you push, forever. Keep secrets in environment variables and `.env` in `.gitignore`, as lesson 27 showed. If you push a password or API key by accident, deleting it in a new commit isn't enough. Change the secret.

Your instructor reviews each milestone PR in your capstone repo. You add them as a collaborator, and you request their review on each PR. The `lesson-30` PR in your course repo is the last thing you submit. It links to everything.

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-30
```

This lesson has no automated tests in the course repo. Your capstone has its own tests, in its own repo. `npm test 30` finds no test files and exits without an error, so the **Lesson checks** on your `lesson-30` PR pass as soon as you push.

Open `capstone.md` in this folder. You fill it in as you go, and it's what you submit at the end.

Read this whole README before session 1. Then pick your project.

## Choose a project

Your app must meet each of these:

- It uses the course stack: a React front end, an Express API, and PostgreSQL. TypeScript is welcome.
- It has 3 to 5 tables, with at least one one-to-many relationship.
- Users sign up and log in, and each user can change only their own data.
- It does one thing beyond create, read, update, and delete. Examples: search, a computed summary, a status that changes over time, or a limit that fills up.
- You can describe its first version in five user stories or fewer.
- It isn't the library app.

The fifth rule matters most. Fifteen sessions go fast. A small app that works and is deployed beats a big app that's half done. You'll keep a list of features for later, and you can build them after the course.

### Ideas

Pick one of these, or bring your own. Your own is better if it solves a problem you or someone you know has. Interviewers always ask why you built it, and "my sister's running club tracked this in a group chat" is a great answer.

| App | Tables | The part beyond CRUD | Stretch |
| --- | --- | --- | --- |
| **Potluck planner** | users, events, guests, dishes | A guest claims a dish, and the event page shows what's still missing | Invite guests with a share link |
| **Job application tracker** | users, companies, applications, status changes | A dashboard counts applications by status and flags ones with no reply after 7 days | Import a job posting from its URL |
| **Plant care log** | users, plants, waterings | A "due today" list computed from each plant's watering interval | Photo upload per plant |
| **Workout log** | users, workouts, exercises, sets | Personal best per exercise | A chart of progress over time |
| **Flashcards** | users, decks, cards, reviews | Each card's next review date doubles when you get it right and resets when you don't | Public decks other users can copy |
| **Volunteer shifts** | users, organizations, shifts, signups | A shift is full when its signups reach its capacity | A waitlist that promotes the next person when someone cancels |

The job tracker has a bonus. You can use it for your own job search starting in week 11.

## Set up your capstone repo

Create the repo on your account and clone it. Use your app's name:

```sh
cd ~/projects
gh repo create potluck-planner --public --clone --add-readme --gitignore Node
cd potluck-planner
```

`--add-readme` makes the first commit, so `main` exists and you can open PRs into it. `--gitignore Node` adds a `.gitignore` that already lists `node_modules` and `.env`.

Add your instructor as a collaborator. Your instructor posts their GitHub username in class chat:

```sh
gh api -X PUT "repos/{owner}/{repo}/collaborators/<instructor-username>"
```

Inside a repo folder, `gh` fills in `{owner}` and `{repo}` for you. Your instructor gets an invitation email and accepts it. Check it worked under **Settings** > **Collaborators** on GitHub.

Add a PR template so each milestone PR has the same shape. Create `.github/pull_request_template.md`:

```md
## Milestone

<!-- Example: M3. API -->

## What I did

## How to try it

<!-- Commands to run and what the reviewer should see. -->

## Where I got stuck

## Checklist

- [ ] The tests pass on my machine
- [ ] I read my own diff in the **Files changed** tab
- [ ] No leftover `console.log` calls, commented-out code, or secrets
```

Commit it straight to `main`. It's the only commit that skips a PR:

```sh
git add .github
git commit -m "Add pull request template"
git push
```

## One branch and one PR per milestone

Each milestone follows the loop you know from the course, in your capstone repo:

```sh
git switch main
git pull
git switch -c m2-data-model
# build, commit as you go
git push -u origin m2-data-model
gh pr create --fill --reviewer <instructor-username>
```

Name branches `m1-proposal`, `m2-data-model`, and so on. Start each PR title with the milestone, for example `M2: Data model`. Your instructor reviews with the same labels as the course (`fix:`, `question:`, `suggestion:`, `nit:`, `praise:`). Address every `fix:`, then merge your own PR after approval. Add the PR link to `capstone.md` in your course repo.

Each milestone builds on the one before, so you often need code that's still in review. Don't wait. Create the next branch from the branch under review instead of from `main`:

```sh
git switch m2-data-model
git switch -c m3-api
```

Your `m3-api` PR shows both milestones' changes until `m2-data-model` merges. After it merges, bring `main` into the new branch and push. The PR then shows only the new milestone:

```sh
git switch main
git pull
git switch m3-api
git merge main
git push
```

## The milestone plan

A session is one day. The **Job search** column is for the last hour of that day. The job search sections later in this README explain each task.

| Session | Milestone | Branch | Job search |
| --- | --- | --- | --- |
| 1 | M1. Proposal | `m1-proposal` | |
| 2 | M2. Data model | `m2-data-model` | |
| 3-4 | M3. API | `m3-api` | GitHub profile |
| 5-7 | M4. Front end | `m4-front-end` | Resume first draft |
| 8-9 | M5. Auth | `m5-auth` | |
| 10 | M6. Tests | `m6-tests` | Resume review swap |
| 11 | M7. Deploy | `m7-deploy` | |
| 12-13 | M8. Polish | `m8-polish` | Portfolio |
| 14 | M9. Demo | `m9-demo` | Mock interview |
| 15 | Demo day | | Submit `lesson-30` |

If you fall behind, cut scope, not milestones. A deployed app with three user stories passes. An undeployed app with eight doesn't.

### M1. Proposal (session 1)

Write `docs/proposal.md` in your capstone repo:

- The app's name and one sentence that says what it does and for whom
- The problem it solves, in two or three sentences
- Three to five user stories, each in the form "As a guest, I can claim a dish, so nobody else brings the same one"
- A **Later** list of features you won't build in the first version
- The tables and their columns, as a rough list
- A sketch of each page. Paper is fine. Photograph it and commit the image to `docs/`.
- The part you've never built before. That's the risk, and your instructor helps you plan around it.

This PR gets the most important review of the project. Your instructor checks the scope. If they say cut a story, cut it.

Done when the proposal is approved and merged.

### M2. Data model (session 2)

Build what lesson 16 taught:

- A schema or migration file that creates every table, with primary keys, foreign keys, `NOT NULL` and `UNIQUE` where the data requires them, and a `CHECK` for any rule a column must follow
- A seed script with realistic data: real-sounding names, a few users, and enough rows to see a list fill a page
- A diagram in your README. GitHub draws Mermaid diagrams in Markdown:

  ````md
  ```mermaid
  erDiagram
    users ||--o{ events : hosts
    events ||--o{ dishes : has
    users ||--o{ dishes : brings
  ```
  ````

Done when one command creates a fresh database and seeds it.

### M3. API (sessions 3 and 4)

Build what lessons 13, 14, and 17 taught:

- One Express router per resource, with REST routes and the right status codes
- Input validated with `zod`, and errors returned as JSON in one consistent shape
- Queries with parameters (`$1`, `$2`), never strings built from user input
- A `supertest` test for each route's main case and at least one failure case
- A table of endpoints in your README

Hard-code a user id for now, such as `const userId = 1`. M5 replaces it with the logged-in user.

Done when every user story works with `curl` or a test.

### M4. Front end (sessions 5 to 7)

Build what lessons 20 to 23 taught:

- One route per page in your sketch
- Forms that show a message next to the field that's wrong
- A loading state, an error state, and an empty state for every list
- The front end calls your API with `fetch`

Done when every user story works in the browser.

### M5. Auth (sessions 8 and 9)

Build what lessons 24 and 25 taught:

- Sign up, log in, and log out
- Passwords hashed, never stored as written
- Every API route that changes data checks who's logged in. A user who tries to change someone else's data gets a `403` or `404`.
- The front end sends logged-out users to the log-in page
- Remove the hard-coded user id

Done when you can't change another user's data, even by sending the request with `curl`.

### M6. Tests (session 10)

Build what lessons 11 and 26 taught:

- Every API route has a test, including one for a logged-out request and one for another user's data
- One Playwright test that walks through your most important user story in a browser
- A GitHub Actions workflow that runs the tests on every pull request. A starting point for `.github/workflows/test.yml`:

  ```yaml
  name: Tests
  on:
    pull_request:
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
        - run: npm test
  ```

  Change the `run` steps to match your project's folders and scripts.

Done when this PR shows a green check from your workflow.

### M7. Deploy (session 11)

Build what lesson 27 taught:

- The front end, the API, and the database deployed, with secrets in environment variables
- A deploy that runs by itself when `main` changes
- A demo account with seeded data, so visitors can try the app without signing up
- The live URL in your README and in the repo's **About** box on GitHub

Done when a classmate signs in to the live app with the demo account from their phone.

### M8. Polish (sessions 12 and 13)

- **Bug bash.** Send a classmate your live URL. Ask them to use the app for 15 minutes and file an issue in your repo for each problem, the way you did in lesson 29. Fix the important ones. Move the rest to your **Later** list.
- **Accessibility.** Every input has a label. Every button says what it does. You can use the whole app with only the keyboard.
- **Performance.** Run Lighthouse on your main page, as in lesson 28, and fix the top item it reports.
- **Clean up.** Remove `console.log` calls, commented-out code, and unused files.
- **README.** Finish it. The portfolio section below lists what goes in it.

Done when a stranger could open your README, understand the app, try it, and run it on their own computer.

### M9. Demo (session 14)

- Write `docs/demo.md`: your demo script and the three trade-offs you'll talk about. The next section shows how.
- Rehearse the demo out loud at least twice, with a timer.
- Record a two-to-three-minute video of the demo and link it at the top of your README. QuickTime on macOS and the Xbox Game Bar on Windows both record your screen.

Done when the PR merges. On demo day, session 15, you present to the class.

## Present your project and its trade-offs

You get five minutes:

| Time | What you show |
| --- | --- |
| 30 seconds | The problem, and who has it |
| 2 minutes | A live demo of your most important user story, start to finish |
| 1 minute | How it works: the browser, React, your API, and PostgreSQL, and one decision you made |
| 30 seconds | What you'd build next |
| 1 minute | Questions |

Demo with the demo account, on the live site, with data already seeded. Keep the video open in another tab in case the network fails.

### Trade-offs

Every technical decision gives something up. Interviewers ask about trade-offs to see whether you know what yours cost. Use this shape:

> I chose ___ over ___ because ___. It costs ___. I'd change it if ___.

For example:

> I chose a session cookie over a JWT because logging out has to take effect right away, and I only run one server. It costs a database lookup on every request. I'd change it if the API ran on many servers and that lookup got slow.

A trade-off has a real alternative you considered and a real cost. "I chose React because it's popular" has neither. Write three for your app, in `docs/demo.md` and in a **Trade-offs** section of your README. Good places to look are your database design, how you handle auth, where validation happens, and something you cut from the plan.

Practice answering these out loud:

- What was the hardest bug, and how did you find it?
- What would you change if you started again?
- What happens if two users do the same thing at the same moment?
- How would this handle 10,000 users?

"I don't know, but here's how I'd find out" is a good answer to the last one.

## Job search

Do these in the last hour of the sessions the milestone plan names. Each has a checklist in `capstone.md`. Tick each item and add the links.

### GitHub profile (session 3)

Recruiters open your GitHub profile before your resume. Make the first screen say who you are and show your best work.

- Add a photo, your name, a one-line bio, and your city in your profile settings.
- Create a repo named exactly your username. GitHub shows its `README.md` at the top of your profile. Write three to five sentences: what you build, the stack you use, and what kind of role you want. Link your capstone.
- Pin your capstone first, then up to five other repos you're proud of. Each pinned repo needs a description and a README.
- Check that your commits show on your contribution graph. That needs `git config user.email` to match an email on your GitHub account, which you set in lesson 00.

Your course repo is private and belongs to the course organization. Ask your instructor before you make any course work public. Your capstone and your class repo PR from lesson 29 are public already.

### Resume (sessions 5 and 10)

- One page, saved as a PDF named `First-Last-Resume.pdf`
- At the top: name, email, city, and links to your GitHub, LinkedIn, and capstone
- A **Projects** section with the capstone first. If your past jobs weren't in tech, put Projects above Experience.
- Two or three bullets per project, each in the shape "verb, what you built, with what, result":

  > Built a potluck planner where guests claim dishes, using React, Express, and PostgreSQL. Deployed it with CI that runs 40 tests on every pull request.

- Keep your past jobs. Write their bullets about what transfers: working with customers, owning a process, training a new hire.
- List only skills you can talk about for two minutes in an interview.

In session 10, swap resumes with a classmate and review each other's with the comment labels from lesson 29.

### Portfolio (sessions 12 and 13)

Your capstone README is your portfolio's main page. Its first screen has:

- The app's name and one sentence about what it does
- A screenshot or GIF of the main page
- Links to the live app and the demo video
- The demo account's email and password

Below that:

- **Features**: what a user can do
- **Tech stack**: what you used, and where each piece runs
- **Run it locally**: the commands, from clone to running app
- **Trade-offs**: your three, from the demo
- **What's next**: your **Later** list

### Interview prep (session 14)

- Write a 60-second answer to "Tell me about yourself", and say it out loud until you can do it without reading.
- Prepare a two-minute walkthrough of your capstone. It's your demo without the screen.
- Write three stories in the STAR shape (situation, task, action, result). Good sources from this course: a hard bug you fixed, review feedback you acted on, and your class repo PR from lesson 29.
- Explain these without notes: what happens when you type a URL into a browser (lesson 02), how your app's login works (lesson 24), and how you'd find a slow query (lesson 28).
- Do a 45-minute mock interview with a classmate: 15 minutes of questions about you and your project, then 30 minutes of a small coding problem like the ones in lessons 06 to 08, with them watching. Swap roles. Write down one thing to improve.
- Prepare three questions to ask an interviewer, such as "What does a new developer's first month look like?"

## Grading rubric

Your instructor grades the capstone on these rows. It passes when every row is at least **Meets**. **Strong** is what makes the project stand out to employers.

| Criterion | Not yet | Meets | Strong |
| --- | --- | --- | --- |
| Scope | A user story doesn't work, or the app is the library app | Every story in the approved proposal works on the live site | One item from the **Later** list also works |
| Data model | Missing foreign keys, or data the app needs isn't constrained | Keys, foreign keys, `NOT NULL`, and `UNIQUE` where the data needs them. One command creates and seeds the database. | A diagram in the README, and an index for a query the app runs often |
| API | Wrong status codes, or invalid input crashes the server | REST routes, right status codes, validated input, one JSON error shape, parameterized queries | An endpoint table in the README that matches the code |
| Front end | A page has no loading or error state, or a form fails silently | Loading, error, and empty states. Form errors next to the field. | Works on a phone and with only the keyboard |
| Auth and security | A user can read or change another user's data | Hashed passwords, protected routes, ownership checks, no secrets in the repo | Tests prove a user can't touch another user's data |
| Tests and CI | Tests are missing for some routes, or CI is red | Every route tested, one Playwright test for the main story, CI green on every PR from M6 on | Tests arrive with each feature from M3 on, not only in M6 |
| Deploy | No live URL, or it's broken | Live URL and demo account work. `main` deploys by itself. | |
| Git and review | Milestones mixed into one PR, or a `fix:` merged without a change or reply | One PR per milestone, template filled, every `fix:` answered before merging | Small commits with messages a reviewer can follow |
| README | A stranger can't tell what the app does or how to run it | Every item in the portfolio section | A GIF, and setup that works on the first try |
| Demo | Over time, or no live demo | Five minutes, a live demo, three trade-offs that each name an alternative and a cost | Answers questions with specifics from the code |
| Job search | A checklist in `capstone.md` is incomplete | Every checklist ticked, with links | |

## Exercises

1. **Capstone.** A full-stack app you design, shipped over three weeks with one PR per milestone. Fill in `capstone.md` as each milestone merges.

### Stretch goals

These don't count toward the grade, but each one gives you something to talk about in interviews.

- Build an item from your **Later** list after the course, as a PR with the same template.
- Add a custom domain to your live app.
- Ask someone who isn't a developer to use your app while you watch without helping. Write down where they got stuck, and file an issue for each.

## Submit

On demo day, finish `capstone.md`. Commit it, push the branch, and open a pull request in your course repo:

```sh
git add lessons/30-capstone
git commit -m "Complete lesson 30 capstone"
git push -u origin lesson-30
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things:

- Each of the nine milestones has its own merged PR in your capstone repo, with every `fix:` comment answered before the merge
- The live URL works, and the demo account signs in
- Your capstone README lets a stranger understand the app, try it, and run it locally
- Each trade-off names a real alternative and a real cost
- Every job search checklist in `capstone.md` is ticked and linked
