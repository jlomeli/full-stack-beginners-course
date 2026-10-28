// Vite serves the React page on port 5173 and forwards every /api request to the API on port 3000.
export default {
	server: {
		proxy: { '/api': 'http://localhost:3000' },
	},
};
