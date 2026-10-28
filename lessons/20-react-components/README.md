# 20. React components and JSX

In this lesson you rebuild the filterable product list from lesson 09 in React. You write three components: a product card, a product list, and the filter controls. Tests check each one.

## What you will be able to do

- Build components that take props
- Render lists and conditional UI
- Set up a project with Vite

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-20
```

Run the tests for this lesson:

```sh
npm test 20
```

You see 40 failing tests. Your job this lesson is to make them pass.

## Why components

In lesson 09 you wrote a function that built DOM elements one at a time, and another that redrew them when the state changed. React flips that around. You describe what the page looks like for the current data, and React updates the DOM to match.

You describe the page with components. A component is a function that returns what to show. Its name starts with a capital letter:

```jsx
function Greeting() {
	return <p>Hello, reader.</p>;
}
```

That tag-like code is JSX. It looks like HTML, but it is JavaScript: the build tool turns each tag into a function call. You use a component like a tag:

```jsx
<Greeting />
```

JSX differs from HTML in a few ways:

- A component returns one root element. Wrap siblings in a parent element or in an empty `<>...</>` fragment.
- Every tag closes. Write `<input />`, not `<input>`.
- Some attributes have different names. `class` is `className`, and `for` is `htmlFor`. (A `<label>` that wraps its input needs neither.)
- Curly braces run JavaScript inside JSX: `<p>2 + 2 is {2 + 2}</p>`.

React escapes every value you put in braces. A product named `<b>Mug</b>` shows as the text `<b>Mug</b>`, so you never need `textContent` tricks to stay safe.

## Props

Props are a component's arguments. The parent writes them like attributes. The child receives them as one object:

```jsx
function Greeting({ name }) {
	return <p>Hello, {name}.</p>;
}

<Greeting name="Ada" />
```

The `{ name }` in the parameter list pulls `name` out of the props object (destructuring, from lesson 07). A prop can be any value. Put JavaScript values in braces: `<Greeting name={user.name} />`, `<Product product={mouse} />`, `<Button onClick={save} />`. A function prop is how a child tells its parent something happened.

Treat props as read-only. A component never changes its props. It shows what it is given.

Each use of a component is independent: `<Greeting name="Ada" />` and `<Greeting name="Grace" />` show different text from the same function. That is the point of a component. You write the product card once and use it for every product.

## Conditional UI

JSX has no `if`. You choose what to show with ordinary JavaScript. Three patterns cover almost every case.

Use `&&` to show something or nothing:

```jsx
{product.inStock && <button type="button">Add to cart</button>}
```

If the left side is false, React renders nothing. Do not use it with a number on the left. `{count && <p>...</p>}` shows a `0` when `count` is `0`. Write `{count > 0 && ...}` instead.

Use the conditional operator to pick between two things:

```jsx
<p>{product.inStock ? 'In stock' : 'Out of stock'}</p>
```

Use an early `return` to swap the whole result:

```jsx
if (visible.length === 0) return <p>No products match your filters.</p>;
```

## Lists

To show an array, `map` it to JSX:

```jsx
<ul>
	{products.map((product) => (
		<li key={product.id}>{product.name}</li>
	))}
</ul>
```

Every item in the list needs a `key`: a value that is unique among its siblings and stays with the item, such as `product.id`. React uses keys to match items between renders, so that when the list changes it keeps the right DOM element for the right product. Do not use the array index as a key when the list can be filtered or reordered. If you forget the key, React prints a warning in the console, and one of your tests checks for it.

Filtering is plain JavaScript from lesson 07. Build the visible array first, then map it:

```jsx
const visible = products.filter((product) => product.inStock);
```

## Handling events

An event handler is a function prop with a name like `onClick` or `onChange`. Pass a function, do not call it:

```jsx
<button onClick={() => onAdd(product)}>Add to cart</button>
```

`onClick={onAdd(product)}` is a bug: it calls `onAdd` while the page renders, and passes its result as the handler.

Inputs work the same way. This lesson's filter controls are controlled: the parent passes the current value, and the component reports every change through a callback. Lesson 21 explains the other half:

```jsx
<input value={search} onChange={(event) => onSearchChange(event.target.value)} />
```

The component holds no state of its own. Where the state lives is the subject of lesson 21.

## The data

`products.js` has the same eight products as lesson 09. A product looks like this:

```js
{ id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 2499, inStock: true }
```

`price` is in whole cents, so `2499` is $24.99. To show it, divide by 100 and keep two decimals: `(price / 100).toFixed(2)`. In JSX, `$` is an ordinary character, so `<p>${(price / 100).toFixed(2)}</p>` shows `$24.99`.

## Set up a project with Vite

This lesson's folder is already set up, so you can start coding. You will also start a React project from nothing, so learn the pieces.

Browsers don't understand JSX, and they don't bundle your files. Vite is the tool in between. In development it serves your files and turns JSX into JavaScript on the fly. For production it bundles everything into a few optimised files. To create a project, run this in a folder outside the course repo:

```sh
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). Edit `src/App.jsx` and save. The page updates without a reload. The files you will meet:

| File | What it does |
| --- | --- |
| `index.html` | The one HTML page. It has an empty `<div id="root">` and a `<script type="module">` tag that loads `src/main.jsx`. |
| `src/main.jsx` | Starts React. `createRoot(...).render(<App />)` puts your component tree inside the root `div`. |
| `src/App.jsx` | The top component. You build your page from here. |
| `package.json` | Lists the dependencies and the `dev`, `build`, and `preview` scripts. |

This lesson's folder has the same three pieces: `index.html`, `main.jsx`, and `product-app.jsx` as the top component. To see your work in the browser, run this from the course repo:

```sh
npx vite lessons/20-react-components
```

Open the address it prints. Until you finish the exercises, the page shows only the heading. When it works, search, pick a category, tick **In stock only**, and click **Add to cart**.

Read [Start a new React project](https://react.dev/learn/start-a-new-react-project) and the [Vite guide](https://vite.dev/guide/) for more.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Read the matching `.test.jsx` file too. The tests are the exact spec.

1. `01-product-card.jsx` shows one product: name, category, price in dollars, stock status, and an "Add to cart" button for products in stock.
2. `02-product-list.jsx` has `categoriesOf`, which lists the categories once each in alphabetical order, and `ProductList`, which filters the products and shows a card for each.
3. `03-product-filters.jsx` is the search box, category menu, and "In stock only" checkbox. All three are controlled by props.
4. `04-product-app.test.jsx` has no starter to fill in. It tests `product-app.jsx`, which joins your three components. It passes once exercises 1 to 3 pass. Read `product-app.jsx` to see how the pieces connect.

Do exercises 1 to 3 in order. Run `npm test 20` after each change. When every test passes, run the app in the browser.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a price sort menu to the filters. Which component needs a new prop, and which file needs to change to remember the choice?
- Show "Only 1 left" under products whose `inStock` is `true` when a `stock` count is 1. Add the field to `products.js`.
- Create a Vite project with `npm create vite@latest` and move the three components into it. What do you have to change?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/20-react-components
git commit -m "Complete lesson 20 exercises"
git push -u origin lesson-20
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Components get everything they show from props, and none of them changes a prop or the `products` array
- The list uses a stable `key` (the product id), not the array index
- Conditional UI uses `&&`, the conditional operator, or an early return, and shows no stray `0` or `false`
- Prices come from cents with one clear conversion, not stored or compared as dollars
- Event handlers are passed as functions, not called during render
