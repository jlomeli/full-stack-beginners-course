import { afterAll, describe, expect, test } from 'vitest';
import { daysOverdue, dueDate } from './02-dates.js';

const originalTZ = process.env.TZ;
afterAll(() => {
	if (originalTZ === undefined) delete process.env.TZ;
	else process.env.TZ = originalTZ;
});

// The same code must give the same answer on a laptop in any timezone. Each test runs once per timezone.
const zones = ['UTC', 'Pacific/Auckland', 'America/Los_Angeles', 'Asia/Kolkata'];

describe.each(zones)('with the computer set to %s', (zone) => {
	function inZone(fn) {
		process.env.TZ = zone;
		return fn();
	}

	test.each([
		['2026-03-01T03:00:00Z', '2026-03-15'],
		['2026-03-01T10:00:00Z', '2026-03-15'],
		['2026-03-01T20:00:00Z', '2026-03-15'],
		['2026-03-01T23:59:59Z', '2026-03-15'],
		['2026-03-02T00:00:00Z', '2026-03-16'],
		['2026-12-25T12:00:00Z', '2027-01-08'],
		['2028-02-20T12:00:00Z', '2028-03-05'],
	])('dueDate(%s) is %s', (borrowedAt, expected) => {
		expect(inZone(() => dueDate(borrowedAt))).toBe(expected);
	});

	test('dueDate accepts a Date and a custom loan length', () => {
		expect(inZone(() => dueDate(new Date('2026-03-01T03:00:00Z'), 21))).toBe('2026-03-22');
	});

	test('daysOverdue is 0 through the end of the due date', () => {
		expect(inZone(() => daysOverdue('2026-03-01T03:00:00Z', '2026-03-15T23:59:59Z'))).toBe(0);
	});

	test('daysOverdue is 1 right after midnight UTC on the day after the due date', () => {
		expect(inZone(() => daysOverdue('2026-03-01T03:00:00Z', '2026-03-16T00:00:01Z'))).toBe(1);
	});

	test('daysOverdue counts whole days late', () => {
		expect(inZone(() => daysOverdue('2026-03-01T20:00:00Z', '2026-03-18T09:00:00Z'))).toBe(3);
	});

	test('daysOverdue is 0 for a book that is not due yet', () => {
		expect(inZone(() => daysOverdue('2026-03-01T20:00:00Z', '2026-03-05T09:00:00Z'))).toBe(0);
	});
});
