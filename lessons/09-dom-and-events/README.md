# 09. The DOM and events

In this lesson you build two small web apps in plain JavaScript: a to-do list where you add, complete, and delete tasks, and a product list you search and filter. Tests check each one, and you try each one in the browser too.

## What you will be able to do

- Select, create, and update elements
- Handle clicks, input, and form submission
- Keep the UI in sync with a single state object

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-09
```

Run the tests for this lesson:

```sh
npm test 09
```

You see 55 failing tests. Your job this lesson is to make them pass.

To see your work in a browser, start a development server from the course folder:

```sh
npx vite lessons/09-dom-and-events
```

Open <http://localhost:5173>. You see the page with a to-do form and a product search, but nothing happens when you use them. Your code makes them work. Leave the server running. The page reloads each time you save a file. Press Ctrl+C in the terminal to stop it.

Open the browser's developer tools (F12, or right-click and choose Inspect) and click the **Console** tab. You use it for every "Try it" in this lesson.

## The DOM is a tree of objects

When the browser loads an HTML file, it turns every tag into a JavaScript object and links them in a tree. That tree is the DOM, the Document Object Model. The `document` object is its root. When your code changes an object in the tree, the browser redraws the page to match.

Here is a piece of `index.html`:

```html
<section id="todo-app">
	<h2>To-do list</h2>
	<form id="todo-form">
		<label for="todo-text">New task</label>
		<input id="todo-text" type="text" />
		<button type="submit">Add</button>
	</form>
	<ul id="todo-list"></ul>
</section>
```

Each tag is an element. The `<form>` is a child of the `<section>`, and the `<section>` is its parent. JavaScript reaches any of them. Your code in this lesson never writes HTML files. It reads and changes the elements that are already on the page, and it creates new ones.

## Select elements

`querySelector` takes a CSS selector and returns the first matching element, or `null` when nothing matches. `querySelectorAll` returns every match:

```js
document.querySelector('h1');             // the first <h1>
document.querySelector('#todo-form');     // the element with id="todo-form"
document.querySelector('.done');          // the first element with class="done"
document.querySelectorAll('li');          // every <li>
```

`#` means "id" and `.` means "class", the same as in CSS.

Every element has these methods too, and they search only inside that element. Your functions get a `root` element and search inside it:

```js
const root = document.querySelector('#todo-app');
const input = root.querySelector('#todo-text');
```

Searching inside `root` keeps one app from touching another. The page holds two apps, and each only sees its own part.

Try it. In the console, run `document.querySelector('h1')`. The console shows the `<h1>` element. Then run `document.querySelectorAll('section')`. You get a list of the two sections.

## Read and change elements

An element's properties hold what you see on the page. You read them and assign to them:

```js
const title = document.querySelector('h1');
title.textContent;                    // 'The DOM and events'
title.textContent = 'My first app';   // the heading on the page changes
```

Other properties you need:

```js
const input = document.querySelector('#todo-text');
input.value;           // what the user typed, as a string
input.value = '';      // empties the box

const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.checked;      // true or false
```

Classes control styling. `classList` adds and removes them without touching the others:

```js
const item = document.querySelector('li');
item.classList.add('done');
item.classList.remove('done');
item.classList.toggle('done', true);   // add it when the second value is true, remove it when false
item.classList.contains('done');
```

`index.html` already has CSS that crosses out a `done` item. When you add the class, the style applies.

Elements also carry attributes, the `name="value"` parts of a tag. `setAttribute('aria-label', 'Delete Buy milk')` sets one. `dataset` is a shortcut for attributes that start with `data-`. Use it to attach your own data to an element:

```js
item.dataset.id = 7;      // becomes data-id="7" in the HTML
item.dataset.id;          // '7': always a string, so use Number(item.dataset.id) to get 7
```

Try it. In the console, run `document.querySelector('h1').textContent = 'Hello'`. Reload the page to undo it. Then run `document.querySelector('h1').classList.toggle('big')`. Nothing looks different, because no CSS uses `big`. Open the **Elements** tab and find the `<h1>`. The class is there.

