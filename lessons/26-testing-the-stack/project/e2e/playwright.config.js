// Playwright settings. You install Playwright yourself (see the lesson README); it is not part of this repo's package.json.
// Run from the repo root:  npx playwright test -c lessons/26-testing-the-stack/project/e2e
// Name your spec files *.e2e.js. The name keeps Vitest (npm test 26) from picking them up.
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	testMatch: '**/*.e2e.js',
	use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
	// Playwright starts the API (in-memory Postgres, fresh sample data) and the Vite page, and stops them when it finishes.
	webServer: [
		{ command: 'node lessons/26-testing-the-stack/project/server/dev.js', url: 'http://localhost:3000/api/books', reuseExistingServer: false, cwd: '../../../..' },
		{ command: 'npx vite lessons/26-testing-the-stack/project --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: false, cwd: '../../../..' },
	],
});
