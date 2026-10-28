// Request handlers for the library API. A request body arrives as unknown, because anyone can send anything.
// Zod checks the body once at the edge, and after that the rest of the code works with real types.
//
// The schemas decide what a valid body is:
// - newBookSchema: title and author are strings with at least one character once trimmed of spaces, and year is
//   a whole number from 1000 to 2100. The parsed values have their spaces trimmed.
// - newMemberSchema: name is a string with at least one character once trimmed, and email is a valid email
//   address. The parsed email is in lowercase.
// - borrowRequestSchema: bookId and memberId are whole numbers above 0.
// Keys that a schema does not list are dropped from the parsed value.
//
// Write the schemas, then the functions. Keep the types on the functions.
import { z } from 'zod';
import {
	addBook,
	addMember,
	borrowBook,
	type Book,
	type Library,
	type Loan,
	type Member,
	type Result,
} from './01-library.ts';

export const newBookSchema = z.object({
	// TODO
});

export const newMemberSchema = z.object({
	// TODO
});

export const borrowRequestSchema = z.object({
	// TODO
});

// These types come from the schemas, so they can never disagree with them.
export type NewBookRequest = z.infer<typeof newBookSchema>;
export type NewMemberRequest = z.infer<typeof newMemberSchema>;
export type BorrowRequest = z.infer<typeof borrowRequestSchema>;

// Checks body against the schema. Returns { ok: true, value } with the parsed value, or { ok: false, error }.
// The error is a string that names each field that failed, for example "year: Too small: ...".
// Zod's safeParse never throws, and its issues list says which field failed and why.
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): Result<T> {
	// TODO
}

// Parses the body as a new book and adds it to the library. Returns the new book, or the parse error.
export function handleAddBook(library: Library, body: unknown): Result<Book> {
	// TODO
}

// Parses the body as a new member and adds them. Returns the new member, or the parse error,
// or the "email already registered" error from addMember.
export function handleAddMember(library: Library, body: unknown): Result<Member> {
	// TODO
}

// Parses the body as a borrow request and lends the book. Returns the loan, or the parse error,
// or the error from borrowBook.
export function handleBorrow(library: Library, body: unknown, now: Date): Result<Loan> {
	// TODO
}
