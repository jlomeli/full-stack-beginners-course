# 05. CSS layout: flexbox, grid, responsive design

In this lesson you learn to place things on a page. You rebuild three layouts with flexbox and grid, then use them in a project: your own personal portfolio site. This is a three-session lesson: the layouts take most of the first session and the project fills the rest.

## What you will be able to do

- Lay out components with flexbox
- Lay out pages with grid
- Make a page work from 320px to 1440px with media queries

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-05
```

Run the tests for this lesson:

```sh
npm test 05
```

You see 37 failing tests. 21 belong to the three layout exercises and 16 to the portfolio project. Your job this lesson is to make them pass, then finish the parts a test can't check.

## Normal flow

Without layout CSS, the browser stacks **block** elements (`div`, `p`, `h1`, `section`) top to bottom, each as wide as its container, and runs **inline** elements (`a`, `strong`, `span`) left to right inside a line. That is **normal flow**. Every layout tool below changes how some elements are placed, and leaves the rest in normal flow.

Two tools, two jobs:

- **Flexbox** lays items out along one line, a row or a column.
- **Grid** lays items out in rows and columns at once.

## Flexbox

Turn on flexbox for a **container**. Its direct children become **flex items**:

```html
<nav class="toolbar">
	<a href="#">Home</a>
	<a href="#">Recipes</a>
	<a href="#">About</a>
</nav>
```

```css
.toolbar {
	display: flex;
}
```

The links now sit in a row. The row is the **main axis**. The direction across it is the **cross axis**. Flexbox's properties control both:

```css
.toolbar {
	display: flex;
	justify-content: space-between; /* spacing along the main axis */
	align-items: center;            /* alignment along the cross axis */
	gap: 1rem;                      /* space between items */
}
```

| Property | Common values | Does |
| --- | --- | --- |
| `flex-direction` | `row` (default), `column` | Picks the main axis |
| `justify-content` | `flex-start`, `center`, `flex-end`, `space-between` | Places items along the main axis |
| `align-items` | `stretch` (default), `center`, `flex-start`, `flex-end` | Places items along the cross axis |
| `flex-wrap` | `nowrap` (default), `wrap` | Lets items move to a new line |
| `gap` | `1rem` | Space between items |

Try it. Add three links inside a `<nav class="toolbar">` in a scratch HTML file, with the CSS above. Change `justify-content` to `center` and `flex-end`. Change `flex-direction` to `column`. Watch what moves.

### Sizing flex items

Three properties on an **item** decide how it shares space. The shorthand is `flex: grow shrink basis`:

- `flex-basis` is the size it starts at before sharing.
- `flex-grow` says how much of the leftover space it takes. `1` on every item shares it equally.
- `flex-shrink` says how much it gives up when there isn't enough room.

```css
.card {
	flex: 1 1 15rem;
}
```

Read that as: start at 15rem, grow to fill the row, shrink if you must. With `flex-wrap: wrap` on the container, cards that can't fit at 15rem wrap to the next line. Three cards fit on a wide window. On a phone they stack. No media query needed.

One more tool. Inside a flex container, an `auto` margin soaks up all the free space on its side. Put `margin-top: auto` on the last child of a column and it sits at the bottom.

## Grid

Flexbox arranges one line at a time. For rows and columns together, use grid:

```css
.gallery {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}
```

`grid-template-columns` defines the column **tracks**. `repeat(3, 1fr)` means three columns. `fr` is a fraction of the free space, so `1fr 2fr` makes the second column twice as wide as the first. Rows are created as needed. The children fill cells in order.

Mix fixed and flexible tracks: `14rem 1fr` is a 14rem sidebar and a content column that takes the rest.

An item can span several tracks:

```css
.tile-wide {
	grid-column: span 2;
}
```

### Grid areas

For a page layout, name the regions and draw the layout as text:

```css
.page {
	display: grid;
	grid-template-columns: 14rem 1fr;
	grid-template-areas:
		'header header'
		'sidebar content'
		'footer footer';
}

