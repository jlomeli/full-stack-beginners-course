// Runs the tests for one lesson.
// Usage: node scripts/test-lesson.mjs <lesson>   e.g. 06, lesson-06, or a branch like lesson-06-retry
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

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

console.log(`Testing lessons/${folder}`);
const { status } = spawnSync('npx', ['vitest', 'run', '--passWithNoTests', `lessons/${folder}`], { stdio: 'inherit' });
process.exit(status ?? 1);
