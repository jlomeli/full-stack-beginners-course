// The quiz page. Read app.test.js for the exact behavior.
//
// startQuiz(root, questions) draws the quiz inside the `root` element and handles every click.
//
// While a question is open:
// - "Question 1 of 5" shows where the player is.
// - The prompt is a heading.
// - Each choice is a <button> whose text is the choice.
//
// After the player picks a choice:
// - Every choice button is disabled, so the player can't answer twice.
// - The page says "Correct!", or "Wrong. The answer is <the correct choice>."
// - A "Next" button appears. Clicking it shows the next question, or the results.
//
// After the last question:
// - The page says "You scored 3 out of 5."
// - A "Play again" button starts the quiz over.
//
// Use the functions in quiz.js for the rules. This file only draws the page and handles clicks.
import { answer, createQuiz, currentQuestion, isFinished, progress, score } from './quiz.js';

export function startQuiz(root, questions) {
	// TODO
}