## Create elements

To add something to the page, create an element, fill it in, and put it in the tree:

```js
const item = document.createElement('li');   // a new <li>, not on the page yet
item.textContent = 'Buy milk';
document.querySelector('#todo-list').append(item);   // now it shows up
```

`append` accepts several arguments. Strings become text:

```js
const label = document.createElement('label');
label.append(checkbox, ' Buy milk');   // a checkbox followed by the text " Buy milk"
```

`replaceChildren` removes everything inside an element and puts new children in its place. Call it with no arguments to empty the element:

```js
list.replaceChildren(item1, item2, item3);
list.replaceChildren();
```

You can also spread an array of elements into it: `list.replaceChildren(...items)`. You spread arguments in lesson 08.

`element.remove()` takes one element out of the page.

### textContent, not innerHTML

There is a second way to fill an element: `element.innerHTML = '<b>Hi</b>'` parses a string as HTML. Do not use it with text that a user typed. If someone types `<img src=x onerror="stealCookies()">` as a task and you assign it to `innerHTML`, the browser runs their code. This attack is called cross-site scripting, or XSS. `textContent` treats the string as plain text, so `<b>` shows up as the characters `<b>` on the page. The tests for both exercises check for this. You return to XSS in lesson 25.

Try it. In the console, create a list item that holds `<b>hi</b>` with `textContent`, and append it to the first `<section>`. You see the angle brackets on the page.

## Handle events

An event is something that happens on the page: a click, a key press, a form submission. You attach a function, a listener, to an element. The browser calls it each time the event happens:

```js
const button = document.querySelector('button');
button.addEventListener('click', () => {
	console.log('clicked');
});
```

The browser passes your listener an event object that describes what happened. These are the parts you need:

- `event.target` is the element the event started on. For a click, it is the deepest element under the pointer.
- `event.preventDefault()` stops the browser's built-in response to the event.

The events for this lesson:

| Event | Fires | On |
| --- | --- | --- |
| `click` | when the user clicks | any element |
| `input` | on every change to what's typed | `<input>`, including each keystroke |
| `change` | when a checkbox is toggled or a menu choice is made | `<input>`, `<select>` |
| `submit` | when a form is submitted | `<form>` |

### Forms

A `<form>` is submitted when the user clicks its submit button or presses Enter in a text box. By default the browser then reloads the page, and your app forgets everything. Listen for `submit` and stop that:

```js
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-text');

form.addEventListener('submit', (event) => {
	event.preventDefault();   // do not reload the page
	console.log('adding', input.value);
	input.value = '';
});
```

Listen on the form, not on the button. Then the Add button and the Enter key both work with one listener.

Try it. Paste the code above into the console and type something in the New task box. Press Enter. The console prints what you typed, and the box empties. The page does not reload. Delete the `preventDefault` line, paste it into a fresh page, and watch the page reload on submit.

### Listen on a parent for events from its children

Your apps draw their list again after every change, which makes new elements. A listener attached to an old element is lost with it. And a list with 50 items would need 50 listeners. Instead, attach one listener to the `<ul>` that never changes. Events bubble: a click on a button inside the list also fires on the list, and `event.target` tells you which button:

```js
list.addEventListener('click', (event) => {
	const button = event.target.closest('button');
	if (button === null) return;      // the click was somewhere else in the list
	const item = button.closest('li');
	console.log('delete the task with id', item.dataset.id);
});
```

`closest(selector)` starts at an element and walks up through its parents until one matches. It returns `null` when none does. This is called event delegation. Use `click` for buttons and `change` for checkboxes.

## Keep the UI in sync with one state object

Here is a counter that changes the page directly:

```js
let count = 0;
button.addEventListener('click', () => {
	count = count + 1;
	display.textContent = `Count: ${count}`;
});
```

