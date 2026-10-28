# 23. Routing and app structure

In this lesson you build the library app's pages: a books list, a detail page for each book, and an edit page. You write the router yourself from the browser's history API, so you know what React Router does for you later.

## What you will be able to do

- Add client-side routes
- Organize a growing React codebase by feature
- Share state across routes

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-23
```

Run the tests for this lesson:

```sh
npm test 23
```

You see 65 failing tests. Your job this lesson is to make them pass.

## The app you're building

The app has three pages, and each one has its own address:

| Address | Page |
| --- | --- |
| `/` | The list of books. Each title links to its detail page. |
| `/books/2` | The detail page for the book with id 2, with an **Edit** link. |
| `/books/2/edit` | A form filled in with the book. Saving returns to the detail page. |

You write four pieces, one per exercise file:

1. `matchPath`, a plain function that decides whether a path fits a pattern like `/books/:id`.
2. `<Router>`, `<Link>`, `useNavigate`, and `useParams`: a small router.
3. `<BooksProvider>` and `useBooks`: the books, loaded once and shared by every page.
4. The three pages and `<App>`, which ties them together.

This lesson ships finished copies of `BookForm` and `validateBook` from lesson 22 in `exercises/`. The edit page reuses them. You don't change those files.

The tests replace `fetch` with a fake, so they never touch the network. To see the app in a browser, open two terminals:

```sh
node lessons/23-react-routing/server.js
```

```sh
npx vite lessons/23-react-routing
```

Open http://localhost:5173. Vite answers every unknown address with `index.html`, so you can open http://localhost:5173/books/2 directly. A plain file server would answer that with "404 Not Found". Every real deployment of a routed React app needs the same setting. Until you finish exercise 4, the page is blank.

## Why the address matters

Without routes, a React app has one address. You can't bookmark the third book, send a friend a link to it, or use the browser's back button. The address is state too, and the user can see it and share it.

The trouble is that a normal link makes the browser ask the server for a new page. In a React app there is only one page, `index.html`, and React draws everything else. You want a link that changes the address and lets React redraw, without a new request.

The browser has an API for exactly that, the [history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

```js
history.pushState(null, '', '/books/2'); // changes the address bar and adds a history entry. No request.
history.replaceState(null, '', '/books/3'); // changes the address bar and replaces the current entry.
```

Try it. Open any page, open the console, and run the first line. The address bar changes and nothing reloads. Press the browser's back button and the address changes back.

`pushState` doesn't tell React anything. And when the user presses back or forward, the browser changes the address and fires a `popstate` event on `window`, again without telling React. A router does three jobs:

1. Reads the address and decides which page to draw.
2. Changes the address when the user clicks a link, and draws the new page.
3. Listens for `popstate`, so back and forward work.

## Matching a path to a pattern

Routes are patterns: `/books/:id` matches `/books/2` and `/books/17`. The part that starts with a colon is a parameter. The router needs to know whether a path fits, and what the parameter's value is:

```js
matchPath('/books/:id', '/books/2');       // { id: '2' }
matchPath('/books/:id', '/authors/2');     // null
```

Split both strings on `/`, compare segment by segment, and collect the segments that start with `:`:

```js
'/books/2'.split('/'); // ['', 'books', '2']
```

The empty string at the front comes from the leading slash. `.filter((segment) => segment !== '')` removes it and the empty piece a trailing slash leaves behind.

The value comes out of the URL, so it's always a string. `'2'` is not `2`. You compare it with a book's numeric id later, so convert it there with `Number(id)`.

That's exercise 1. Read `01-match-path.test.js` first. It lists every case.

## A router in a few dozen lines

`<Router>` keeps the current path in state. When the path changes, React redraws:

```jsx
const [pathname, setPathname] = useState(window.location.pathname);
```

The router finds the first route that matches and draws its `element`:

```jsx
<Router
  routes={[
    { path: '/', element: <BooksListPage /> },
    { path: '/books/:id', element: <BookDetailPage /> },
  ]}
/>
```

Order matters. The first match wins, so put specific paths before general ones.

Two kinds of events change the path. A `navigate` function calls `pushState` and then `setPathname`. The `popstate` event, from back and forward, calls `setPathname` with whatever the address now is. Subscribing to an outside event is a job for an effect, with a cleanup that unsubscribes:

```jsx
useEffect(() => {
  const syncWithUrl = () => setPathname(window.location.pathname);
  window.addEventListener('popstate', syncWithUrl);
  return () => window.removeEventListener('popstate', syncWithUrl);
}, []);
```

### Getting `navigate` and the parameters to the page

The page that draws is deep inside the router, and it's the page that needs `navigate` and the `:id`. Passing them down through every component is tedious. React's **context** puts a value where any component below can read it without props:

```jsx
const RouterContext = createContext(null);

// in Router
return <RouterContext value={{ navigate, params }}>{page}</RouterContext>;

// in a hook
const context = useContext(RouterContext);
```

`useNavigate()` and `useParams()` are two small hooks that read the context. When `useContext` returns `null`, the component is outside a router. Throw an error with a clear message instead of letting `null.navigate` crash somewhere confusing. The tests check the exact message.

### Links

Use a real `<a href>`. It works when JavaScript fails, it can be opened in a new tab, and screen readers announce it as a link. Intercept the click and navigate yourself:

```jsx
function handleClick(event) {
  event.preventDefault(); // stop the browser from requesting a new page
  navigate(to);
}
```

One catch. Ctrl-click and Cmd-click mean "open in a new tab", and middle-click does the same. If you call `preventDefault` on those, you break behavior people rely on. Intercept only a plain left click: `event.button === 0` with none of `metaKey`, `ctrlKey`, `shiftKey`, or `altKey` held.

That's exercise 2. In a real project, you don't write this. You install React Router, and the code looks almost the same:

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<BooksListPage />} />
    <Route path="/books/:id" element={<BookDetailPage />} />
  </Routes>
</BrowserRouter>
```

