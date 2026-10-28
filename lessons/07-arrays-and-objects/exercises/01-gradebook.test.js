import { describe, expect, test } from 'vitest';
import { average, passingStudents, studentAverages, topStudent } from './01-gradebook.js';

const students = [
	{ name: 'Ada', scores: [90, 85, 95] },
	{ name: 'Grace', scores: [70, 95] },
	{ name: 'Alan', scores: [40, 55, 61] },
];

describe('average', () => {
	test('averages whole numbers', () => expect(average([80, 90, 100])).toBe(90));
	test('can return a decimal', () => expect(average([1, 2])).toBe(1.5));
	test('the average of an empty array is 0', () => expect(average([])).toBe(0));
});

describe('studentAverages', () => {
	test('gives each student a name and an average, in the same order', () => {
		expect(studentAverages(students)).toEqual([
			{ name: 'Ada', average: 90 },
			{ name: 'Grace', average: 82.5 },
			{ name: 'Alan', average: 52 },
		]);
	});
	test('a student with no scores averages 0', () => {
		expect(studentAverages([{ name: 'New', scores: [] }])).toEqual([{ name: 'New', average: 0 }]);
	});
	test('leaves the students it was given unchanged', () => {
		const before = structuredClone(students);
		expect(studentAverages(students)).toHaveLength(3);
		expect(students).toEqual(before);
	});
});

describe('passingStudents', () => {
	test('returns the names of students at or above the pass mark', () => {
		expect(passingStudents(students, 82.5)).toEqual(['Ada', 'Grace']);
	});
	test('returns an empty array when nobody passes', () => {
		expect(passingStudents(students, 99)).toEqual([]);
	});
});

describe('topStudent', () => {
	test('returns the name of the student with the highest average', () => {
		expect(topStudent(students)).toBe('Ada');
	});
	test('the first student wins a tie', () => {
		const tied = [
			{ name: 'Linus', scores: [80] },
			{ name: 'Margaret', scores: [100, 60] },
		];
		expect(topStudent(tied)).toBe('Linus');
	});
	test('returns null when there are no students', () => {
		expect(topStudent([])).toBe(null);
	});
});
