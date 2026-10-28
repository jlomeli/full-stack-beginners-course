# 03. Semantic HTML and accessibility

In this lesson you turn a plain-text recipe into a well-structured web page, then build a sign-up form that works with a keyboard and a screen reader. Tests check the structure of both pages, and you check the accessibility yourself in the browser.

## What you will be able to do

- Structure a page with semantic elements
- Build an accessible form with labels and validation attributes
- Check a page with the browser accessibility tree

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-03
```

Run the tests for this lesson:

```sh
npm test 03
```

You see 30 failing tests. Your job this lesson is to make them pass, then complete the accessibility check.

## What HTML is for

HTML describes what the parts of a page **are**. A paragraph, a list, a heading, and a button are different things. Browsers, search engines, and screen readers all read that description. Colors and sizes come later, in CSS (lesson 04).

An HTML file is text. Browsers read it from top to bottom and build the page from **elements**. An element has a start tag, content, and an end tag:

```html
<p>Fluffy pancakes in <strong>30 minutes</strong>.</p>
```

`<p>` is a paragraph and `<strong>` marks text as important. Elements nest, and the nesting is the structure. A tag can carry **attributes**, which are `name="value"` pairs inside the start tag:

```html
<a href="https://developer.mozilla.org">MDN</a>
```

A few elements have no content and no end tag, such as `<img>` and `<input>`.

## A complete page

Every page you write starts from the same skeleton. Create a file named `hello.html` anywhere outside `lessons/` and type this:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Hello</title>
	</head>
	<body>
		<h1>Hello, web</h1>
		<p>This is my first page.</p>
	</body>
</html>
```

Open the file in your browser. You see a heading and a paragraph, and the tab says "Hello".

- `<!doctype html>` tells the browser to use modern rules.
- `lang="en"` tells screen readers which language to speak and tells browsers whether to offer translation.
- `<meta charset="utf-8" />` makes accented letters and emoji display correctly.
- The viewport `<meta>` makes the page fit a phone screen. Without it, phones show a tiny zoomed-out desktop page.
- `<title>` is the text in the browser tab and in search results. Make it describe the page.

Everything in `<head>` is information about the page. Everything in `<body>` is the page.

## Semantic elements

You can build any page out of `<div>` elements. A `<div>` means nothing, so a screen reader can't tell a menu from a footer. **Semantic** elements say what the content is:

| Element | Use it for |
| --- | --- |
| `<header>` | The introduction at the top of the page or a section: titles, logo |
| `<nav>` | A group of links for moving around |
| `<main>` | The main content of the page. Use one per page |
| `<section>` | A themed group of content that has its own heading |
| `<article>` | A piece that makes sense on its own: a post, a card, a comment |
| `<aside>` | Content that is related but not essential: a tip, a side note |
| `<footer>` | The end of the page or a section: credits, contact, copyright |

Browsers and assistive technology treat `<header>`, `<nav>`, `<main>`, and `<footer>` as **landmarks**. Screen reader users jump from landmark to landmark the way you scan a page with your eyes. A page made of `<div>`s has no landmarks.

Try it. Add this inside the `<body>` of `hello.html`, around your heading and paragraph:

```html
<header>
	<h1>Hello, web</h1>
</header>
<main>
	<p>This is my first page.</p>
</main>
<footer>
	<p>Made by me.</p>
</footer>
```

The page looks the same. The difference is in its structure, which you can see in the accessibility tree later in this lesson.

## Headings

Headings make an outline of the page. Use `<h1>` for the page's title, once. Use `<h2>` for its main parts, and `<h3>` for parts inside those:

```html
<h1>Buttermilk Pancakes</h1>
	<h2>Ingredients</h2>
	<h2>Steps</h2>
		<h3>Making the batter</h3>
		<h3>Cooking</h3>
```

Never skip a level, for example `<h1>` straight to `<h3>`. Pick the heading by its place in the outline, not by how large it looks. You change the size with CSS.

## Text, lists, and links

```html
<p>A paragraph.</p>

<ul>
	<li>A bulleted list, for items with no order</li>
	<li>Ingredients are a good example</li>
</ul>

<ol>
	<li>A numbered list, for items in order</li>
	<li>Steps are a good example</li>
</ol>

<a href="https://developer.mozilla.org/en-US/docs/Web/HTML">The MDN HTML guide</a>
```

The list adds the bullet or number. Don't type `-` or `1.` yourself.

A link's text must make sense on its own. A screen reader can read a list of every link on the page. "Read the MDN HTML guide" works in that list. "Click here" doesn't.

**Description lists** pair terms with details. Use them for labeled facts:

```html
<dl>
	<dt>Serves</dt>
	<dd>4</dd>
	<dt>Prep time</dt>
	<dd>10 minutes</dd>
</dl>
```

## Images

```html
<img src="pancakes.svg" alt="A stack of three golden pancakes on a white plate" width="400" height="260" />
```

- `src` is the file to show.
- `alt` is the text version. A screen reader reads it. The browser shows it when the image fails to load. Describe what the image shows, as if you were reading the page to someone on the phone. Don't start with "image of" or "picture of", because screen readers already say "image".
- `width` and `height` let the browser reserve space before the image loads, so the page doesn't jump.

Pair an image with a caption using `<figure>` and `<figcaption>`:

```html
<figure>
	<img src="pancakes.svg" alt="A stack of three golden pancakes on a white plate" />
	<figcaption>Our test batch.</figcaption>
</figure>
```

A purely decorative image gets `alt=""`, an empty value. Screen readers then skip it.

## Dates

`<time>` marks a date in a form a computer can read:

```html
<time datetime="2026-10-01">October 1, 2026</time>
```

People read the text between the tags. Software reads the `datetime` attribute.

## Exercise 1: the recipe page

Open `exercises/01-recipe.html`. It holds the instructions in a comment and a recipe as plain text. Turn the text into a complete page. Delete the comment when you start.

Run `npm test 03` as you go. Each test name tells you what's wrong. Open the file in your browser too, and compare what you see with what the test names ask for. Two things to watch for:

- The list items in the text start with `-` and `1.`. The list elements add those, so remove them.
- The photo, `pancakes.svg`, is in the same folder, so `src="pancakes.svg"` finds it.

## Forms

A form collects input and sends it to a server. You build the server side in lesson 13. Here you build the page.

```html
<form method="post" action="/signup">
	<label for="email">Email</label>
	<input id="email" name="email" type="email" required />
	<button type="submit">Join</button>
</form>
```

When the user clicks the button, the browser sends a `POST` request to `/signup` (lesson 02). The body holds `email=...`, built from each field's `name` attribute. A field with no `name` isn't sent.

### Labels

Every field needs a visible `<label>`. The label's `for` attribute holds the `id` of its field, and that link does three jobs:

- A screen reader reads the label when the field gets focus.
- Clicking the label focuses the field. For radio buttons and checkboxes, it also toggles them, which gives a bigger target.
- The label is the field's **accessible name**.

Try it. Type the form above in `hello.html`, open it, and click the word "Email". The cursor jumps into the field. Delete `for="email"`, reload, and click again. Nothing happens, and a screen reader would announce only "edit text".

A placeholder is not a label. It disappears when the user types, it is often low contrast, and many screen readers skip it. Use a label every time.

You can also wrap the field in its label instead of using `for` and `id`. This course uses `for` and `id`, because the tests and the browser tools show the link clearly.

### Input types and validation attributes

The `type` attribute picks the kind of field. It changes the keyboard a phone shows and what the browser checks:

| Type | Use for |
| --- | --- |
| `text` | Short text, such as a name |
| `email` | An email address. Mobile keyboards show `@`. The browser checks the format |
| `password` | Text that shows as dots |
| `tel` | A phone number. Mobile keyboards show a dial pad |
| `number` | A number |
| `date` | A date, with a date picker |
| `checkbox` | An on-or-off choice |
| `radio` | One choice out of several |

Validation attributes make the browser check the input before it sends anything:

| Attribute | Effect |
| --- | --- |
| `required` | The field can't be empty |
| `minlength="8"` | Text must have at least 8 characters |
| `maxlength="50"` | Text can't be longer than 50 characters |
| `min="1"` and `max="10"` | The smallest and largest number or date |
| `pattern="[0-9]{5}"` | The text must match a regular expression |

The browser shows its own error message next to the first bad field and doesn't send the form. That is quick for the user and free for you. It doesn't replace checking on the server, because anyone can send a request without your page. You return to that in lesson 14.

Add `autocomplete` so the browser and password managers can fill the field. Use the names from the [HTML autocomplete reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete): `name`, `email`, `tel`, `new-password`, and `current-password` for a login form.

### Help text

Connect a hint to its field with `aria-describedby`. Its value is the `id` of the element that holds the hint:

```html
<label for="password">Password</label>
<input id="password" name="password" type="password" minlength="8" aria-describedby="password-hint" />
<p id="password-hint">At least 8 characters.</p>
```

A screen reader reads the label, then the field type, then the hint.

### Groups of choices

Radio buttons with the same `name` form a group. Only one can be selected. Wrap the group in a `<fieldset>` with a `<legend>` that asks the question:

```html
<fieldset>
	<legend>Pick a size</legend>
	<input id="small" name="size" type="radio" value="small" />
	<label for="small">Small</label>
	<input id="large" name="size" type="radio" value="large" />
	<label for="large">Large</label>
</fieldset>
```

Each radio has its own label and its own `id`. The legend is read before each option, so the user hears "Pick a size, small".

### Select menus

A `<select>` holds a list of `<option>` elements. Each option's `value` is what gets sent:

```html
<label for="source">How did you hear about us?</label>
<select id="source" name="source">
	<option value="">Choose one</option>
	<option value="friend">Friend</option>
	<option value="search">Search</option>
</select>
```

### Buttons and links

Use `<button type="submit">` to send a form. Use `<a href>` to go to another page. Don't swap them. A `<button>` works with the keyboard for free, and a `<div>` made to look like a button does not.

## Exercise 2: the sign-up form

Open `exercises/02-signup.html`. The comment lists every field the form needs. Build the whole page from it.

Run `npm test 03` as you go. When the 16 sign-up tests pass, open the page in your browser, fill it in, and press the button. The browser tries to send the form to `/signup`. You see an error page, because there is no server yet. That's expected. If the browser stops you first with a message next to a field, that's the validation attributes working.

## The accessibility tree

The browser builds a second tree next to the page: the **accessibility tree**. Each node has a **role** (what it is: button, heading, textbox) and a **name** (what it's called). Screen readers read that tree, not your HTML. Semantic elements and labels put the right roles and names in it.

To look at it in Chrome:

1. Open DevTools (right-click the page, **Inspect**).
2. Select an element in the **Elements** panel.
3. Open the **Accessibility** pane next to **Styles**.

Try it on your sign-up form. Select the Email input and read its role and name. Remove the `for` from its label, reload, and look again. The name goes blank. Put the `for` back.

The **Lighthouse** tab in DevTools runs an accessibility audit. It finds many missing labels, bad alt text, and low-contrast colors. It can't tell whether your labels make sense, so the checklist below is still your job.

## Exercise 3: the accessibility check

Open `exercises/03-accessibility-check.md` and work through it on your finished `02-signup.html`. You read the accessibility tree, tab through the form with the keyboard, trigger the browser's validation messages, and run Lighthouse. Nobody can check this by running a test, so your reviewer reads your answers.

### The checklist

Before you submit, check each of these on both pages:

- The page has `lang`, a `<title>`, and a viewport `<meta>`.
- It has one `<h1>`, and headings never skip a level.
- It uses `<header>`, `<main>`, and `<footer>` instead of `<div>`s.
- Every image has `alt` text that describes it.
- Every form field has a visible `<label>`.
- You can complete the form with the keyboard alone.

## Exercises

1. `exercises/01-recipe.html` is the recipe page. `01-recipe.test.js` checks it.
2. `exercises/02-signup.html` is the sign-up form. `02-signup.test.js` checks it.
3. `exercises/03-accessibility-check.md` is the accessibility check. You fill it in and your reviewer reads it.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a skip link as the first element in `<body>`: `<a href="#main">Skip to the recipe</a>`. Give `<main>` the matching `id`. Tab once and see what it does.
- Add `inputmode` and `pattern` to the phone field. How strict can you be before a real phone number fails?
- Run the page through the [W3C Markup Validator](https://validator.w3.org/#validate_by_input). Fix what it reports.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/03-html
git commit -m "Complete lesson 03 exercises"
git push -u origin lesson-03
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Elements chosen by meaning: a `<ul>` for a list, not a `<div>` with dashes
- Alt text that a person who can't see the photo would find useful
- Link and button text that makes sense out of context
- Accessibility check answers that come from your own screen, and a fix for anything Lighthouse flagged
- Consistent indentation, and no leftover instruction comments
