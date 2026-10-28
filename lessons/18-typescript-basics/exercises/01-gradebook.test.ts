import { describe, expect, expectTypeOf, test } from 'vitest';
import {
	average,
	classReport,
	letterGrade,
	passingStudents,
	studentAverage,
	type ReportRow,
	type Student,
} from './01-gradebook.ts';

const ada: Student = { name: 'Ada', scores: [90, 95, 100] };
const grace: Student = { name: 'Grace', scores: [70, 80] };
const linus: Student = { name: 'Linus', scores: [40, 55] };

describe('types', () => {
	test('Student has a name and a list of scores', () => {
		expectTypeOf<Student>().toEqualTypeOf<{ name: string; scores: number[] }>();
	});
	test('ReportRow has a name, an average, and a grade', () => {
		expectTypeOf<ReportRow>().toEqualTypeOf<{ name: string; average: number; grade: string }>();
	});
	test('average takes an array of numbers and returns a number', () => {
		expectTypeOf(average).toEqualTypeOf<(numbers: number[]) => number>();
	});
	test('studentAverage takes a Student and returns a number', () => {
		expectTypeOf(studentAverage).toEqualTypeOf<(student: Student) => number>();
	});
	test('letterGrade takes a number and always returns a string', () => {
		expectTypeOf(letterGrade).toEqualTypeOf<(score: number) => string>();
	});
	test('classReport takes Students and returns ReportRows', () => {
		expectTypeOf(classReport).toEqualTypeOf<(students: Student[]) => ReportRow[]>();
	});
	test('passingStudents takes Students and an optional pass mark, and returns names', () => {
		expectTypeOf(passingStudents).toEqualTypeOf<(students: Student[], passMark?: number) => string[]>();
	});
});

describe('average', () => {
	test('is the mean of the numbers', () => expect(average([90, 95, 100])).toBe(95));
	test('is 0 for an empty list', () => expect(average([])).toBe(0));
});

describe('studentAverage', () => {
	test("is the mean of the student's scores", () => {
		expect(studentAverage(ada)).toBe(95);
		expect(studentAverage(grace)).toBe(75);
	});
});

describe('letterGrade', () => {
	test('gives A, B, C, and D at their lower boundaries', () => {
		expect(letterGrade(90)).toBe('A');
		expect(letterGrade(80)).toBe('B');
		expect(letterGrade(70)).toBe('C');
		expect(letterGrade(60)).toBe('D');
	});
	test('gives the lower grade just under a boundary', () => expect(letterGrade(89.9)).toBe('B'));
	test('gives F below 60', () => {
		expect(letterGrade(59)).toBe('F');
		expect(letterGrade(0)).toBe('F');
	});
});

describe('classReport', () => {
	test('has a row per student with their average and grade', () => {
		expect(classReport([ada, grace, linus])).toEqual([
			{ name: 'Ada', average: 95, grade: 'A' },
			{ name: 'Grace', average: 75, grade: 'C' },
			{ name: 'Linus', average: 47.5, grade: 'F' },
		]);
	});
	test('is empty for an empty class', () => expect(classReport([])).toEqual([]));
});

describe('passingStudents', () => {
	test('uses a pass mark of 60 by default', () => {
		expect(passingStudents([ada, grace, linus])).toEqual(['Ada', 'Grace']);
	});
	test('uses the pass mark you give it', () => {
		expect(passingStudents([ada, grace, linus], 80)).toEqual(['Ada']);
	});
});