React Router isn't installed in this course repo, so the tests use yours. Read [the React Router tutorial](https://reactrouter.com/start/library/installation) for what it adds: nested routes, loaders, redirects, and search parameters.

## Sharing state across routes

Suppose each page fetched its own books. Clicking a title would show "Loading..." for a moment, even though the list already has that book. Editing a book on one page would leave the list stale until it fetched again.

Pages come and go as the address changes, and each page's state goes with it. State that several pages need lives above the router, where it survives navigation. You already know the tool, context:

```jsx
<BooksProvider>
  <Router routes={routes} />
</BooksProvider>
```

`BooksProvider` fetches the books once, keeps them in state, and puts `{ status, books, updateBook }` in context. Any page calls `useBooks()`. This is the shape of exercise 3. The request state is the `status` object you built in lesson 22: `'loading'`, `'error'`, or `'ready'`.

Keep the selected book out of that state. Which book the user is looking at is already in the address. The page reads `:id` from `useParams()` and looks the book up in the list:

```jsx
const { id } = useParams();
const { books } = useBooks();
const book = books.find((candidate) => candidate.id === Number(id));
```

If you copied it into state too, you would have two copies that can disagree, and a link to `/books/2` would show the wrong book. One source of truth, the address, means a shared link always works.

After the list loads, there may be no book with that id. Show "Book not found." and a way back. A page that crashes on `book.title` when `book` is `undefined` is a bug.

## Building the pages

Exercise 4 is mostly what you already know, assembled:

- `BooksListPage` maps the books to `<Link>`s.
- `BookDetailPage` shows one book.
- `BookEditPage` renders `<BookForm initialValues={book} ... />`. The form's `onSubmit` calls `updateBook`, then `navigate`s to the detail page. If `updateBook` throws, the `navigate` line never runs, and `BookForm` shows the message.

All three pages show the same loading and error messages. Write that part once, as a small component or a helper, and use it three times.

Save, and the list shows the new title without any request. `updateBook` replaced the book in the shared state, so every page sees the change.

## Organizing a codebase by feature

This lesson's folder is flat, with numbered files. A real app isn't. Suppose you grouped files by what they are:

```
src/
  components/   BookForm.jsx  MemberCard.jsx  Button.jsx
  pages/        BooksListPage.jsx  MembersListPage.jsx
  hooks/        useBooks.js  useMembers.js
  utils/        validateBook.js  formatDate.js
```

To change how books work, you open four folders. As the app grows, each folder grows to dozens of files, and nobody can tell which belong together.

Group by feature instead. Everything about books lives together:

```
src/
  app/
    App.jsx            the providers and the routes
  features/
    books/
      BooksListPage.jsx
      BookDetailPage.jsx
      BookEditPage.jsx
      BookForm.jsx
      validate-book.js
      books-store.jsx
      index.js         what the rest of the app may use
    members/
      ...
  shared/
    Button.jsx         used by more than one feature
    router/
```

Three rules keep it tidy:

- A file lives with the feature that uses it. Move it to `shared/` only when a second feature needs it.
- `shared/` and a feature may be imported by `app/`. A feature never imports another feature's internals. If members need a book title, import it from `features/books/index.js`, which lists what the books feature offers the rest of the app.
- Imports point one way: `app` can import features, features can import `shared`, and `shared` imports nothing from features.

In exercise 5 you apply these rules to a bigger app. It needs no code. You write your answers in a Markdown file.

## Testing routed pages

Tests for routed code set the address first, then render:

```jsx
window.history.replaceState(null, '', '/books/2');
render(<App />);
```

`replaceState` sets the address without adding a history entry. The tests reset it to `/` before each test so pages don't leak into one another. The tests also click links and call `window.history.back()` to check that navigation and the back button work. Read `04-library-app.test.jsx` to see the whole flow.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Read the matching test file too. The tests are the exact spec.

1. `01-match-path.js` matches a path against a pattern and returns its parameters.
2. `02-router.jsx` is the router: `Router`, `Link`, `useNavigate`, and `useParams`.
3. `03-books-store.jsx` loads the books once and shares them, with `updateBook`.
4. `04-library-app.jsx` has the three pages and `App`.
5. `05-feature-folders.md` asks how you would organize a bigger app. You answer in the file. There are no tests, and your reviewer reads it.

Do them in order. Each one builds on the one before. Run `npm test 23` after each change. When every test passes, run the app in the browser, open a book, edit it, and press the back button.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a `/books/new` route with a form that adds a book. Put it before `/books/:id`. What happens if you put it after?
- Make `Link` take a `className` prop, then highlight the link that points at the current address.
- Keep the search text of a books filter in the query string, such as `/?q=dune`, and read it with `new URLSearchParams(window.location.search)`.
- Move your files into the feature layout from exercise 5 and fix the imports.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/23-react-routing
git commit -m "Complete lesson 23 exercises"
git push -u origin lesson-23
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- The router's `popstate` listener is removed in the effect's cleanup
- `Link` is a real `<a href>` and leaves modified clicks to the browser
- The selected book comes from the address through `useParams`, not from a copy in state
- The pages never crash when the book is missing or the books haven't loaded
- Your answers in `05-feature-folders.md` keep each feature's files together and say which direction imports may go
