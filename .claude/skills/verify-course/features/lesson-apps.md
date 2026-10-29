# Run a lesson's API or page by hand

Lessons tell students to run an app and try it with curl or a browser. Drive these with the reference solution applied (`app.sh overlay NN`), because the starters are TODO stubs.

## Sub-features

| Lesson | Command (run from the overlay `$W`) | Ready URL |
| --- | --- | --- |
| 13, 14 Notes API | `node $W/lessons/13-express/server.js` | `/notes` |
| 17 Notes on Postgres | `node $W/lessons/17-node-and-postgres/server.js notes` | `/notes` |
| 17 Library API | `node $W/lessons/17-node-and-postgres/server.js library` | `/books` |
| 24 Auth API | `node $W/lessons/24-authentication/server.js` | `/books` |
| 25 Vulnerable app | `node $W/lessons/25-web-security/server.js` | `/books` |
| 26 Full-stack app API | `node $W/lessons/26-testing-the-stack/project/server/dev.js` | `/api/books` |
| 28 Sample app | `node $W/lessons/28-debugging-production/exercises/server.js` | `/api/members/1/loans/open` |
| 09, 20, 21 pages | `npx vite $W/lessons/NN-slug --port 53NN --strictPort` | `/` |
| 22, 23, 26 pages | `npx vite $W/lessons/NN-... --port 53NN --strictPort` plus the API on port 3000 | `/` |

## How to get to it (user POV)

The README's "try it" sections. Students run the same `node` or `npx vite` command from the course root and use curl or a browser.

## Driving it with app.sh and curl

Library API, lesson 17 (proved end to end when this skill was written):

```sh
A=.claude/skills/verify-course/app.sh; E=/tmp/verify-course/evidence
W=$($A overlay 17)
$A start lib17 3417 http://localhost:3417/books -- node "$W/lessons/17-node-and-postgres/server.js" library
curl -s localhost:3417/books                                                    # 3 seeded books, all "available":true
curl -s -i -X POST localhost:3417/loans -H 'content-type: application/json' -d '{"bookId":1,"memberId":1}' | tee $E/lib17-borrow.txt        # 201 and the loan
curl -s -i -X POST localhost:3417/loans -H 'content-type: application/json' -d '{"bookId":1,"memberId":1}' | tee $E/lib17-borrow-again.txt  # 409 "That book is already on loan"
curl -s 'localhost:3417/books?available=false' | tee $E/lib17-unavailable.json  # Kindred, "available":false
$A stop
```

Page, lesson 20: `$A start page20 5320 http://localhost:5320/ -- npx vite "$W/lessons/20-react-components" --port 5320 --strictPort`. `curl -s localhost:5320/` returns `<title>Products</title>`. Drive the UI with your browser tool if you have one. Otherwise run the lesson's Vitest suite on the overlay as the behavior proof.

## Gotchas

- Lessons 22 and 23 hard-code port 3000 for their API, so `PORT` doesn't move them.
- Lesson 25's app is vulnerable on purpose in the starter. Its overlay is the fixed version. To show an exploit, run the starter: `node lessons/25-web-security/server.js`.
- Lesson 17 stores data in `.data/` next to `server.js`. The overlay keeps that inside the scratch copy, so each overlay starts from the seed.
- Lesson 26's seeded log-in is in `server/dev.js`. Read the email and password there.
