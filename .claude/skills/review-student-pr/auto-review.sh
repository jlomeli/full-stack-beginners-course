#!/usr/bin/env bash
# Drafts a pending review for every student PR waiting on you. Run by launchd every 10 minutes (see SKILL.md, "Run it automatically").
#   auto-review.sh          Review everything in the queue
#   DRY_RUN=1 auto-review.sh   Only list what would be reviewed
set -uo pipefail
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

SKILL="$(cd "$(dirname "$0")" && pwd)"
COURSE="$(cd "$SKILL/../../.." && pwd)"
LOCK=/tmp/review-student-pr.lock
cd "$COURSE"

# One run at a time: a long review must not overlap the next tick.
if ! mkdir "$LOCK" 2>/dev/null; then
	echo "$(date '+%F %T') previous run still going, skipping"
	exit 0
fi
trap 'rmdir "$LOCK"' EXIT

gh auth status >/dev/null 2>&1 || { echo "$(date '+%F %T') gh is not logged in"; exit 1; }
queue="$(node "$SKILL/queue.mjs" list)" || { echo "$(date '+%F %T') could not read the queue"; exit 1; }
[[ -n "$queue" ]] || exit 0

while read -r url sha; do
	echo "$(date '+%F %T') $url @ ${sha:0:7}"
	if [[ "${DRY_RUN:-}" == 1 ]]; then continue; fi
	# Edit(...) rules cover Write too: the agent can write only inside /tmp/review (macOS /tmp is /private/tmp), never the repo.
	claude -p "Use the review-student-pr skill to review $url. This run is unattended: nobody can answer questions. Fetch, write draft.json, and post it as a pending review. Then reply with one line: the PR URL, your recommendation (Approve or Request changes), and the comment count." \
		--allowedTools "Skill" "Read" "Grep" "Glob" "Edit(//tmp/review/**)" "Edit(//private/tmp/review/**)" \
			"Bash(node .claude/skills/review-student-pr/review.mjs *)" "Bash(gh pr view *)" "Bash(gh pr diff *)" "Bash(gh pr checks *)" \
		--disallowedTools "Bash(gh pr review *)" "Bash(gh pr merge *)" "Bash(gh pr comment *)" \
		</dev/null 2>&1 | tail -5
	# Record the commit only once a pending review really exists, so a failed run is retried next tick.
	repo="$(echo "$url" | sed -E 's#https://github.com/([^/]+/[^/]+)/pull/([0-9]+)#\1#')"
	number="${url##*/}"
	if gh api "repos/$repo/pulls/$number/reviews" --jq '.[] | select(.state == "PENDING") | .id' | grep -q .; then
		node "$SKILL/queue.mjs" done "$url" "$sha"
		osascript -e "display notification \"Draft review ready: ${repo#*/} #$number\" with title \"Student PR\"" 2>/dev/null || true
		echo "$(date '+%F %T') drafted $url"
	else
		echo "$(date '+%F %T') no pending review appeared for $url; will retry next run"
	fi
done <<<"$queue"
