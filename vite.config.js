import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: true,
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        build: {
            sourcemap: false,
            minify: 'esbuild',
            rollupOptions: {
                output: {
                    manualChunks: undefined
                }
            }
        },
        esbuild: {
            drop: mode === 'production' ? ['console', 'debugger'] : []
        }
    };
});
