// A command-line tool that counts lines, words, and characters in text files, like the Unix `wc`.
//
//   node 01-word-count.js notes.txt
//   node 01-word-count.js notes.txt todo.txt
//
// Two parts: pure functions that do the counting, and main(), which reads files and prints.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Count the contents of a string. Returns { lines, words, chars }.
// - lines: the number of "\n" characters. "a\nb\n" has 2 lines. "a\nb" has 1, as in `wc`.
// - words: runs of non-whitespace characters. "  hello   big world " has 3 words.
// - chars: the length of the string.
// countText('one two\nthree\n') returns { lines: 2, words: 3, chars: 14 }
export function countText(text) {
	// TODO
}

// Format one row of output: each number right-aligned in a column 6 characters wide, the three columns
// side by side, then a space and the label.
// With no label, leave off the space and the label.
// formatCounts({ lines: 2, words: 3, chars: 14 }, 'notes.txt') returns '     2     3    14 notes.txt'
// formatCounts({ lines: 2, words: 3, chars: 14 }) returns '     2     3    14'
export function formatCounts({ lines, words, chars }, label) {
	// TODO
}

// Read the file paths from process.argv.slice(2) and print one formatCounts row per file to stdout.
// - When two or more files were counted, print a final row labeled "total" with the sums.
//   A file that could not be read is not counted.
// - A file that cannot be read: print "word-count: <path>: No such file" to stderr and carry on
//   with the other files. After all the files, exit with code 1 so a script can tell something failed.
//   Set process.exitCode = 1. Do not call process.exit() in the middle.
// - With no file paths, print "Usage: node 01-word-count.js <file>..." to stderr and exit with code 2.
function main() {
	// TODO
}

// Run main() only when this file is started with `node`, not when a test imports it.
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
