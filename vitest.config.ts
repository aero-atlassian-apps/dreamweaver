/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
    resolve: {
        alias: {
            '@': '/src',
            '@domain': '/src/domain',
            '@application': '/src/application',
            '@infrastructure': '/src/infrastructure',
            '@presentation': '/src/presentation',
        },
    },
})
