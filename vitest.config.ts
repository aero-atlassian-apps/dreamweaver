/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'api/src/**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@domain': path.resolve(__dirname, './src/domain'),
            '@application': path.resolve(__dirname, './src/application'),
            '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
            '@presentation': path.resolve(__dirname, './src/presentation'),
        },
    },
})
