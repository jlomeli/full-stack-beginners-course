import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
	const salt = randomBytes(16);
	const key = await scrypt(password, salt, 64);
	return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
	const [salt, key] = stored.split(':');
	const candidate = await scrypt(password, Buffer.from(salt, 'hex'), 64);
	return timingSafeEqual(candidate, Buffer.from(key, 'hex'));
}
