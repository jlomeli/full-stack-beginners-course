# 04. CSS fundamentals

In this lesson you style the pancake recipe page from lesson 03 with a stylesheet, then debug a second stylesheet that has five rules fighting each other.

## What you will be able to do

- Apply selectors, specificity, and the cascade
- Size elements with the box model
- Use custom properties for colors and spacing

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-04
```

Run the tests for this lesson:

```sh
npm test 04
```

You see 19 failing tests. Your job this lesson is to make them pass.

## Connect a stylesheet

HTML says what the content is. CSS says how it looks. You keep them in separate files and connect them with a `<link>` in the `<head>`:

```html
<link rel="stylesheet" href="01-recipe.css" />
```

`exercises/01-recipe.html` already has that line. Open the file in your browser (in VS Code, right-click it in the sidebar and choose **Reveal in Finder** or **Reveal in File Explorer**, then double-click it). Keep that tab open. After every change to the CSS, save the file and reload the tab.

A CSS file is a list of **rules**. Each rule has a **selector** that picks elements and **declarations** that style them:

```css
h1 {
	color: #9a3412;
	font-size: 2.5rem;
}
```

`color` and `font-size` are **properties**. `#9a3412` and `2.5rem` are **values**. Each declaration ends with a semicolon.

Try it. Add the rule above to the end of `01-recipe.css`, save, and reload. The title changes color and size. Delete the rule when you're done.

## Selectors

The selector decides which elements a rule touches.

```css
p { }              /* every <p>: a type selector */
.tip { }           /* every element with class="tip" */
#page-title { }    /* the one element with id="page-title" */
main p { }         /* every <p> anywhere inside <main> */
li + li { }        /* every <li> directly after another <li> */
a:hover { }        /* a link while the mouse is over it */
.card.featured { } /* an element with both classes */
h1, h2 { }         /* h1 elements and h2 elements */
```

Prefer classes. A class describes a role (`.tip`, `.button`) and any element can have one. Type selectors are fine for plain defaults such as `body` and `p`. Avoid ids for styling, for a reason you'll see in a moment.

Try it. In your browser, right-click the recipe title and choose **Inspect**. DevTools opens with the element selected. The **Styles** pane lists every rule that applies to it, with the file and line number. You use this pane constantly.

## Colors, text, and units

Write colors as hex codes such as `#1f2937`. The tests in this lesson read hex codes.

```css
body {
	color: #1f2937;
	background-color: #fffaf0;
	font-family: system-ui, sans-serif;
	line-height: 1.6;
}
```

- `font-family` is a list. The browser uses the first font it has. Always end with a **generic family** such as `sans-serif`.
- `line-height: 1.6` with no unit means 1.6 times the font size. Use a unitless number so it scales with the text.
- Text must stand out from its background. The **contrast ratio** measures that. WCAG, the accessibility standard, asks for at least 4.5 to 1 for body text. Paste two colors into [the WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) to see their ratio.

Lengths come in two kinds. `px` is a fixed pixel size. `rem` is a multiple of the root font size, which is 16px unless the user changes it. `2rem` is 32px by default. Use `rem` for font sizes and spacing so the page respects a reader's browser settings.

## The box model

Every element is a rectangle made of four layers, from inside out:

```
┌───────────────────────── margin ─────────────────────────┐
│  ┌─────────────────────── border ───────────────────┐    │
│  │  ┌─────────────────── padding ────────────────┐  │    │
│  │  │            content (text, image)           │  │    │
│  │  └────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

- **Content** holds the text or image.
- **Padding** is space inside the border. The element's background shows through it.
- **Border** is the line around the padding.
- **Margin** is space outside the border. It's always transparent.

By default, `width` sets the content box only. A `width: 300px` element with `padding: 20px` and a `4px` border is `348px` wide. That's confusing. Fix it once for the whole page:

```css
*,
*::before,
*::after {
	box-sizing: border-box;
}
```

With `border-box`, `width` includes padding and border. `300px` stays `300px`. Almost every stylesheet starts with this rule. `*` matches every element, and `::before` and `::after` match the generated content some pages add.

Margins have two habits to know. Vertical margins between neighbors **collapse** into the larger one instead of adding. And `margin: 0 auto` on an element with a set width centers it horizontally, because the browser splits the leftover space between left and right.

Try it. Add these to `01-recipe.css`, reload, and inspect the `main` element. DevTools draws the box model in the **Computed** tab.

```css
main {
	max-width: 50rem;
	margin: 0 auto;
	padding: 1rem;
}
```

`max-width` sets a ceiling. The element is narrower than that on a small screen and stops growing on a large one. Resize the browser window to watch it.

Images need one rule so they never overflow their container:

```css
img {
	max-width: 100%;
	height: auto;
}
```

## The cascade and specificity

Many rules can target one element. When two rules set the same property, the browser picks a winner. That process is the **cascade**. It checks three things, in this order:

1. **Importance.** A declaration marked `!important` beats one that isn't. Avoid it. It wins every fight, so the next person who needs to override it has to use `!important` too.
2. **Specificity.** The more specific selector wins.
3. **Order.** When specificity ties, the rule written later wins.

Specificity is a score with three columns, compared left to right:

| Selector part | Column | Example |
| --- | --- | --- |
| id | first | `#page-title` is 1-0-0 |
| class, attribute, pseudo-class | second | `.tip`, `a:hover` is 0-1-0 and 0-1-1 |
| type, pseudo-element | third | `p` is 0-0-1 |

```css
p { color: black; }              /* 0-0-1 */
.tip p { color: green; }         /* 0-1-1 */
#note { color: red; }            /* 1-0-0 */
```

A `<p id="note">` inside `.tip` is red. One id beats any number of classes. That's why you avoid ids in CSS: nothing short of another id overrides them.

Specificity is not about how long a selector is, or where it sits in the file. `.card .button` (0-2-0) beats `.button-danger` (0-1-0) even though `.button-danger` is written later.

One more rule: **inheritance**. Some properties, such as `color`, `font-family`, `font-size`, and `line-height`, pass down from parent to child. If you set `color` on `body`, every paragraph inside uses it unless a rule targets the paragraph directly. A rule that targets an element directly always beats an inherited value, whatever its specificity.

Try it. Add this to `01-recipe.css`:

```css
.tip { color: green; }
p { color: purple; }
```

Reload. The tip's paragraph is purple, not green, because `p` matches the paragraph directly and `.tip`'s green is only inherited. Fix it so the tip text is green, then delete both rules. (Write `.tip p { color: green; }`.)

### Debug with DevTools

When a style doesn't apply, inspect the element. In the **Styles** pane, declarations that lost the cascade are crossed out. The rule above the crossed-out one is the winner. Change the selector, the order, or the value, then check again. That's the whole skill. You practice it in exercise 2.

## Custom properties

Repeating `#9a3412` in twelve places makes it painful to change. A **custom property** stores a value under a name that starts with `--`. Define them on `:root` (the `<html>` element) so every element can read them:

```css
:root {
	--color-accent: #9a3412;
	--space-medium: 1rem;
}

h1 {
	color: var(--color-accent);
}

.tip {
	padding: var(--space-medium);
}
```

`var(--color-accent)` is replaced with the stored value. Change it in one place and every use updates. Custom properties inherit like `color` does.

Name them for their job (`--color-accent`), not their value (`--color-orange`). The day the accent turns blue, the name still fits.

## Exercises

The exercises are in `exercises/`. Open each file and read the comment at the top.

1. `01-recipe.css` styles `01-recipe.html`. The comment lists nine requirements. Keep the page open in your browser and reload as you go. Pick your own colors and spacing. The tests check that they have enough contrast and fit the rules, not that they match a design. Do not edit `01-recipe.html`.
2. `broken.css` styles `broken.html`, and five rules in it lose to other rules. Find each one in DevTools, fix the rule, and leave `broken.html` alone. Do not use `!important`. In your PR description, write one sentence per bug that says why the rule lost.

Run `npm test 04` after each change. When every test passes, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a `:hover` style to the links on `broken.html`.
- Define a dark theme: copy your seven custom properties into a `@media (prefers-color-scheme: dark)` block on `:root` with dark values. Turn on dark mode in your operating system and reload.
- Find a site you like, inspect its title, and read the rules that style it. Which selector does it use?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/04-css-fundamentals
git commit -m "Complete lesson 04 exercises"
git push -u origin lesson-04
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Colors and spacing come from custom properties, not repeated values
- Selectors are short and use classes, with no ids and no `!important`
- The recipe page looks designed: readable line length, clear heading sizes, enough whitespace
- Each of your five bug explanations names the winning rule and says why it won
