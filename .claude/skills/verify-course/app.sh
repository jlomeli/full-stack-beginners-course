#!/usr/bin/env bash
# Runs a lesson's app the way a student would, with the reference solution applied, in a scratch copy of the course.
#
#   app.sh overlay NN                     Print a scratch course copy with lesson NN's solution applied (reused if it exists)
#   app.sh start NAME PORT URL -- CMD...  Run CMD in the background from the scratch copy, wait until URL answers
#   app.sh doctor NAME URL                Check that NAME is a process we started and URL answers
#   app.sh stop [NAME]                    Stop one app we started, or all of them, and delete the scratch copies
#
# SOLUTIONS points at the solutions repo (default: ../full-stack-beginners-course-solutions next to the course).
# State lives in /tmp/verify-course/run. Evidence goes in /tmp/verify-course/evidence and survives `stop`.
set -euo pipefail

COURSE="$(cd "$(dirname "$0")/../../.." && pwd)"
SOLUTIONS="${SOLUTIONS:-$COURSE/../full-stack-beginners-course-solutions}"
RUN=/tmp/verify-course/run
EVIDENCE=/tmp/verify-course/evidence
mkdir -p "$RUN" "$EVIDENCE"

lesson_folder() {
	local folder
	folder="$(cd "$COURSE/lessons" && ls -d "$1"-* 2>/dev/null | head -1)"
	[[ -n "$folder" ]] || { echo "No lesson $1 in $COURSE/lessons" >&2; exit 1; }
	echo "$folder"
}

overlay() {
	local id="$1" folder work
	folder="$(lesson_folder "$id")"
	work="$RUN/course-$id"
	if [[ ! -d "$work" ]]; then
		[[ -d "$SOLUTIONS/lessons/$folder" ]] || { echo "No solution at $SOLUTIONS/lessons/$folder" >&2; exit 1; }
		mkdir -p "$work"
		rsync -a --exclude node_modules --exclude .git --exclude .data "$COURSE/" "$work/"
		ln -s "$COURSE/node_modules" "$work/node_modules"
		cp -R "$SOLUTIONS/lessons/$folder/." "$work/lessons/$folder/"
	fi
	echo "$work"
}

wait_for() {
	local url="$1"
	for _ in $(seq 1 60); do
		if curl -s -o /dev/null "$url"; then return 0; fi
		sleep 0.5
	done
	return 1
}

start() {
	local name="$1" port="$2" url="$3"
	shift 3
	[[ "${1:-}" == "--" ]] && shift
	if lsof -ti "tcp:$port" >/dev/null 2>&1; then
		echo "Port $port is already in use by another process. Pick a free PORT or stop it yourself; never reuse an instance you didn't start." >&2
		exit 1
	fi
	(PORT="$port" nohup "$@" >"$EVIDENCE/$name.log" 2>&1 & echo $! >"$RUN/$name.pid")
	if wait_for "$url"; then
		echo "$name ready at $url (pid $(cat "$RUN/$name.pid"), log $EVIDENCE/$name.log)"
	else
		echo "$name did not answer at $url. Log:" >&2
		tail -20 "$EVIDENCE/$name.log" >&2
		exit 1
	fi
}

doctor() {
	local name="$1" url="$2" pid
	[[ -f "$RUN/$name.pid" ]] || { echo "FAIL  $name was not started by app.sh"; exit 1; }
	pid="$(cat "$RUN/$name.pid")"
	kill -0 "$pid" 2>/dev/null || { echo "FAIL  $name (pid $pid) is not running. Log: $EVIDENCE/$name.log"; exit 1; }
	local code
	code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
	[[ "$code" != "000" ]] || { echo "FAIL  $url does not answer"; exit 1; }
	echo "OK    $name pid $pid answers $url with HTTP $code"
}

stop_one() {
	local pidfile="$RUN/$1.pid"
	[[ -f "$pidfile" ]] || return 0
	local pid
	pid="$(cat "$pidfile")"
	# Kill the process we started and its children (npx and vite spawn children), never anything by name.
	pkill -P "$pid" 2>/dev/null || true
	kill "$pid" 2>/dev/null || true
	rm -f "$pidfile"
	echo "stopped $1"
}

stop() {
	if [[ $# -gt 0 ]]; then
		stop_one "$1"
		return
	fi
	for pidfile in "$RUN"/*.pid; do
		[[ -e "$pidfile" ]] && stop_one "$(basename "$pidfile" .pid)"
	done
	rm -rf "$RUN"/course-*
	echo "Evidence kept in $EVIDENCE"
}

cmd="${1:-}"
shift || true
case "$cmd" in
	overlay) overlay "$@" ;;
	start) start "$@" ;;
	doctor) doctor "$@" ;;
	stop) stop "$@" ;;
	*) sed -n '2,10p' "$0"; exit 1 ;;
esac