It works. Now add a Reset button, a "count is even" message, and a Save button that has to know the count. Each new feature has to remember to update every part of the page that shows the count. Forget one and the page disagrees with itself. This kind of bug gets worse as an app grows.

The fix is to follow one rule:

1. All the data lives in one **state** object.
2. One **render** function draws the whole page from the state. It reads the state and nothing else.
3. An event handler never edits the page. It makes a new state, then calls `render`.

```js
let state = { count: 0 };

function render() {
	display.textContent = `Count: ${state.count}`;
	message.textContent = state.count % 2 === 0 ? 'Even' : 'Odd';
}

button.addEventListener('click', () => {
	state = { ...state, count: state.count + 1 };
	render();
});

render();   // draw the page once at the start
```

A new feature is a new field in the state and a few lines in `render`. The page always matches the state, because `render` is the only code that touches the page.

To change the state, use the copy-don't-mutate habits from lesson 07. A handler builds a new state object with spread and `map`, and assigns it to the `state` variable. Put those changes in plain functions that take a state and return a new one. A function like that needs no page to test, and the tests for `addTodo`, `toggleTodo`, `deleteTodo`, and `filterProducts` call them directly.

Rendering the whole list again looks wasteful. For a list this size the browser does it faster than you can notice, and the code is far easier to get right. Frameworks like React, which you meet in lesson 20, use this same rule.

One cost: rendering replaces the elements, so a checkbox you just clicked loses keyboard focus. The tests ignore this. Fixing it is a stretch goal.

Do not render controls that the user is typing in. If `render` rebuilt the search box on each keystroke, the box would lose focus after one character. Render the list. Leave the inputs alone.

## How the tests drive your page

The tests run your code in jsdom, a pretend browser written in JavaScript. A test loads the body of `index.html`, calls your `setup` function with the root element, then acts like a user: it types into the box, clicks the Add button, and checks the boxes. It checks what's on the page afterward.

The tests find elements the way a user would: by label ("New task"), by role (checkbox, button), and by visible text. That's why the Delete button has an `aria-label` that says which task it deletes. Screen reader users depend on those labels too.

In each exercise, read the comment above `setupTodoApp` and `setupProductList`. It spells out the exact elements, text, and class names the tests look for.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-todo-app.js` is the to-do list. First write `addTodo`, `toggleTodo`, and `deleteTodo`, the three functions that make new states. Then write `setupTodoApp`, which draws the state and connects the form, the checkboxes, and the Delete buttons.
2. `02-product-list.js` is the filterable product list. First write `filterProducts`. Then write `setupProductList`, which draws the products and connects the search box, the category menu, and the in-stock checkbox.

Start each exercise with its pure functions. They have the most tests and need no browser. Then build `render` before you add any event listener: start the server, load the page, and see the starting state appear. Add one listener at a time and try it in the browser.

Run `npm test 09` after each change. When every test passes, you're ready to submit. `index.html`, `main.js`, and `products.js` are already written. You don't change them.

A product is `{ id, name, category, price, inStock }`, and `price` is in whole cents like the money in lesson 07. You use the same product shape again in lesson 20.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Save the to-do state in `localStorage` after every change and load it when the page opens. Use `JSON.stringify` and `JSON.parse`.
- Add a "Clear completed" button to the to-do list. Write the pure function first.
- Keep keyboard focus on the checkbox you just toggled. How do you find the new checkbox after `render`?
- Add a price sort menu to the product list. Which part of the state does it add?
- Wrap the search box's handler in `debounce` from lesson 08. Why does the filter feel slower to the user, and when would that still be worth it?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/09-dom-and-events
git commit -m "Complete lesson 09 exercises"
git push -u origin lesson-09
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- State lives in one object, and `render` is the only code that changes the page
- Event handlers update the state and call `render`. They never edit the page themselves
- No function mutates a state it was given
- User text goes in with `textContent`, never `innerHTML`
- Listeners are attached once at setup, not inside `render`
- Names that say what an element or value is (`deleteButton`, not `btn2`)
