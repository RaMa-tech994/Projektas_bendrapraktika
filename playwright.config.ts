import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';
Object.assign(process.env, loadEnv('development', process.cwd(), ''));
export default defineConfig({ testDir: './e2e', use: { baseURL: 'http://127.0.0.1:4173', headless: true }, webServer: { command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 30_000 } });
