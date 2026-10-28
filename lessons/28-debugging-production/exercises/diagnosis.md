# Diagnosis

Fill in every section in your own words. Paste real evidence: the output you saw, not a description of it. Your reviewer reads this file. Tests prove each fix works, and this file proves you understood why.

## Bug 1: the slow open-loans query

**Symptom** (what a user or a dashboard would notice):

**Evidence before the fix.** Paste the `EXPLAIN (ANALYZE)` output for `OPEN_LOANS_FOR_MEMBER_SQL` with member 10, from before you added the index:

```
```

**What the plan told me** (which node is the problem, how many rows it read, how many it returned):

**Root cause:**

**Fix** (paste your `01-indexes.sql`):

```sql
```

**Evidence after the fix.** Paste the `EXPLAIN (ANALYZE)` output again:

```
```

**Cost of the fix** (an index speeds up reads and slows down writes and uses disk. When would this index not be worth it?):

## Bug 2: the due date that depends on the timezone

**Symptom:**

**How I reproduced it** (the exact command or input, including the timezone):

**Evidence.** Paste the failing test output, or a `node -e` line and its result, that shows the wrong date:

```
```

**Root cause** (name the exact methods that behave differently by timezone):

**Fix:**

**Why the test runs in four timezones and not one:**

## Bug 3: the receipt that crashes the server

**Symptom:**

**Evidence.** Paste the crash from the terminal where `server.js` was running. Include the stack trace:

```
```

**Reading the stack trace.** Which file and line threw the error? Which file started the work that led to it? Why does the trace not mention the route handler?

**Root cause** (why did one failed email stop every other request too?):

**Fix:**

**What should the user see, and what should the log say, when a receipt fails?**

## Lighthouse report

Run Lighthouse on your deployed library app from lesson 27 (or the Vite preview of Project 4 if you did not deploy), using the steps in the lesson. Use a private window with extensions off.

- URL tested:
- Device mode (mobile or desktop):
- Scores: Performance ___ Accessibility ___ Best practices ___ SEO ___
- Largest Contentful Paint (seconds):
- Cumulative Layout Shift:
- Total Blocking Time (ms):

**Two opportunities Lighthouse listed, and which one you would fix first and why:**

**One change I made, with the scores before and after** (re-run at least three times and say how much the numbers moved between runs):

## Prevention

For each bug, one change to the process (a test, a lint rule, a monitor, a review checklist item) that would have caught it before users did:

1. Slow query:
2. Timezone:
3. Unhandled rejection:
