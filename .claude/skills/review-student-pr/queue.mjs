#!/usr/bin/env node
// Lists student PRs that need a drafted review: open, not draft, in a fullstack-* repo, opened by someone else,
// and whose current head commit has no draft yet. Records drafts in a state file so each push is reviewed once.
//
//   queue.mjs list                 Print one PR URL per line that needs a draft
//   queue.mjs done <url> <sha>     Record that <sha> of <url> was drafted (or gave up on)
//
// ORG (default jlomeli) limits the search to repos under that owner. State: ~/.local/state/review-student-pr/drafted.json
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const stateDir = join(homedir(), '.local/state/review-student-pr');
const stateFile = join(stateDir, 'drafted.json');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const gh = (...args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
const [command, url, sha] = process.argv.slice(2);

if (command === 'done') {
	mkdirSync(stateDir, { recursive: true });
	state[url] = sha;
	writeFileSync(stateFile, JSON.stringify(state, null, 2));
} else if (command === 'list') {
	const me = gh('api', 'user').login;
	// Code owners don't auto-request reviews in private repos on GitHub Free, so don't rely on review requests:
	// take every open, non-draft PR in a student repo (PREFIX, default fullstack-) that someone else opened.
	const prefix = process.env.PREFIX ?? 'fullstack-';
	const prs = gh('search', 'prs', '--owner', process.env.ORG ?? 'jlomeli', '--state', 'open', '--draft=false', '--sort', 'created', '--order', 'asc', '--limit', '200', '--json', 'url,repository,number,author')
		.filter((pr) => pr.repository.name.startsWith(prefix) && (pr.author.login !== me || process.env.INCLUDE_OWN === '1'));
	for (const pr of prs) {
		const { headRefOid } = gh('pr', 'view', pr.url, '--json', 'headRefOid');
		if (state[pr.url] === headRefOid) continue;
		// Skip when you already have a pending review there: post would be refused anyway.
		const reviews = gh('api', `repos/${pr.repository.nameWithOwner}/pulls/${pr.number}/reviews`);
		if (reviews.some((r) => r.state === 'PENDING' && r.user.login === me)) continue;
		console.log(`${pr.url} ${headRefOid}`);
	}
} else {
	console.error('Usage: queue.mjs list | queue.mjs done <url> <sha>');
	process.exit(2);
}
