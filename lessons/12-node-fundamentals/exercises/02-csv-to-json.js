// A command-line tool that converts a CSV file to JSON.
//
//   node 02-csv-to-json.js books.csv             prints the JSON to the terminal
//   node 02-csv-to-json.js books.csv books.json  writes the JSON to a file
//   CSV_DELIMITER=";" node 02-csv-to-json.js books.csv   reads a file separated by semicolons
//
// Two parts: pure functions that do the converting, and main(), which reads, writes, and reports errors.
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Split CSV text into an array of rows, each row an array of strings.
// - Fields are separated by `delimiter`. Rows end with "\n" or "\r\n".
// - A field in double quotes can contain the delimiter, a line break, and a quote written as "".
//   The quotes themselves are not part of the value.
// - Ignore the blank line left by a final line break.
// parseRows('a,b\n1,"x, y"\n') returns [['a', 'b'], ['1', 'x, y']]
// parseRows('say\n"He said ""hi"""\n') returns [['say'], ['He said "hi"']]
export function parseRows(text, delimiter = ',') {
	// TODO
}

// Turn CSV text into an array of objects. The first row holds the keys. Every value stays a string.
// csvToObjects('title,year\nDune,1965\n') returns [{ title: 'Dune', year: '1965' }]
// Throw an Error if a row has a different number of fields than the header row. The message names
// the row by its line in the data, counting the header as row 1:
//   "Row 3 has 2 fields but the header has 3"
// A file with only a header gives []. An empty file gives [].
export function csvToObjects(text, delimiter = ',') {
	// TODO
}

// Run the conversion from the command line.
// - The first argument is the CSV file. The optional second argument is the output file.
// - The delimiter is the CSV_DELIMITER environment variable, or "," when it is not set.
// - The JSON is JSON.stringify(objects, null, 2) followed by a newline.
// - With an output file, write the JSON there and print nothing. Without one, print it to stdout.
// - On any error (no arguments, a missing file, a bad row), print "csv-to-json: <message>" to stderr,
//   write nothing, and set process.exitCode = 1.
//     No arguments:  "csv-to-json: usage: node 02-csv-to-json.js <input.csv> [output.json]"
//     Missing file:  "csv-to-json: cannot read <path>"
function main() {
	// TODO
}

// Run main() only when this file is started with `node`, not when a test imports it.
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
