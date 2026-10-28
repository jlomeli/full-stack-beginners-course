# Deployment record

Copy this file into your library app's repo, fill it in, and paste it into your PR description. No test checks it. Your reviewer reads it and opens your live URL.

## Live URLs

- Front end: https://
- API health check (`/health`): https://
- Source repo / branch that deploys:

## Where each part runs

| Part | Host and service name | How it builds | How it starts |
| --- | --- | --- | --- |
| Front end | | | |
| API | | | |
| Database | | | not applicable |

## Environment variables

List every variable your app reads and where you set it. Never write a real secret value here.

| Name | Set on (host dashboard / CI secret) | What it is for |
| --- | --- | --- |
| DATABASE_URL | | |
| SESSION_SECRET | | |
| PORT | | |
| NODE_ENV | | |
| CORS_ORIGIN | | |

## Health check

- Path the host checks:
- What it returns when the database is up:
- What I saw when I stopped the database or broke `DATABASE_URL` on purpose:

## Automatic deploys

- What event triggers a deploy:
- Which checks must pass first:
- Link to a pull request or run where a merge to `main` caused a deploy:

## Roll back

How I would go back to the previous working version, in two or three steps:

## What went wrong

One thing that failed during my first deploy, how I found out, and how I fixed it:
