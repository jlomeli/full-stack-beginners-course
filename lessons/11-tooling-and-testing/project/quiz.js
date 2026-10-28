// The quiz rules, with no DOM code. app.js uses these functions to draw the page.
//
// A question looks like this. `answer` is the index of the correct choice:
//   { prompt: 'What is 2 + 2?', choices: ['3', '4', '5'], answer: 1 }
//
// A quiz is a plain object, and you decide what goes in it. Pick the smallest thing that
// lets you write every function below. None of these functions changes the quiz you pass in.
// answer() returns a new quiz instead.

// Start a quiz over an array of questions. Nothing is answered yet.
export function createQuiz(questions) {
	// TODO
}

// Return the question the player is on, or null once every question is answered.
export function currentQuestion(quiz) {
	// TODO
}

// Answer the current question with the index of the choice the player picked.
// Return a new quiz that has moved on to the next question.
// Throw an Error if every question is already answered.
export function answer(quiz, choiceIndex) {
	// TODO
}

// Return true once every question is answered.
export function isFinished(quiz) {
	// TODO
}

// Return how many of the answers so far are correct.
export function score(quiz) {
	// TODO
}

// Return { answered, total }: how many questions are answered so far, and how many there are.
export function progress(quiz) {
	// TODO
}