.page-header { grid-area: header; }
.sidebar     { grid-area: sidebar; }
.content     { grid-area: content; }
.page-footer { grid-area: footer; }
```

Each quoted string is a row. Each word is a cell. Repeating a name makes that region span cells. The HTML order doesn't change where things land, which is useful and also a trap: keyboard users and screen readers still move through the page in HTML order, so keep that order sensible.

Try it. Copy the example into a scratch page with four elements that have those classes. Give each a background color. Change the area strings and watch the layout move.

### Which one?

- A row of buttons, a nav bar, a card with an image beside text: flexbox.
- A page, a gallery, a dashboard: grid.
- They nest. A grid cell often holds a flex container.

## Responsive design

People view your page on a 320px phone and a 1440px monitor. **Responsive design** means one page that works on both.

Start with the viewport tag in your `<head>`. You already have it:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Without it, phones pretend to be 980px wide and shrink the page.

Then write **mobile first**. The base styles make the page work at 320px. Add **media queries** that change the layout when the window grows:

```css
.gallery {
	display: grid;
	grid-template-columns: 1fr;
}

@media (min-width: 40rem) {
	.gallery {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 64rem) {
	.gallery {
		grid-template-columns: repeat(4, 1fr);
	}
}
```

`@media (min-width: 40rem)` means "from 40rem (640px) wide and up". The rules inside apply on top of the base. Later queries override earlier ones, so list them from smallest to largest. Use `rem` for breakpoints so they follow the reader's font size.

Don't choose breakpoints from device names. Drag the browser narrower and widen it until the layout looks bad. Put a breakpoint there.

### Test it in DevTools

Open DevTools and click the **device toolbar** icon (a phone beside a tablet). Pick **Responsive**, then drag the handle or type a width. Check 320px, 768px, and 1440px. Look for text that overlaps and for a horizontal scrollbar. A scrollbar means something is wider than the window. Common causes are a fixed `width` in px and an image without `max-width: 100%`.

## Exercises

Each layout exercise has an HTML file you don't edit, a CSS file you do, and a test. The comment at the top of the CSS file describes the target layout with a text sketch, because the layout is the spec. Keep the page open in your browser while you work, and resize the window to compare it with the sketch.

1. `01-flex.css` builds a header and a row of equal-height plan cards with flexbox.
2. `02-grid.css` builds a gallery that goes from one to two to four columns.
3. `03-page.css` builds a page with a header, sidebar, content, and footer that collapses to one column.

Then do the project.

### Project 1: personal portfolio site

Work in the `project/` folder. Open `project/README.md` for the brief, the plan for the three sessions, and the rubric your reviewer uses. Write `project/index.html` and `project/styles.css`. `npm test 05` checks the structure: landmarks, headings, labels, links, and the CSS rules in the brief. Your reviewer grades the rest.

Add three screenshots of your page (320px, 768px, and 1440px wide) to your PR description. Drag the images into the description box on GitHub.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Rebuild `02-grid.css` with `repeat(auto-fit, minmax(14rem, 1fr))` and no media queries. Which version do you prefer, and why?
- Add `scroll-behavior: smooth` to `html` so the nav links glide.
- Add a visible `:focus-visible` outline to every link and button in your portfolio.
- Add a dark theme with `@media (prefers-color-scheme: dark)` that swaps your custom properties.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/05-css-layout
git commit -m "Complete lesson 05 exercises and portfolio"
git push -u origin lesson-05
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- The portfolio rubric in `project/README.md`, row by row
- Flexbox for one-dimensional layout and grid for two-dimensional layout, not the other way around
- Mobile-first CSS: base styles for 320px, with `min-width` queries layered on top
- Screenshots at three widths in the PR, and no horizontal scroll in any of them
- Writing in the portfolio that sounds like you and says something specific
