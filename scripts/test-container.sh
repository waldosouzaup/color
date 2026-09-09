#!/usr/bin/env bash
set -euo pipefail

# Teste da distribuição real, usando somente o PostgreSQL efêmero do CI.
node --input-type=module <<'NODE'
const database = new URL(process.env.DATABASE_URL || '');
if (process.env.CI !== 'true' || !['127.0.0.1', 'localhost'].includes(database.hostname) || process.env.APP_ENV !== 'test') {
  throw new Error('O teste de container exige CI e banco local de teste.');
}
if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
  throw new Error('O administrador de teste precisa estar configurado.');
}
NODE

container="colorimetry-ci-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
cleanup() {
  result=$?
  if [ "$result" -ne 0 ]; then docker logs "$container" || true; fi
  docker stop "$container" >/dev/null 2>&1 || true
  return "$result"
}
trap cleanup EXIT

docker run --detach --rm --name "$container" --network host \
  --read-only --tmpfs /tmp:size=64m,mode=1777 \
  --tmpfs /app/.next/cache:size=64m,uid=1000,gid=1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -e DATABASE_URL -e DIRECT_URL -e BETTER_AUTH_SECRET \
  -e APP_ENV=test -e ALLOW_DEMO_SEED=true -e PORT=3000 \
  -e BETTER_AUTH_URL=http://127.0.0.1:3000 \
  mestre-colorimetria:ci >/dev/null

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const origin = 'http://127.0.0.1:3000';
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(`${origin}/api/ready`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) { ready = true; break; }
  } catch { /* Aguarda inicialização, com prazo limitado. */ }
  await setTimeout(1000);
}
assert.equal(ready, true, 'Container não ficou pronto com acesso ao PostgreSQL.');
const health = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(5000) });
assert.equal((await health.json()).application, 'mestre-da-colorimetria');
const page = await fetch(`${origin}/login`, { signal: AbortSignal.timeout(5000) });
assert.equal(page.status, 200);
assert.ok(page.headers.get('content-security-policy')?.includes("'strict-dynamic'"));
const login = await fetch(`${origin}/api/auth/sign-in/email`, {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD }),
  signal: AbortSignal.timeout(10000),
});
assert.equal(login.status, 200, 'Falha no login do administrador de teste dentro do container.');
const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
assert.ok(cookie.includes('mestre-colorimetria'), 'Login sem cookie de sessão.');
const workspace = await fetch(`${origin}/api/workspace`, { headers: { Cookie: cookie }, signal: AbortSignal.timeout(10000) });
assert.equal(workspace.status, 200);
assert.equal((await workspace.json()).actor.role, 'ADMIN');
console.log('Container: filesystem somente leitura, PostgreSQL, saúde, CSP, login e API autenticada passaram.');
NODE
