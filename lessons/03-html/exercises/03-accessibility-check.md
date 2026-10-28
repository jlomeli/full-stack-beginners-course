# Accessibility check

Open `02-signup.html` in Chrome. Use a real browser, not the test output. Do each check, then fill in every blank. Write in your own words.

## 1. The accessibility tree

Open DevTools, select an element in the **Elements** panel, and open the **Accessibility** pane next to **Styles**. It shows the **Name** and **Role** the browser gives that element. If you can't see the pane, click the **>>** icon at the end of the tabs.

| Element | Role | Name |
| --- | --- | --- |
| The Full name input | | |
| The Password input | | |
| The `<fieldset>` | | |
| The submit button | | |
| The `<form>` | | |

- Which of these names came from a `<label>`?
- Which came from a different element or attribute? Name it.
- Open the password input's pane and find **Description**. What does it say, and which attribute put it there?

## 2. The keyboard

Click the page background, then press Tab to move through the form. Don't touch the mouse.

- List the order the focus visits, from the first field to the button:
- Can you pick an experience level with the arrow keys once focus is on the radios? Which key moves between them?
- Can you tick the checkbox with the space bar?
- Does every focused control show a visible outline?

## 3. The browser's validation

Click **Create account** with every field empty. The page doesn't send anything.

- Which field does the browser complain about first, and what does the message say?
- Type `ada` into Email and click again. What does the message say now?
- Type `short` into Password. What does the message say?
- Which of these three messages did you write? (If your answer is "none", that's right: the attributes did the work.)

## 4. Lighthouse

In DevTools, open the **Lighthouse** tab, choose **Accessibility** only, and click **Analyze page load**.

- Score:
- List each failed audit, or write "none":
- If there were failures, what did you change to fix them?

## 5. Break it on purpose

Make one change to a copy of the page, reload, and look at the accessibility tree again. Pick one:

- Remove a `for` attribute from a label.
- Replace a `<button>` with a `<div>` that says "Create account".
- Skip from `<h1>` to `<h3>`.

- Your change:
- What happened to the **Name** or **Role** in the Accessibility pane, or to the Lighthouse score?
- Why would a screen reader user notice?

Undo the change before you commit.
