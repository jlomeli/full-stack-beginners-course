#!/usr/bin/env node
// Gathers everything needed to review one student PR, and posts the drafted review as a PENDING review.
//
//   review.mjs fetch <pr-url>               Clone the PR's head, run its lesson checks, write the review packet
//   review.mjs post <pr-url> <draft.json>   Post draft.json as a pending review (only you see it until you submit it)
//
// Work goes in /tmp/review/<owner>-<repo>-<number>/. The packet survives; delete it yourself when done.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const course = resolve(import.meta.dirname, '../../..');
const [command, prArg, draftArg] = process.argv.slice(2);

const match = prArg?.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
if (!['fetch', 'post'].includes(command) || !match || (command === 'post' && !draftArg)) {
	console.error('Usage: review.mjs fetch <pr-url> | review.mjs post <pr-url> <draft.json>');
	process.exit(2);
}
const [, owner, repo, number] = match;
const dir = `/tmp/review/${owner}-${repo}-${number}`;
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const LABEL = /^(fix|question|suggestion|nit|praise):\s/;

// Lines a review comment can attach to: added or context lines on the new side of each hunk.
function commentableLines(diff) {
	const lines = new Map();
	let file = null;
	let line = 0;
	for (const text of diff.split('\n')) {
		if (text.startsWith('+++ ')) {
			file = text === '+++ /dev/null' ? null : text.slice(6);
			if (file) lines.set(file, new Set());
		} else if (text.startsWith('@@')) {
			line = Number(text.match(/\+(\d+)/)[1]);
		} else if (file && (text.startsWith('+') || text.startsWith(' '))) {
			lines.get(file).add(line++);
		}
	}
	return lines;
}

function addedLines(diff) {
	const added = [];
	let file = null;
	let line = 0;
	for (const text of diff.split('\n')) {
		if (text.startsWith('+++ ')) file = text.slice(6);
		else if (text.startsWith('@@')) line = Number(text.match(/\+(\d+)/)[1]);
		else if (text.startsWith('+')) added.push({ file, line: line++, text: text.slice(1) });
		else if (text.startsWith(' ')) line++;
	}
	return added;
}

