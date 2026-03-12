#!/usr/bin/env node
/**
 * Run server and app in parallel (works when concurrently fails with spawn cmd.exe ENOENT on Windows).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const server = spawn('npm', ['run', 'dev'], {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
  shell: true,
});

const app = spawn('npm', ['run', 'dev'], {
  cwd: path.join(root, 'app'),
  stdio: 'inherit',
  shell: true,
});

[server, app].forEach((p) => {
  p.on('error', (err) => console.error(err));
  p.on('exit', (code) => {
    if (code !== 0 && code !== null) process.exit(code);
  });
});

process.on('SIGINT', () => {
  server.kill();
  app.kill();
  process.exit();
});
