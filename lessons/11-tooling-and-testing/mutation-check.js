// Runs one of your test files against several versions of the code it tests.
// Each version is a copy of the folder with some files swapped for broken ones ("mutants").
// A good test suite passes against the real code and fails against every mutant.
// You don't need to change or understand this file to finish the lesson.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const nodeModules = fileURLToPath(new URL('../../node_modules', import.meta.url));
const vitest = join(nodeModules, 'vitest', 'vitest.mjs');
const isTestFile = (path) => /\.test\.[cm]?[jt]sx?$/.test(path);

// Returns source with `find` replaced by `replace`. Throws unless `find` appears exactly once,
// so a mutant can't silently stop applying when the file it breaks changes.
export function replaceOnce(source, find, replace) {
	const parts = source.split(find);
	if (parts.length !== 2) {
		throw new Error(`Expected to find this text exactly once, found it ${parts.length - 1} times:\n${find}`);
	}
	return parts.join(replace);
}

// folder: the folder to copy for each version
// testFile: the one test file inside it to run
// versions: { versionName: { fileName: newContents } }. Use {} for the unchanged folder.
// Returns { versionName: { total, failed } }: how many tests ran and how many failed.
export function runTestFileAgainst({ folder, testFile, versions }) {
	const root = mkdtempSync(join(tmpdir(), 'mutants-'));
	try {
		symlinkSync(nodeModules, join(root, 'node_modules'), 'junction');
		for (const [name, files] of Object.entries(versions)) {
			const dir = join(root, name);
			cpSync(folder, dir, {
				recursive: true,
				filter: (src) => !src.includes(`${sep}node_modules`) && (!isTestFile(src) || basename(src) === testFile),
			});
			for (const [file, contents] of Object.entries(files)) {
				writeFileSync(join(dir, file), contents);
			}
		}

		const output = join(root, 'results.json');
		const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST') && key !== 'NODE_OPTIONS'));
		const run = spawnSync(process.execPath, [vitest, 'run', '--root', root, '--reporter=json', `--outputFile=${output}`], {
			cwd: root,
			env,
			encoding: 'utf8',
		});
		if (!existsSync(output)) {
			throw new Error(`Vitest did not produce a report.\n${run.stdout}\n${run.stderr}`);
		}

		const report = JSON.parse(readFileSync(output, 'utf8'));
		const results = Object.fromEntries(Object.keys(versions).map((name) => [name, { total: 0, failed: 0 }]));
		for (const file of report.testResults) {
			const segments = file.name.split(sep);
			const name = segments[segments.indexOf(basename(root)) + 1];
			if (!results[name]) continue;
			results[name].total += file.assertionResults.length;
			results[name].failed += file.assertionResults.filter((assertion) => assertion.status === 'failed').length;
		}
		return results;
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}
