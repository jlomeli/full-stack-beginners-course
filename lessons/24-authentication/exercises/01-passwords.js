import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Store a password so that a stolen database doesn't reveal it.
//
// hashPassword(password) resolves to a string with three parts joined by "$":
//
//   scrypt$<salt>$<hash>
//
// - salt is 16 random bytes written as hex. Use randomBytes, and make a new salt on every call.
// - hash is the 64-byte output of crypto.scrypt(password, saltBytes, 64), written as hex.
//   scrypt's callback style needs a promise around it. See the lesson for how.
//
// verifyPassword(password, stored) resolves to true when `password` is the one that produced `stored`,
// and false otherwise.
// - Hash the attempt with the salt inside `stored`, then compare the two hashes with timingSafeEqual.
//   Don't compare them with ===.
// - A stored value that isn't in the format above (a wrong prefix, a missing part, an empty string, or a
//   hash of the wrong length) resolves to false. It never throws. timingSafeEqual throws when its two
//   buffers have different lengths, so check the length yourself first.
export async function hashPassword(password) {
	// TODO
}

export async function verifyPassword(password, stored) {
	// TODO
}
