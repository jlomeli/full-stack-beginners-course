# 22. Forms and data fetching

In this lesson you build the library app's books page in React. It loads the books from an API, shows a loading message and errors, and has a form that checks its input before it adds a new book. You also write your own component tests.

## What you will be able to do

- Build controlled forms with validation messages
- Fetch from your own API with loading and error states
- Test components with Testing Library

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-22
```

Run the tests for this lesson:

```sh
npm test 22
```

You see 26 failing tests. Your job this lesson is to make them pass.

## The app you're building

The library API from earlier lessons stores books like this:

```js
{ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 }
```

This lesson ships its own copy of that API in `server.js`, with two routes:

| Request | Response |
| --- | --- |
| `GET /api/books` | `200` and an array of books |
| `POST /api/books` with a JSON body `{ title, author, year }` | `201` and the new book, or `400` and `{ error: 'a message' }` |

You write three pieces, each in its own file:

1. `validateBook`, a plain function that checks what the user typed.
2. `<BookForm>`, a form that uses `validateBook` and hands a valid book to its parent.
3. `<BooksPage>`, which loads the books, shows them, and saves new ones.

The tests don't need the server. They replace `fetch` with a fake, so they run fast and never touch the network. To see the page in a browser, open two terminals:

```sh
node lessons/22-react-forms-and-data/server.js
```

```sh
npx vite lessons/22-react-forms-and-data
```

Open http://localhost:5173. Vite serves `index.html` and `main.jsx` from this folder, and forwards every `/api` request to the server on port 3000 (see `vite.config.js`). Until you finish exercise 3, the page shows only the heading.

## Controlled inputs

In lesson 21 you kept data in state with `useState`. A controlled input keeps its value in state too. React owns the value, and the input shows whatever state says:

```jsx
function TitleInput() {
	const [title, setTitle] = useState('');
	return (
		<label>
			Title <input value={title} onChange={(event) => setTitle(event.target.value)} />
		</label>
	);
}
```

Every keystroke calls `onChange`, which updates state, which re-renders the input with the new value. Because the value lives in state, you can read it, check it, or clear it with `setTitle('')`.

Wrap each input in a `<label>`. Screen readers read the label when the input gets focus, and clicking the label focuses the input. The tests find inputs by their label text, so an input without a label fails them.

A form with three inputs can keep one object in state instead of three variables. Give each input a `name`, and use it to update the matching key:

```jsx
const [values, setValues] = useState({ title: '', author: '', year: '' });

function handleChange(event) {
	setValues({ ...values, [event.target.name]: event.target.value });
}

<input name="author" value={values.author} onChange={handleChange} />
```

`[event.target.name]` is a computed key. When the author input changes, it builds `{ ...values, author: 'what they typed' }`.

Every input value is a string, even in the year field. `'1979'` is not `1979`. Convert it with `Number(values.year)` when you send it.

## Validation messages

Write the rules as a plain function that takes the form's values and returns the problems. That's exercise 1:

```js
validateBook({ title: '', author: 'Ann', year: 'soon' });
// { title: 'Title is required', year: 'Year must be a whole number' }
```

You can test a plain function on its own, without rendering anything. The component calls it and shows the messages.

Don't keep the messages in their own state. They are always the result of `validateBook(values)`, so compute them while rendering:

```jsx
const [submitted, setSubmitted] = useState(false);
const errors = submitted ? validateBook(values) : {};
```

Nobody wants "Title is required" before they've typed anything. The `submitted` flag hides the messages until the first submit. After that, `errors` is recomputed on every render, so a message disappears as soon as the user fixes the field. You never update two pieces of state and hope they agree.

Show a message next to its field only when there is one:

```jsx
{errors.title && <span>{errors.title}</span>}
```

## Submitting the form

A form's `submit` event fires when the user clicks a `type="submit"` button or presses Enter in an input. By default the browser then reloads the page. Stop that with `event.preventDefault()`:

```jsx
async function handleSubmit(event) {
	event.preventDefault();
	setSubmitted(true);
	if (Object.keys(validateBook(values)).length > 0) return;
	// the values are valid: hand them to the parent
}

