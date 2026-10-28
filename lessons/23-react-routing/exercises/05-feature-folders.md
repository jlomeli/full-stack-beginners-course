<!--
Exercise 5. Answer in this file. No code and no tests: your reviewer reads it.

The library app is about to grow. Alongside books, it needs members and loans:

  /                    the books list
  /books/:id           a book's detail page
  /books/:id/edit      edit a book
  /members             the members list
  /members/:id         a member's page, with the books they have on loan
  /loans/new           borrow a book: pick a member and a book
  /login               log in
-->

# How I would organize the library app

## 1. Folder tree

Draw the `src/` folder for the app above. Put every file you can think of in it: pages, forms, shared state, the router, the API calls, small helpers. Use a code block like this:

```
src/
  ...
```

## 2. Where does each of these go, and why?

Answer in one sentence each.

- `BookForm`
- `MembersListPage`
- The function that calls `GET /api/books`
- A `Button` component that every page uses
- The `validateBook` function
- The list of routes

## 3. A rule for imports

Write one rule that says which folders may import from which. For example: "a feature may import from `shared/` but never from another feature". Then name one import in your tree that the rule forbids, and say how you would remove it.

## 4. What did you leave out?

Name one thing you were unsure where to put, and what you decided.