function fetchPr() {
	const pr = JSON.parse(gh('pr', 'view', prArg, '--json', 'number,title,body,url,author,headRefName,baseRefName,headRefOid,isDraft,files,commits,statusCheckRollup,reviewDecision'));
	const diff = gh('pr', 'diff', prArg);
	rmSync(join(dir, 'code'), { recursive: true, force: true }); // Keep earlier drafts and posted.json as evidence.
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'pr.json'), JSON.stringify(pr, null, 2));
	writeFileSync(join(dir, 'pr.diff'), diff);

	const id = pr.headRefName.match(/^lesson-(\d{2})(?:-|$)/)?.[1];
	const folder = id && readdirSync(join(course, 'lessons')).find((name) => name.startsWith(`${id}-`));

	// The student's code at the PR head, with the course's node_modules linked in.
	const code = join(dir, 'code');
	// gh clones over the protocol gh is set up for (SSH or HTTPS), so it works wherever `gh auth status` does.
	execFileSync('gh', ['repo', 'clone', `${owner}/${repo}`, code, '--', '--quiet', '--no-checkout'], { stdio: 'inherit' });
	execFileSync('git', ['-C', code, 'fetch', '--quiet', 'origin', `pull/${number}/head`]);
	execFileSync('git', ['-C', code, 'checkout', '--quiet', pr.headRefOid]);
	const samePackages = readFileSync(join(code, 'package.json'), 'utf8') === readFileSync(join(course, 'package.json'), 'utf8');
	if (samePackages) symlinkSync(join(course, 'node_modules'), join(code, 'node_modules'));
	else spawnSync('npm', ['ci', '--silent'], { cwd: code, stdio: 'inherit' });

	const tests = id ? spawnSync('node', ['scripts/test-lesson.mjs', pr.headRefName], { cwd: code, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }) : null;
	if (tests) writeFileSync(join(dir, 'tests.txt'), tests.stdout + tests.stderr);

	let borrow = null;
	if (id === '17') {
		const library = join(code, 'lessons', folder, 'project/library.js');
		borrow = spawnSync('node', [join(course, '.claude/skills/verify-borrow-concurrency/check.mjs'), library, join(code, 'lessons', folder, 'schema.sql')], { encoding: 'utf8' });
		writeFileSync(join(dir, 'borrow-check.txt'), borrow.stdout + borrow.stderr);
	}

	const added = addedLines(diff);
	const outside = pr.files.map((f) => f.path).filter((path) => !folder || !path.startsWith(`lessons/${folder}/`));
	const flags = added.filter(({ text }) => /\bconsole\.log\(|\bdebugger\b/.test(text) || /^\s*\/\/\s*(const|let|var|if|for|return|await|console|function)\b/.test(text));
	const focus = folder ? readFileSync(join(course, 'lessons', folder, 'README.md'), 'utf8').match(/## Review focus\n([\s\S]*?)(?=\n## |$)/)?.[1].trim() : null;
	const checks = (pr.statusCheckRollup ?? []).map((c) => `${c.name || c.context}: ${c.conclusion || c.state || c.status}`);

	// Earlier review comments, so a re-review can check that each fix: was addressed.
	const earlier = JSON.parse(gh('api', `repos/${owner}/${repo}/pulls/${number}/comments`, '--paginate'));
	writeFileSync(join(dir, 'earlier-comments.json'), JSON.stringify(earlier, null, 2));
	const earlierFixes = earlier.filter((c) => /^fix:/.test(c.body));

	const packet = `# Review packet: ${pr.title}

PR: ${pr.url}
Student: @${pr.author.login}
Branch: ${pr.headRefName} -> ${pr.baseRefName}   Head: ${pr.headRefOid}${pr.isDraft ? '   (DRAFT PR)' : ''}
Lesson: ${folder ?? `NONE. The branch name does not name a lesson. Use the saved reply about naming the branch lesson-NN.`}
Course copy of the lesson: ${folder ? join(course, 'lessons', folder) : '-'}
Student code checked out at: ${code}

## Checks

GitHub checks: ${checks.length ? checks.join('; ') : 'none reported'}
Local lesson tests (npm test ${pr.headRefName}): ${tests ? (tests.status === 0 ? 'PASS' : 'FAIL') : 'not run'}. Output: ${dir}/tests.txt
${borrow ? `Borrow concurrency check (lesson 17): ${['PASS', 'FAIL', 'OUT OF SYNC'][borrow.status] ?? borrow.status}. Output: ${dir}/borrow-check.txt\n` : ''}
## Mechanical findings

Files outside the lesson folder: ${outside.length ? outside.join(', ') : 'none'}
Commits (${pr.commits.length}): ${pr.commits.map((c) => `"${c.messageHeadline}"`).join(', ')}
Added lines with console.log, debugger, or commented-out code:
${flags.length ? flags.map((f) => `- ${f.file}:${f.line}  ${f.text.trim()}`).join('\n') : '- none'}

## Earlier review

${earlier.length ? `${earlier.length} earlier inline comments, ${earlierFixes.length} of them fix: (this is a re-review). Check each one against the new code:\n${earlierFixes.map((c) => `- ${c.path}:${c.line ?? c.original_line}${c.line === null ? ' (outdated: the line changed)' : ''}  ${c.body.split('\n')[0]}`).join('\n')}\nAll comments: ${dir}/earlier-comments.json` : 'None. This is the first review.'}

## Student's PR description

${pr.body?.trim() || '(empty)'}

## Lesson review focus

${focus ?? '(no Review focus section found)'}

## Files changed

${pr.files.map((f) => `- ${f.path} (+${f.additions} -${f.deletions})`).join('\n')}

Diff: ${dir}/pr.diff
`;
	writeFileSync(join(dir, 'packet.md'), packet);
	console.log(packet);
	console.log(`Write your draft to ${dir}/draft.json, then run: review.mjs post ${prArg} ${dir}/draft.json`);
}

function post() {
	const fetched = JSON.parse(readFileSync(join(dir, 'pr.json'), 'utf8'));
	const head = JSON.parse(gh('pr', 'view', prArg, '--json', 'headRefOid')).headRefOid;
	if (head !== fetched.headRefOid) {
		console.error(`The student pushed since the fetch (${fetched.headRefOid.slice(0, 7)} -> ${head.slice(0, 7)}). Run fetch again and redo the draft.`);
		process.exit(1);
	}
	const draft = JSON.parse(readFileSync(draftArg, 'utf8'));
	const problems = [];
	if (typeof draft.body !== 'string' || !draft.body.trim()) problems.push('draft.body is empty');
	const all = [draft.body ?? '', ...(draft.comments ?? []).map((c) => c.body)];
	for (const c of draft.comments ?? []) if (!LABEL.test(c.body ?? '')) problems.push(`comment on ${c.path}:${c.line} has no label: "${String(c.body).slice(0, 40)}"`);
	if (!all.some((text) => /(^|\n)praise:\s/.test(text))) problems.push('no praise: comment (the review guide asks for at least one)');
	if (problems.length) {
		console.error(`Draft rejected:\n- ${problems.join('\n- ')}`);
		process.exit(1);
	}

	// Comments on lines outside the diff can't be attached, so they move into the summary with their location.
	const lines = commentableLines(readFileSync(join(dir, 'pr.diff'), 'utf8'));
	const inline = [];
	const moved = [];
	for (const c of draft.comments ?? []) {
		if (lines.get(c.path)?.has(c.line)) inline.push({ path: c.path, line: c.line, side: 'RIGHT', body: c.body });
		else moved.push(`**${c.path}:${c.line}**\n${c.body}`);
	}
	const body = moved.length ? `${draft.body}\n\n---\n\n${moved.join('\n\n')}` : draft.body;

	// No "event" field: GitHub keeps the review PENDING, visible only to you, until you submit it on the PR page.
	const payload = { commit_id: head, body, comments: inline };
	const result = spawnSync('gh', ['api', '-X', 'POST', `repos/${owner}/${repo}/pulls/${number}/reviews`, '--input', '-'], { input: JSON.stringify(payload), encoding: 'utf8' });
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		if (/pending review/i.test(result.stderr + result.stdout)) console.error('You already have a pending review on this PR. Submit or delete it on GitHub first.');
		process.exit(1);
	}
	const review = JSON.parse(result.stdout);
	writeFileSync(join(dir, 'posted.json'), JSON.stringify(review, null, 2));
	console.log(`Pending review ${review.id} created with ${inline.length} inline comments${moved.length ? ` (${moved.length} moved into the summary)` : ''}. State: ${review.state}.`);
	console.log(`Open ${fetched.url}/files, read and edit the comments, then click "Review changes" and choose Comment, Approve, or Request changes.`);
}

if (command === 'fetch') fetchPr();
else post();