<form onSubmit={handleSubmit} noValidate>
```

`noValidate` turns off the browser's own pop-up checks so your messages are the only ones the user sees.

The form doesn't know about the API. It calls an `onSubmit` prop and lets its parent decide what saving means. Saving takes time, and it can fail, so `onSubmit` returns a promise. `await` it inside `try...catch`:

```jsx
setSaving(true);
try {
	await onSubmit(book);
	setValues({ title: '', author: '', year: '' });
} catch (error) {
	setSaveError(error.message);
} finally {
	setSaving(false);
}
```

`finally` runs whether the `await` succeeded or threw, so the button always comes back. While `saving` is true, disable the button with `disabled={saving}`. That stops a double click from adding the same book twice.

## Fetching data in an effect

In lesson 21 you learned that effects are for syncing with something outside React. A server is outside React, so loading data when the page appears is a job for `useEffect`.

A request is in one of three states: loading, failed, or done with the data. Model that as one object in state, not three booleans that can disagree:

```jsx
const [request, setRequest] = useState({ status: 'loading' });
// later: { status: 'error' }
// or:    { status: 'ready', books: [...] }
```

With booleans, nothing stops `isLoading` and `hasError` from both being true. With one `status`, the page is always in exactly one state, and you render one branch for each:

```jsx
if (request.status === 'loading') return <p>Loading books...</p>;
if (request.status === 'error') return <p>Could not load books.</p>;
return <ul>{request.books.map((book) => <li key={book.id}>{book.title}</li>)}</ul>;
```

Here's the effect that fills it in:

```jsx
useEffect(() => {
	let ignore = false;
	loadBooks().then(
		(books) => {
			if (!ignore) setRequest({ status: 'ready', books });
		},
		() => {
			if (!ignore) setRequest({ status: 'error' });
		},
	);
	return () => {
		ignore = true;
	};
}, []);
```

The cleanup function sets `ignore`. If the component goes away, or the effect runs again, before the response arrives, the old response is dropped instead of overwriting newer state. React's development mode runs every effect twice on purpose to catch a missing cleanup. Open the Network tab in your browser and you see two requests. That's expected.

`fetch` only rejects when the request never reaches the server, such as when you're offline. A `500` or `404` response resolves normally. Check `response.ok` yourself:

```js
async function loadBooks() {
	const response = await fetch('/api/books');
	if (!response.ok) throw new Error(`GET /api/books failed with status ${response.status}`);
	return response.json();
}
```

Now both kinds of failure land in the same error branch.

To retry, the effect has to run again. An effect runs again when a value in its dependency array changes. Keep an `attempt` counter in state, list it in the array, and add one to it when the user clicks **Try again**.

Read [Fetching data with effects](https://react.dev/learn/synchronizing-with-effects#fetching-data) for more.

## Sending data with fetch

To create a book, send a `POST` with a JSON body. Without the `Content-Type` header, Express's `express.json()` ignores the body:

```js
const response = await fetch('/api/books', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(book),
});
const body = await response.json();
if (!response.ok) throw new Error(body.error);
```

Throwing with the API's message is how the error reaches `<BookForm>`: its `catch` shows `error.message`.

When the save succeeds, the response is the new book with its `id`. Add it to the list in state. Don't fetch the whole list again. Pass a function to the setter so you build on the latest state:

```jsx
setRequest((current) => ({ status: 'ready', books: [...current.books, newBook] }));
```

## Testing components with Testing Library

Testing Library renders a component into a fake browser page (jsdom) and lets you use it the way a person would: find things by what they say, then click and type. A test file for components starts like this:

```jsx
// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from './02-book-form.jsx';

afterEach(cleanup);
```

The first line gives the file a browser-like `document`. `cleanup` removes what each test rendered so the next test starts from an empty page.

A test has three steps. Render, act, and check what the user sees:

```jsx
test('shows a message when the title is missing', async () => {
	const user = userEvent.setup();
	render(<BookForm onSubmit={() => {}} />);

	await user.click(screen.getByRole('button', { name: 'Add book' }));

	expect(screen.getByText('Title is required')).toBeTruthy();
});
```

Find elements the way a user would:

| Query | Finds |
| --- | --- |
| `screen.getByLabelText('Title')` | the input labelled "Title" |
| `screen.getByRole('button', { name: 'Add book' })` | a button by its text |
| `screen.getByText('No books yet.')` | any element with that text |
| `screen.queryByText('...')` | the same, but returns `null` instead of throwing, for checking that something is gone |
| `await screen.findByText('...')` | waits until the text appears, for anything that happens after a promise |

`user.type(input, 'Kindred')` types one key at a time, and `user.click(button)` clicks. Both return promises, so `await` them.

To check what a component passed to a callback, use a mock function. `vi.fn()` records every call:

```jsx
const onSubmit = vi.fn();
render(<BookForm onSubmit={onSubmit} />);
// ...fill in and submit...
expect(onSubmit).toHaveBeenCalledWith({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
```

Tests never use the network. `03-books-page.test.jsx` replaces the global `fetch` with a fake API using `vi.stubGlobal('fetch', ...)`. Read its `beforeEach` to see how. Each test says what the fake answers, then checks what the page shows and what it sent.

Read [Testing Library's guide to queries](https://testing-library.com/docs/queries/about) for more.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Read the matching `.test.js` or `.test.jsx` file too. The tests are the exact spec.

1. `01-validate-book.js` checks the title, author, and year and returns a message for each problem.
2. `02-book-form.jsx` is the add-book form: controlled inputs, validation messages, and a saving state.
3. `03-books-page.jsx` loads the books with loading and error states, and adds new books through the API.
4. `04-your-tests.test.jsx` has two tests with names but no bodies. Write them. Each one fails until you replace its `expect.fail` line.

Do them in order. Each one builds on the one before. Run `npm test 22` after each change. When every test passes, run the app in the browser and add a book.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a fourth field, "Copies", that must be a whole number of at least 1.
- Move the cursor to the first invalid input after a failed submit. Look up `useRef` and `focus()`.
- Connect each message to its input with `aria-describedby`, and check the result with your browser's accessibility inspector.
- Write a test for `<BooksPage>` that checks the Try again button disappears while the books reload.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/22-react-forms-and-data
git commit -m "Complete lesson 22 exercises"
git push -u origin lesson-22
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Validation messages are computed from the form values, not copied into their own state
- One `status` value describes the request, not separate `isLoading` and `hasError` booleans
- The effect has a cleanup function, and the retry works by changing a dependency
- Your two tests in `04-your-tests.test.jsx` find elements by label, role, or text, and check what the user sees
