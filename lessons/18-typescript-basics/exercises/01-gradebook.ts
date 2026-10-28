// Gradebook statistics, written in plain JavaScript for lesson 07.
//
// Convert this file to TypeScript:
// - Export a type named Student: an object with a name (string) and scores (an array of numbers).
// - Export a type named ReportRow: an object with a name (string), an average (number), and a grade (string).
// - Give every parameter and every return value a type.
// - Fix each error the compiler reports. Some of them are bugs that were here all along.
//
// The comment above each function is its spec. Keep the behavior it describes.

// The mean of a list of numbers, or 0 for an empty list.
export function average(numbers) {
	if (numbers.length === 0) {
		return 0;
	}
	let total = 0;
	for (const number of numbers) {
		total += number;
	}
	return total / numbers.length;
}

// The mean of one student's scores.
export function studentAverage(student) {
	return average(student.score);
}

// "A" for 90 and up, "B" for 80 and up, "C" for 70 and up, "D" for 60 and up, otherwise "F".
export function letterGrade(score) {
	if (score >= 90) {
		return 'A';
	}
	if (score >= 80) {
		return 'B';
	}
	if (score >= 70) {
		return 'C';
	}
	if (score >= 60) {
		return 'D';
	}
}

// One row per student, in the same order: the student's name, average, and letter grade.
export function classReport(students) {
	return students.map((student) => {
		const studentAverageScore = studentAverage(student);
		return { name: student.name, average: studentAverageScore, grade: letterGrade(studentAverageScore) };
	});
}

// The names of the students whose average is at least passMark. passMark is 60 when it isn't given.
export function passingStudents(students, passMark = 60) {
	return students.filter((student) => studentAverage(student) >= passMark).map((student) => student.name);
}
