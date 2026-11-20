import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: frontendRoot,
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    // Dev only (npm run dev:client): forward /api calls to the Express server.
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    build: {
        outDir: fileURLToPath(new URL('./dist', import.meta.url)),
        emptyOutDir: true,
    },
});
