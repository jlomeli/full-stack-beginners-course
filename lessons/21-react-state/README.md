# 21. State and effects

In this lesson you build a to-do app in React: a form, a list, and an app component that owns the data. Then you find and fix three misused effects. Tests check each part.

## What you will be able to do

- Manage state with useState
- Lift state up and pass callbacks down
- Use useEffect only for syncing with outside systems

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-21
```

Run the tests for this lesson:

```sh
npm test 21
```

You see 35 failing tests. Your job this lesson is to make them pass.

## State: data that changes

In lesson 20 every component showed the props it was given. When the user types or clicks, something has to remember the new value. That is state.

```jsx
import { useState } from 'react';

function Counter() {
	const [count, setCount] = useState(0);

	return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

`useState(0)` returns a pair: the current value and a function that changes it. The `0` is the starting value, and React uses it only on the first render. Calling `setCount` does two things: it stores the new value, and it renders the component again. On that render `count` is the new number.

Type `Counter` into a scratch `.jsx` file and render it from `main.jsx` to watch it work. Click twice. You see "Clicked 2 times".

Three rules keep state predictable.

Call hooks at the top level. `useState` and `useEffect` are hooks. Call them at the top of a component, never inside an `if`, loop, or nested function. React tracks state by the order of the calls.

State is a snapshot. A component's variables keep one value for the whole render. `setCount(count + 1)` does not change `count` in the code that is running. It asks for a new render in which `count` is bigger. To update from the previous value, pass a function: `setCount((current) => current + 1)`.

Never change state in place. React sees a change when the value is a different object. Build a new array or object and pass that to the setter:

```jsx
setTodos([...todos, newTodo]);                       // add
setTodos(todos.filter((todo) => todo.id !== id));    // remove
setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))); // change one
```

`todos.push(newTodo)` followed by `setTodos(todos)` shows nothing, because it is still the same array. These three lines are the same spread, `filter`, and `map` moves you used in lesson 07.

## Controlled inputs

An input that keeps its value in state is controlled. React owns the value, and the input shows whatever state says:

```jsx
const [text, setText] = useState('');

<input value={text} onChange={(event) => setText(event.target.value)} />
```

Every keystroke calls `onChange`, which updates state, which renders the input with the new value. Because the text is in state, you can read it, trim it, or clear it with `setText('')`. Wrap the input in a `<label>` so the label text is its accessible name. The tests find inputs by label.

To handle a form, listen for `onSubmit` on the `<form>`, not `onClick` on the button. Then Enter works too. The browser reloads the page by default, so call `event.preventDefault()` first.

## Derived values are not state

Ask of each piece of data: can I work it out from state or props I already have? If so, it is not state. Compute it while rendering:

```jsx
const doneCount = todos.filter((todo) => todo.done).length;
```

If you store `doneCount` in its own `useState`, you now have two values that must agree, and every handler has to update both. You will forget one. Keep the smallest state you can, and derive the rest.

## Lifting state up

A to-do app has a form that adds tasks and a list that shows them. Both need the same array. When two components need the same data, move the state to their closest common parent. The parent passes the data down as props and passes callbacks down so the children can ask for changes:

```jsx
function TodoApp() {
	const [todos, setTodos] = useState([]);

	function addTodo(text) {
		setTodos([...todos, { id: nextId, text, done: false }]);
	}

	return (
		<>
			<TodoForm onAdd={addTodo} />
			<TodoList todos={todos} />
		</>
	);
}
```

Data flows down as props. Events flow up as callbacks. `TodoForm` does not know there is a list, and `TodoList` does not know where tasks come from. Each can be tested alone, and the parent is the only place that changes the array.

Not every piece of state needs lifting. The text in the "New task" input matters only to the form until the user submits, so `TodoForm` keeps it in its own state and calls `onAdd(text)` with the finished value.

## Effects: syncing with the outside world

Rendering must be a pure calculation: the same props and state give the same result, and it changes nothing outside the component. But some work does reach outside: setting `document.title`, listening for keyboard events on `window`, starting a timer, or talking to a server. React calls those things outside systems. You run that work in an effect:

```jsx
import { useEffect } from 'react';

function PageTitle({ name }) {
	useEffect(() => {
		document.title = `${name}'s library`;
	}, [name]);

	return <h2>{name}'s library</h2>;
}
```

React runs the effect after it puts the component on the page. The second argument is the dependency array. React runs the effect again after any render where one of those values changed. It lists every prop and state variable the effect reads. Leave one out and the effect uses a stale value.

If the effect starts something that keeps going, return a cleanup function. React calls it before the effect runs again and when the component leaves the page:

```jsx
useEffect(() => {
	function handleResize() {
		console.log(window.innerWidth);
	}
	window.addEventListener('resize', handleResize);
	return () => window.removeEventListener('resize', handleResize);
}, []);
```

With `[]` the effect runs once, after the first render. In development, `<StrictMode>` runs every effect, cleanup, and effect again on purpose. If your effect has no cleanup, you see its side effect twice, and that is how you find the missing cleanup.

### When not to use an effect

An effect is an escape hatch. Most things beginners put in effects belong somewhere else.

| You want to | Do this instead of an effect |
| --- | --- |
| Compute a value from props or state | Compute it while rendering |
| Respond to a click, a submit, or a keystroke | Do it in the event handler |
| Reset state when a prop changes | Give the component a different `key` |
| Fetch data when the page loads | An effect is right here (lesson 22), with a cleanup |

The test is: does this code keep React in sync with something outside React? If it does, use an effect. If it only moves data between your own state and props, it does not need one. See [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) for the full list.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Read the matching `.test.jsx` file too. The tests are the exact spec.

To-do app:

1. `01-todo-form.jsx` is the form. It keeps the typed text in its own state and calls `onAdd(text)` on submit.
2. `02-todo-list.jsx` shows the todos with a checkbox and a Delete button on each. It has no state.
3. `03-todo-app.jsx` owns the todos, adds, toggles, deletes, and clears completed ones, and shows "1 of 3 done".

Do these in order. When they pass, run the app in the browser from the course repo:

```sh
npx vite lessons/21-react-state
```

Open the address it prints and add, tick, and delete a few tasks.

Misused effects:

4. `04-effect-bugs.jsx` has three components with a bug each: an effect with a missing dependency, an effect with a missing cleanup, and state that should have been computed while rendering. The file's comments say what each component should do. Run `npm test 21`, read the failing tests, and fix the bug in each. Above each fix, write a one-sentence comment that says what was wrong.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Save the todos to `localStorage` and load them when the app starts. Is that an effect, an event handler, or both?
- Add a filter with three buttons, "All", "Active", and "Done". Is the selected filter state? Is the filtered list?
- Edit a task's text by double-clicking it. Which component holds the "currently editing" state?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/21-react-state
git commit -m "Complete lesson 21 exercises"
git push -u origin lesson-21
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- State is updated with new arrays and objects, never changed in place
- The done count is computed while rendering, not stored in its own state
- `TodoApp` is the only component that changes the todos, and the children get callbacks
- Each fix in `04-effect-bugs.jsx` has a comment, and `BookSearch` has no effect and no results state
- No effect is used where an event handler or a plain calculation would do
