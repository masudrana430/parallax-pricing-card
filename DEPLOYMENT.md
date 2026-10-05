# Astra: Render + PostgreSQL + Vercel

The browser calls the Next.js `/api` proxy on Vercel. Only that server contacts FastAPI on Render. PostgreSQL stores accounts, sessions and health records. Cookies belong to the Vercel domain, so third-party cookies and browser CORS are not required.

## 1. PostgreSQL

Create your PostgreSQL database. Keep the credentials outside GitHub. For Render PostgreSQL in the same region, use its internal database URL. For another provider, use its TLS-enabled connection string and network-access settings. Astra accepts `postgres://`, `postgresql://` and `postgresql+psycopg://` URLs.

## 2. Render backend

Import this repository as a Blueprint using `render.yaml`, or create a Python Web Service with the repository root as the working directory:

- Build: `pip install -r backend/requirements-minimal.txt`
- Start: `python -m backend.migrate && uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1`
- Health check: `/ready`
- Environment: `APP_ENV=production`, `COOKIE_SECURE=true`, your `DATABASE_URL`, and a strong randomly generated `BACKEND_PROXY_SECRET`.

The Blueprint generates the proxy secret. Copy it privately from Render to the Vercel server environment in step 3. Migration revision 1 is idempotent and preserves existing records. A schema newer than the application is rejected. Production refuses SQLite or a missing proxy secret. `/health` is a liveness endpoint; `/ready` checks database connectivity and the accounts table. Authenticated health endpoints reject callers without the proxy secret. Keep one worker until shared rate limiting and migration coordination are implemented.

## 3. Vercel frontend

Import the GitHub repository, choose Next.js, production branch `main`, repository root, and Node.js 24. `vercel.json` supplies install/build commands. Add these **server-only** environment variables:

| Key | Value |
|---|---|
| `BACKEND_URL` | Your Render HTTPS service URL, without a trailing slash |
| `BACKEND_PROXY_SECRET` | The exact secret used by the backend |
| `APP_ORIGIN` | The exact public frontend origin, e.g. `https://your-astra.vercel.app` |

Deploy, then set `APP_ORIGIN` to the actual assigned domain and redeploy. Configure preview origins separately when testing previews. Never prefix secrets with `NEXT_PUBLIC_`. The frontend forwards session cookies and the backend secret server-to-server. Register, complete a profile, add a measured check-in, reload, submit a symptom report and export your records to verify the entire flow.

## 4. AI modes

Without a provider, guided rules remain available. To enable cloud AI, set `AI_PROVIDER=openai` and `OPENAI_API_KEY` on Render; model and transcription names are configurable. A user must explicitly enable external AI processing in their profile. Voice requires OpenAI transcription configuration independently of the text model.

For key-free local inference, install Ollama on your own machine, download a schema-capable model such as `qwen3:8b`, and set `AI_PROVIDER=ollama`, `OLLAMA_MODEL=qwen3:8b`, and `OLLAMA_URL=http://127.0.0.1:11434` on a backend running on that machine. The integration sends structured extraction requests; deterministic guidance remains in control. Emergency rules and severity 8+ bypass model calls. Provider timeouts or invalid JSON visibly fall back to guided mode.

**Render cannot reach Ollama on your laptop via `localhost`.** A Render-hosted backend needs a separately hosted model service reachable from Render, protected through your network/authentication layer. Do not expose an unauthenticated Ollama service publicly. Ollama text support does not supply offline voice recognition. Neither a real model server nor a real cloud inference/transcription call was used during automated verification.

## Operational scope

These files prepare deployment; no Render, PostgreSQL or Vercel resources were deployed for this update. Review provider limits, costs and database retention before provisioning. Clinical validation, mission-approved protocols, wearable integration, shared rate limiting and account recovery remain separate work. This prototype does not diagnose every condition or establish fitness for flight.

## Reproducible local verification

Install frontend/backend dependencies, run `npm run build`, then `npm run smoke`. Set `PYTHON` to your virtual environment Python executable if necessary. The smoke test launches both services on isolated ports, uses a disposable SQLite database and synthetic account, checks the secret-protected proxy and user flow, then stops its processes. It does not connect to a live provider or production database. Backend regression tests: `python -m pytest backend/test_app.py -q`.
