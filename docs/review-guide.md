# Review guide

The rubric and comment conventions for reviewing student PRs.

## Rubric

Each lesson README ends with a **Review focus** list. Review against that list plus these course-wide criteria.

| Criterion | Approve when | Request changes when |
| --- | --- | --- |
| Works | Lesson checks pass. Untested exercises do what the README asks. | A check fails, or an exercise is missing. |
| Readable | Names say what values are. Functions do one thing. | A reader must run the code to understand it. |
| Idiomatic | Uses the constructs the lesson taught. | Uses a pattern the lesson warned against, such as `==` in lesson 06. |
| Clean | No leftover debug output, commented-out code, or unrelated files. | Any of those are present. |
| Git | Commits have messages that say what changed. The PR touches only this lesson. | The PR includes another lesson's files. |

## Comment labels

Start each comment with a label so the student knows what to do with it.

| Label | Meaning | Blocks approval |
| --- | --- | --- |
| `fix:` | Must change before approval. | Yes |
| `question:` | Explain your reasoning in a reply. | Only if the answer shows a bug |
| `suggestion:` | A better way. Take it or leave it. | No |
| `nit:` | Style or polish. | No |
| `praise:` | Something done well. Use it at least once per review. | No |

## Saved replies

GitHub lets you save comment text for reuse, under **Settings** > **Saved replies** in your account. These save the most time:

- `fix: this name doesn't say what the value is. What would you call it if you were explaining it to a classmate?`
- `fix: remove this console.log before merging.`
- `question: what happens when this input is empty?`
- `fix: the checks are failing. Click Details next to Lesson checks to see which test, then re-request review once it passes.`
- `praise: clear and simple. This is how I'd write it.`

## Approving with nits

Approve a PR that has only `suggestion:` and `nit:` comments. Requesting changes for polish teaches students that review is a gate, not a conversation. They'll learn from the comments either way.

## Turnaround

Aim to review within two working days. A student waiting on review can still start the next lesson from `main`, so a slow review delays feedback but doesn't block progress.
