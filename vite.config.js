import { defineConfig } from 'vite'
import dsv from '@rollup/plugin-dsv'

export default defineConfig({
    plugins: [
        dsv(),
    ],
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
    },
    build: {
        target: 'esnext',
    },
    // more config options ...
})
