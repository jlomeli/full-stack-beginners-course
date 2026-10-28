# Lesson 29 setup for instructors

Do this a few days before the cohort reaches lesson 29. It sets up the review pairings and the class repo. Students read this file too, so it holds nothing private.

## 1. Pair reviewers

Each student gets read access to the course repos of the next two students on the roster, so everyone gives two reviews and receives two. Read access lets a student see the code, check out PRs, and comment. It doesn't let them push. Run this from the course repo, with at least three students in `roster.csv`:

```sh
ORG=my-bootcamp
students=( $(tail -n +2 roster.csv | cut -d, -f1 | tr -d ' \r' | tr '[:upper:]' '[:lower:]') )
n=${#students[@]}
for i in "${!students[@]}"; do
  reviewer=${students[$i]}
  for step in 1 2; do
    author=${students[$(( (i + step) % n ))]}
    echo "$reviewer reviews $author"
    gh api --silent -X PUT "repos/$ORG/fullstack-$author/collaborators/$reviewer" -f permission=pull
  done
done
```

Post the printed pairings in class chat. Each student receives two invitation emails.

At the end of the week, remove the access. Run the same loop with the `gh api` line replaced by:

```sh
gh api --silent -X DELETE "repos/$ORG/fullstack-$author/collaborators/$reviewer"
```

Read access shows a classmate's solutions for every lesson so far. By week 8 that's a fair trade for real review practice. If it isn't for your cohort, run the setup loop on the morning of lesson 29 and the removal loop that evening.

## 2. Create the class repo

1. Create a public repo in the organization, `<org>/class-project`. Public means students fork it without changing any organization settings, and the merged PRs count as open-source contributions on their GitHub profiles.
2. Seed it with a small working app that has a README, a `npm test` script, and passing tests. The library app from the lesson 26 project, built from your reference solution, works well because students already know its domain but didn't write this version of it. Don't push anything from the solutions repo that a later cohort could copy for a graded lesson.
3. Add a workflow in `.github/workflows/test.yml` that runs `npm ci` and `npm test` on every pull request.
4. Under **Settings** > **Actions** > **General**, set **Approval for running fork pull request workflows from contributors** to **Require approval for first-time contributors who are new to GitHub**. Otherwise you approve every student's first CI run by hand.
5. Under **Settings** > **Rules** > **Rulesets**, add a branch ruleset for `main` that requires a pull request with one approval and requires the test workflow to pass.

Students have no write access, so they fork. If you'd rather teach the branch flow used at most jobs, give the students' team **Write** access instead and tell them to clone and push branches. The lesson README covers both.

## 3. Write the issues

Write one `good first issue` per student plus three or four spares, and a few harder issues without the label for students who finish early. GitHub creates the `good first issue`, `bug`, `enhancement`, and `documentation` labels on every new repo.

Each issue is the model students copy when they file their own, so write each one with:

- A title that says what's wrong or what's wanted
- Steps to reproduce and expected versus actual, for a bug
- A "Done when" checklist, for a feature
- A hint naming the file or function to start from

Create them from the terminal:

```sh
gh issue create --repo "$ORG/class-project" --label "good first issue" --label bug \
  --title "Book search misses titles with different capital letters" \
  --body-file issue-14.md
```

Plan two or three pairs of issues that touch the same lines. When one PR of a pair merges, the other gets a real conflict to resolve. For the library app:

| Issue | Overlaps with |
| --- | --- |
| Book search misses titles with different capital letters | Book search fails when the query has spaces around it |
| Book list isn't sorted by title | Book list shows books with a `year` in the future |
| Member sign-up accepts an email with spaces | Member sign-up error says "Invalid input" instead of which field |

More ideas that don't overlap:

- `GET /books/:id` returns 500 instead of 404 for an id that doesn't exist
- The book list shows nothing at all when it's empty instead of "No books yet"
- Returning a book that's already returned succeeds instead of returning 409
- The README skips the step that creates the database
- There's no test for borrowing a book that's on loan
- The "Borrow" button has no accessible name on the book card
- Every page has the same `<title>`

## 4. During the lesson

- Assign each issue as soon as a student claims it in a comment, so two students don't take the same one.
- Review and merge class repo PRs quickly and in the order they're approved. Merging is what creates the conflicts students practice on.
- Students submit lesson 29 once their class repo PR has had one review round, even if it hasn't merged. Check the team log's links, not the merge status.
