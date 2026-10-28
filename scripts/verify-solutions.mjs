// Checks every lesson that has tests: the starter code must fail them and the reference solution must pass them.
// Usage: node scripts/verify-solutions.mjs <solutions-repo> [lesson ids...]
// The solutions repo mirrors this repo's lessons/ layout and holds only the files a student changes.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const [solutionsArg, ...only] = process.argv.slice(2);
if (!solutionsArg) {
	console.error('Usage: node scripts/verify-solutions.mjs <solutions-repo> [lesson ids...]');
	process.exit(2);
}
const solutions = resolve(solutionsArg);

const hasTests = (dir) =>
	readdirSync(dir, { recursive: true }).some((file) => /\.test\.[cm]?[jt]sx?$/.test(String(file))) || existsSync(join(dir, 'tsconfig.json'));

const runTests = (cwd, id) => spawnSync('node', ['scripts/test-lesson.mjs', id], { cwd, encoding: 'utf8' }).status;

const lessons = readdirSync(join(root, 'lessons'))
	.filter((name) => /^\d{2}-/.test(name))
	.filter((name) => only.length === 0 || only.includes(name.slice(0, 2)));

let failed = 0;
for (const folder of lessons) {
	const id = folder.slice(0, 2);
	if (!hasTests(join(root, 'lessons', folder))) {
		console.log(`${id}  no tests`);
		continue;
	}
	const solution = join(solutions, 'lessons', folder);
	if (!existsSync(solution)) {
		console.log(`${id}  NOT VERIFIED  no solution at ${solution}`);
		failed++;
		continue;
	}

	const starterFails = runTests(root, id) !== 0;

	const work = mkdtempSync(join(tmpdir(), `verify-${id}-`));
	cpSync(root, work, { recursive: true, filter: (src) => !src.includes('node_modules') && !src.includes('/.git') });
	symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'));
	cpSync(solution, join(work, 'lessons', folder), { recursive: true });
	const solutionPasses = runTests(work, id) === 0;
	rmSync(work, { recursive: true, force: true });

	const ok = starterFails && solutionPasses;
	if (!ok) failed++;
	console.log(`${id}  ${ok ? 'VERIFIED' : 'NOT VERIFIED'}  starter ${starterFails ? 'fails' : 'PASSES'}, solution ${solutionPasses ? 'passes' : 'FAILS'}`);
}
process.exit(failed ? 1 : 0);
