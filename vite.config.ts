import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const port = parseInt(env.PORT); // MUST BE LOWERCASE

	return {
		plugins: [react(), tailwindcss(), tsconfigPaths()],
		base: './',
		build: {
			outDir: 'dist-react',
			rollupOptions: {
				output: {
					manualChunks(id) {
						// Split vendor chunks
						if (id.includes('react') || id.includes('react-dom')) {
							return 'react-vendor';
						}
						if (id.includes('@radix-ui')) {
							return 'radix-vendor';
						}
						if (id.includes('react-markdown') || id.includes('remark-gfm')) {
							return 'markdown';
						}
					},
				},
			},
			chunkSizeWarningLimit: 600,
		},
		server: {
			port, // MUST BE LOWERCASE
			strictPort: true,
		},
	};
});
