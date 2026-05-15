import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: {
                atlas: path.resolve(__dirname, 'src/atlas/index.ts'),
                'atlas-dom': path.resolve(__dirname, 'src/atlas-dom/index.ts'),
                'atlas-router': path.resolve(__dirname, 'src/atlas-router/index.ts'),
                'atlas-types': path.resolve(__dirname, 'src/shared/types/index.ts'),
            },
            name: 'Atlas',
            formats: ['es']
        },
        rollupOptions: {
            external: [
                'atlas-web',
                'atlas-web/dom',
                'atlas-web/router',
                'atlas-web/types'
            ],
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name]-[hash].js',
            }
        }
    },
    plugins: [dts({ insertTypesEntry: true })],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@atlas": path.resolve(__dirname, "./src/atlas/index.ts"),
            "@atlas-dom": path.resolve(__dirname, "./src/atlas-dom/index.ts"),
            "@atlas-router": path.resolve(__dirname, "./src/atlas-router/index.ts"),
            "@shared": path.resolve(__dirname, "./src/shared"),
            "@interfaces": path.resolve(__dirname, "./src/shared/interfaces/index.ts"),
            "@services": path.resolve(__dirname, "./src/shared/services/index.ts"),
            "@types": path.resolve(__dirname, "./src/shared/types/index.ts")
        }
    }
});