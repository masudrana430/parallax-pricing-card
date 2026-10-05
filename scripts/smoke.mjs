import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';

const backendPort = process.env.SMOKE_BACKEND_PORT || '8091';
const webPort = process.env.SMOKE_WEB_PORT || '3091';
const origin = `http://127.0.0.1:${webPort}`;
const file = join(tmpdir(), `astra-smoke-${Date.now()}.db`);
const secret = 'disposable-smoke-proxy-secret';
const processes = [];
function start(command, args, env) {
  const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
  processes.push(child);
  child.on('error', error => console.error(error.message));
  return child;
}
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Service did not become ready: ${url}`);
}
let cookie = '';
async function api(path, method = 'GET', data) {
  const response = await fetch(`${origin}/api/${path}`, {
    method, headers: { origin, cookie, 'content-type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies[0].split(';')[0];
  return response;
}
try {
  start(process.env.PYTHON || 'python', ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', backendPort], {
    DATABASE_URL: `sqlite:///${file.replaceAll('\\', '/')}`, APP_ENV: 'development', BACKEND_PROXY_SECRET: secret,
    COOKIE_SECURE: 'false', OPENAI_API_KEY: '', AI_PROVIDER: 'openai',
  });
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', webPort], {
    BACKEND_URL: `http://127.0.0.1:${backendPort}`, BACKEND_PROXY_SECRET: secret, APP_ORIGIN: origin,
  });
  await ready(`http://127.0.0.1:${backendPort}/ready`);
  await ready(`${origin}/api/health`);
  assert.equal((await fetch(`http://127.0.0.1:${backendPort}/auth/demo`, {method:'POST'})).status, 403);
  assert.equal((await fetch(`${origin}/api/auth/demo`, {method:'POST', headers:{origin:'https://untrusted.example'}})).status, 403);
  assert.equal((await api('auth/register', 'POST', {email:'smoke@example.com',password:'disposable-test-password'})).status, 200);
  assert.ok(cookie.startsWith('astra_session='));
  assert.equal((await api('profile', 'PUT', {name:'Synthetic smoke crew',age:31})).status, 200);
  assert.equal((await api('observations', 'POST', {heart_rate:75,spo2:98})).status, 200);
  const report = await api('assistant', 'POST', {text:'I feel dizzy',language:'en'});
  assert.equal(report.status, 200);
  assert.equal((await report.json()).assessment.mode, 'guided');
  const dashboard = await (await api('dashboard')).json();
  assert.equal(dashboard.observations[0].heart_rate, 75);
  assert.equal(dashboard.voice_configured, false);
  assert.equal((await api('export')).status, 200);
  assert.equal((await api('auth/logout', 'POST')).status, 200);
  assert.equal((await api('dashboard')).status, 401);
  console.log('PASS: production frontend proxy, secret gate, origin protection, cookies, profile, measurements, guided AI, export and logout');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  for (const child of processes) child.kill();
  rmSync(file, {force:true});
}
