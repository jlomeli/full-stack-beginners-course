// Runs the tests for one lesson. If the lesson has a tsconfig.json, type-checks it first.
// Usage: node scripts/test-lesson.mjs <lesson>   e.g. 06, lesson-06, or a branch like lesson-06-retry
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const arg = process.argv[2] ?? '';
const id = arg.match(/^(?:lesson-)?(\d{2})(?:-|$)/)?.[1];
if (!id) {
	console.error(`"${arg}" does not name a lesson. Name your branch lesson-NN, for example lesson-06.`);
	process.exit(1);
}

const folder = readdirSync(new URL('../lessons', import.meta.url)).find((name) => name.startsWith(`${id}-`));
if (!folder) {
	console.error(`No lesson ${id} in lessons/.`);
	process.exit(1);
}
const dir = `lessons/${folder}`;

const run = (args) => spawnSync('npx', args, { stdio: 'inherit' }).status ?? 1;

if (existsSync(`${dir}/tsconfig.json`)) {
	console.log(`Type-checking ${dir}`);
	if (run(['tsc', '--noEmit', '-p', dir]) !== 0) process.exit(1);
}

console.log(`Testing ${dir}`);
process.exit(run(['vitest', 'run', '--passWithNoTests', dir]));
