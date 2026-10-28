# Project 1: personal portfolio site

Build a one-page portfolio that introduces you, shows three things you made, and gives people a way to contact you. You write it in `index.html` and `styles.css` in this folder. Everything else you need is in lessons 02 to 05.

This lesson takes three sessions. Do the three layout exercises in `exercises/` in session 1, then plan the project like this:

1. **Session 1 (after the exercises): content and structure.** Write the HTML. No styling beyond the browser defaults. Run `npm test 05` and get the structure tests passing.
2. **Session 2: phone layout and style.** Link `styles.css`. Define custom properties, choose colors and type, and make the page look good at 320px wide.
3. **Session 3: wider layouts and polish.** Add `min-width` media queries, test at 320px, 768px, and 1440px, fix what breaks, and write your PR description.

## Brief

Your reader is someone deciding whether to talk to you: a recruiter, an instructor, a client. They skim. Make the page skimmable.

The page has:

- A header with your name and a navigation with links to the three sections below.
- An **About** section (`id="about"`) with a photo or illustration and a paragraph of at least 20 words in your own voice.
- A **Projects** section (`id="projects"`) with at least three projects as `<article>` elements. Each has a heading, a one or two sentence description, and a link. Use real work from this course (the recipe page, the broken-CSS fix, the gallery) or invent honest placeholders. Do not invent jobs you haven't had.
- A **Contact** section (`id="contact"`) with a form: name, email (required), and message, each with a visible label, and a submit button. The form doesn't send anything yet. You build the server that receives it in lesson 13.
- A footer.

Technical requirements:

- Mobile first. The base styles are the 320px layout. Media queries use `min-width`.
- The project articles sit in a grid: one column on a phone, two or more on a wide window.
- The header uses flexbox.
- At least four custom properties on `:root`, used throughout (no repeated hex codes).
- Body text has at least 4.5:1 contrast against its background.
- Images have `alt` text and never overflow their container (`max-width: 100%`).
- No horizontal scrolling at any width from 320px to 1440px. Check in DevTools device mode.
- No fixed widths wider than 400px. Use `max-width` on containers.

## Run the checks

```sh
npm test 05
```

The structure tests check landmarks, headings, labels, links, and the CSS rules above. Passing them is necessary and not sufficient. The rubric below is what your reviewer grades.

## Rubric

Your reviewer scores each row 0 to 2: 0 is missing, 1 is partly there, 2 is solid.

| Row | What a 2 looks like |
| --- | --- |
| Structure | Landmarks, one `h1`, headings in order, a nav that jumps to every section |
| Content | Specific, honest, and written for the reader. No placeholder text left |
| Responsive | Works at 320px, 768px, and 1440px with no horizontal scroll and no overlapping text |
| Layout | Flexbox for the header, grid for the projects, and spacing that is consistent |
| Visual design | A small palette, a clear type scale, enough whitespace, readable contrast |
| CSS quality | Custom properties, short class selectors, no `!important`, no repeated values |
| Accessibility | Labels on every field, alt text, visible keyboard focus, links that make sense out of context |
| PR | Description with screenshots at three widths and one thing you'd change with more time |

## Checklist before you submit

- [ ] `npm test 05` passes
- [ ] I opened the page at 320px, 768px, and 1440px in DevTools device mode
- [ ] I pressed Tab through the whole page and could see where focus was
- [ ] I read the page aloud and cut anything that sounded like a template
- [ ] My PR description has three screenshots and a note on what I'd change
