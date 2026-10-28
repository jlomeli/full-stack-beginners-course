#!/usr/bin/env bash
# Instructor commands for running a cohort on GitHub.
#
#   scripts/class.sh provision   Create a private repo for each student in roster.csv. Safe to rerun.
#   scripts/class.sh queue       List open student PRs waiting for your review, oldest first.
#   scripts/class.sh progress    Show which lessons each student has merged.
#
# Settings come from environment variables:
#   ORG       GitHub organization for the cohort (required)
#   ROSTER    CSV with a header row and columns github,name (default: roster.csv)
#   PREFIX    Student repo name prefix (default: fullstack-), so repos are $ORG/fullstack-<github>
#   DRY_RUN   Set to 1 to print the commands that change GitHub instead of running them
set -euo pipefail

: "${ORG:?Set ORG to your GitHub organization, for example ORG=my-bootcamp-2027}"
ROSTER="${ROSTER:-roster.csv}"
PREFIX="${PREFIX:-fullstack-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run() {
	if [[ "${DRY_RUN:-}" == 1 ]]; then
		echo "  would run: $*"
	else
		"$@"
	fi
}

students() {
	tail -n +2 "$ROSTER" | while IFS=, read -r github _name || [[ -n "$github" ]]; do
		github="$(echo "$github" | tr -d '[:space:]')"
		if [[ -n "$github" ]]; then echo "$github"; fi
	done
}

repo_for() {
	echo "$ORG/$PREFIX$(echo "$1" | tr '[:upper:]' '[:lower:]')"
}

provision() {
	[[ -f "$ROSTER" ]] || { echo "No roster at $ROSTER. Copy roster.example.csv to roster.csv and fill it in." >&2; exit 1; }
	for github in $(students); do
		repo="$(repo_for "$github")"
		echo "$github -> $repo"
		if gh repo view "$repo" >/dev/null 2>&1; then
			echo "  repo exists, skipping create"
		else
			run gh repo create "$repo" --private --description "Full stack course work for $github"
			run git -C "$ROOT" push "https://github.com/$repo.git" main:main
		fi
		run gh api --silent -X PUT "repos/$repo/collaborators/$github" -f permission=push
	done
}

queue() {
	gh search prs --owner "$ORG" --state open --review-requested @me \
		--sort created --order asc --limit 200 \
		--json repository,title,url,createdAt \
		--template '{{range .}}{{timeago .createdAt | printf "%-16s"}} {{.repository.name | printf "%-28s"}} {{.title}}{{"\n"}}{{printf "%17s" ""}}{{.url}}{{"\n"}}{{end}}'
}

progress() {
	total="$(ls -d "$ROOT"/lessons/[0-9][0-9]-* | wc -l | tr -d ' ')"
	for github in $(students); do
		repo="$(repo_for "$github")"
		done_ids="$(gh pr list --repo "$repo" --state merged --limit 200 --json headRefName \
			--jq '.[].headRefName' | sed -nE 's/^lesson-([0-9]{2}).*/\1/p' | sort -u | tr '\n' ' ')"
		count="$(echo "$done_ids" | wc -w | tr -d ' ')"
		printf '%-20s %2s/%s  %s\n' "$github" "$count" "$total" "$done_ids"
	done
}

case "${1:-}" in
	provision) provision ;;
	queue) queue ;;
	progress) progress ;;
	*) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
