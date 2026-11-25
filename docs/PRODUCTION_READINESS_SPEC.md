# Rythu Mitra — Production Readiness Specification

**Status:** Draft v1.0
**Owner:** Engineering
**Goal:** Take Rythu Mitra from a polished demo to a 10/10 production-grade, investor-ready platform.
**Last reviewed:** 2026-11-23

---

## 1. Purpose & Scope

This document defines the engineering bar, target architecture, workstreams, acceptance criteria, and phased plan to make Rythu Mitra production grade across **all themes**: Crop Doctor, AI Advisor, Weather, Mandi Prices, and Expo/Demo, plus the platform concerns behind them (auth, data, security, reliability, compliance, analytics).

"10/10" in this document means: **measurable, auditable, and defensible**, not "looks good in a demo." Every workstream below has explicit acceptance criteria and a Definition of Done. A feature is not "done" until its tests, monitoring, docs, and rollback path exist.

### In scope
- Single deployable product (one frontend, one backend, one data model).
- Real AI (vision + chat) with observable, non-silent failure modes.
- Real, attributed data pipelines (weather, mandi) with freshness guarantees.
- Accounts, persistence, quotas, analytics.
- Security, reliability, observability, CI/CD, and compliance.

### Out of scope (tracked separately)
- Native mobile apps (PWA first).
- Payments/monetization implementation (interfaces defined, not built).
- Agronomist marketplace workflows.

---

## 2. Current State (evidence-based baseline)

Findings from running the live instance and reading the code:

| Area | Current reality |
|---|---|
| Architecture | Two divergent frontends (`client/` Vite + `public/` Babel-in-browser) and two backends (`server.js`, `server/server.js`) |
| AI | `/api/chat` and `/api/diagnose` return `live:false`; silent fallback to canned answers; `gemini-1.5-flash` is retired |
| Data | Static JSON, hardcoded "Today 06:00 AM IST", synthetic 5-day forecast, no real APMC feed |
| Security | `POST /api/config` lets any client set the server key (`server.js:352`); CORS `*`; no auth; no rate limit; `.env` in repo; no `.gitignore` |
| Reliability | No outbound request timeout (`server.js:108`); no structured logging; no tests; no CI |
| Client build | Sample SVGs not emitted; Expo calls `/api/demo-scenarios` which root server doesn't serve (returns HTML 200) |
| UX | Strong: bilingual, mobile-first, polished |

**Baseline score:** ~3/10 production, ~6.5/10 demo.

---

## 3. Definition of 10/10 (Quality Bar)

A 10/10 production system satisfies all of the following simultaneously:

### 3.1 Service Level Objectives (SLOs)
| SLO | Target |
|---|---|
| Availability (API) | 99.9% monthly |
| API p95 latency (non-AI) | < 300 ms |
| AI chat p95 latency | < 4 s (streaming first token < 1.5 s) |
| AI vision p95 latency | < 8 s |
| Error rate (5xx) | < 0.1% |
| Data freshness: weather | < 30 min |
| Data freshness: mandi | < 24 h |
| RPO (data loss window) | ≤ 15 min |
| RTO (recovery) | ≤ 1 h |

### 3.2 Non-negotiable invariants
1. **No silent degradation.** Any AI fallback returns `mode: "degraded"` + `reason`; the UI displays it.
2. **No client-supplied server secrets.** The API key config endpoint is removed from production.
3. **All external calls have timeouts, retries with jitter, and a circuit breaker.**
4. **Every endpoint validates input and enforces auth + rate limits.**
5. **Every deployed commit is reproducible** (lockfiles, pinned images, migrations).
6. **Every feature has tests + monitoring + a runbook.**
7. **PII is minimized, consented, encrypted, and retention-limited (India DPDP Act 2023).**

### 3.3 Scorecard target
| Dimension | Now | Target |
|---|---|---|
| Product surface | 6 | 10 |
| AI functioning | 2 | 10 |
| Data credibility | 3 | 10 |
| Security | 2 | 10 |
| Reliability/ops | 2 | 10 |
| Architecture | 2 | 10 |
| UX/accessibility | 7 | 10 |
| Scalability/business | 1 | 10 |
| Demo integrity | 4 | 10 |

---

## 4. Target Architecture

### 4.1 Stack decisions (recommended defaults)
| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind, single `client/` app, PWA | Removes Babel-in-browser; typed; offline-capable |
| Backend | Node 22 LTS + **Fastify** + TypeScript | Schema validation, pino logging, performance, plugins |
| Validation | Zod (shared schemas package) | One source of truth client/server |
| DB | PostgreSQL 16 + Drizzle ORM | Relational, migrations, JSONB for AI payloads |
| Cache/queue | Redis (cache, rate limit, BullMQ jobs) | Rate limiting + async AI jobs + idempotency |
| Object storage | S3-compatible (AWS S3 / Cloudflare R2) with signed URLs | Store leaf images, not base64 in JSON |
| AI | Provider abstraction; Gemini 2.5 Flash (current GA) primary, second provider fallback | Avoid lock-in; model retirement resilience |
| Auth | Phone OTP (MSG91/Twilio) + JWT access/refresh; optional Google | Farmer-first login |
| Observability | pino + OpenTelemetry + Sentry + Prometheus/Grafana (or hosted) | Traces, errors, metrics |
| CI/CD | GitHub Actions; multi-stage Docker; Trivy scan; Fly.io/Render/AWS | Reproducible deploys |
| Reverse proxy | Caddy/Nginx with TLS, security headers, compression | TLS termination, CSP |

> These are recommendations. Any deviation must be recorded in §13 (Open Decisions) with rationale.

### 4.2 Runtime topology
```
                    ┌──────────────┐
   Browser/PWA ───▶ │  CDN / Edge  │ ──▶ static assets (immutable, hashed)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐        ┌───────────────┐
                    │  Reverse     │───────▶│  API (Fastify)│───┐
                    │  Proxy/TLS   │        │  stateless    │   │
                    └──────────────┘        └──────┬────────┘   │
                                                   │            │
                        ┌──────────────┬───────────┼────────────┘
                        ▼              ▼           ▼
                  ┌──────────┐   ┌──────────┐ ┌──────────┐
                  │ Postgres │   │  Redis   │ │ Object   │
                  │ primary  │   │ cache/RL │ │ storage  │
                  │ + replica│   │ + queue  │ └──────────┘
                  └──────────┘   └────┬─────┘
                                      │
                              ┌───────▼────────┐
                              │ Worker (BullMQ)│──▶ AI providers
                              │ ingest, AI jobs│──▶ APMC/Agmarknet
                              └────────────────┘──▶ Open-Meteo
```

### 4.3 Repository layout (target)
```
rythu-mitra/
├── apps/
│   ├── web/                 # React + Vite + TS (single frontend)
│   └── api/                 # Fastify + TS
├── packages/
│   ├── shared/              # Zod schemas, types, translations, design tokens
│   └── config/              # eslint, tsconfig, tailwind presets
├── infra/                   # Docker, compose, migrations, IaC
├── docs/                    # ADRs, runbooks, this spec
├── .github/workflows/       # CI/CD
└── package.json             # pnpm workspace
```
Legacy `public/`, root `server.js`, and `server/` are deleted after migration (Phase 1).

---

## 5. Workstreams & Acceptance Criteria

Each workstream is independently verifiable. "AC" = acceptance criteria.

### WS1 — Codebase consolidation & frontend
**Objective:** One frontend, one build, typed, offline-capable.
- Migrate `client/` to TypeScript + shared schemas; delete `public/` and Babel-in-browser.
- Bundle all assets via imports (fix `client/src/assets/demo-leaves` not emitted); self-host fonts and icons; remove unpinned CDNs.
- Add PWA (manifest, service worker, offline shell, cached last-known weather/mandi).
- Add error boundaries, loading skeletons, empty/error states, and a visible "degraded mode" banner.
- Render AI markdown safely (sanitized) instead of raw text.

**AC**
- [ ] `pnpm --filter web build` produces `dist/` with no missing assets (verified by asset manifest test).
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, PWA installable.
- [ ] No `cdn.`/`unpkg`/`babel` references in production HTML.
- [ ] Playwright smoke covers all 5 tabs in EN and TE.

---

### WS2 — Backend & API
**Objective:** Typed, validated, versioned API with correct semantics.
- Fastify app with plugins: cors (allowlist), helmet, rate-limit, sensible, request-id, pino.
- Zod request/response validation; OpenAPI generated from schemas.
- Correct status codes: unknown routes → 404 JSON (`/api/*` never returns HTML).
- Idempotency keys for POST; pagination for list endpoints.
- Graceful shutdown (SIGTERM), health (`/healthz`), readiness (`/readyz`).

**API contract (target)**
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/healthz` | none | liveness |
| GET | `/readyz` | none | checks DB/Redis/AI config |
| GET | `/v1/weather?lat&lon` | user | cached 15 min, attribution |
| GET | `/v1/mandi?commodity&market&page` | user | DB-backed, `updated_at` real |
| POST | `/v1/chat` | user | SSE streaming; returns `mode` + `requestId` |
| POST | `/v1/diagnose` | user | multipart upload → object storage; async job |
| GET | `/v1/diagnose/:id` | owner | status + result |
| GET | `/v1/me`, `/v1/me/history` | user | persisted history |
| POST | `/v1/auth/otp/request`, `/verify` | none | rate-limited |
| POST | `/v1/auth/refresh`, `/logout` | token | rotation |

**AC**
- [ ] Every route has request+response schema and an OpenAPI entry.
- [ ] `/api/unknown` returns `404 application/json`.
- [ ] `GET /readyz` fails when DB or AI config is unhealthy.
- [ ] p95 non-AI latency < 300 ms under 200 rps (k6).

---

### WS3 — AI / ML (flagship)
**Objective:** Real, reliable, observable AI with quality measurement.
- Provider abstraction (`AIProvider`) with timeout (chat 20s, vision 30s), retry w/ jitter, circuit breaker, and a second provider.
- Use a current GA model (e.g., Gemini 2.5 Flash); pin model ID in config; alert on deprecation.
- **Never silent-fail:** return `{ mode: "live" | "degraded", reason, confidence }`.
- Vision: accept real uploads via object storage; send bytes to provider; validate output against a strict Zod schema; reject non-leaf/low-confidence images instead of guessing.
- Chat: intent-aware (not `String.includes` keyword matching); system prompt with safety + agronomy guardrails; refuse medical/illegal advice.
- Prompt/version registry; log `prompt_version`, `model`, token usage, latency, cost.
- **Evaluation harness:** labeled leaf dataset (≥ 300 images across crops/diseases) with precision/recall/F1; chat golden set (≥ 100 Q/A) with rubric scoring. Gate deploys on thresholds.

**AC**
- [ ] Live path returns `mode:"live"` for valid inputs; degraded only on real failure, with reason surfaced in UI.
- [ ] Vision F1 ≥ 0.85 on the eval set; unknown/blank image returns `unable_to_diagnose` (not a random disease).
- [ ] Chat golden-set rubric pass ≥ 90%.
- [ ] Provider outage (simulated) → circuit opens, degraded response < 1 s, alert fired.
- [ ] Cost per 1k requests tracked on a dashboard.

---

### WS4 — Data platform
**Objective:** Real, attributed, fresh data.
- Weather: Open-Meteo (or IMD) ingest every 15–30 min into Postgres; store attribution; 5-day outlook uses real daily data (remove synthetic temps).
- Mandi: ingest Agmarknet/APMC feed on a schedule; store `source`, `fetched_at`, `market`, `commodity`, min/max/modal; expose real `updated_at`.
- Data quality: schema validation, outlier checks, freshness monitors, backfill job.
- Serve from DB with Redis cache; never ship hardcoded "Today 06:00 AM IST".

**AC**
- [ ] `/v1/mandi` `updated_at` reflects actual ingest; stale-data alert at > 24 h.
- [ ] 5-day outlook values come from provider daily arrays (unit-tested).
- [ ] Every record carries `source` + `fetched_at`; UI shows attribution.
- [ ] Ingest job is idempotent and retried on failure.

---

### WS5 — Auth & user accounts
**Objective:** Real identity, persistence, history.
- Phone OTP login (rate-limited, expiring, attempt-capped), JWT access (15 min) + refresh rotation (30 d), secure httpOnly cookies.
- Users table; roles (`farmer`, `admin`); per-user quotas; history of diagnoses/chats.
- Account deletion + data export (DPDP).

**AC**
- [ ] OTP brute-force protection verified (lockout after N attempts).
- [ ] Refresh token rotation invalidates reused tokens.
- [ ] User can delete account and all PII within 30 days (job tested).
- [ ] Authz tests: user A cannot read user B's diagnosis.

---

### WS6 — Security
**Objective:** Defense in depth; no exposed secrets; auditable.
- Remove `POST /api/config` from production; keys only from secrets manager/env at deploy.
- CORS allowlist (no `*`), helmet security headers, strict CSP, HSTS, TLS only.
- Rate limits per IP + per user (chat/diagnose stricter); body size limits; MIME sniffing + magic-byte validation on uploads; antivirus scan (ClamAV) optional.
- Input validation everywhere; parameterized queries only; SSRF-safe outbound allowlist.
- Secrets: `.gitignore` includes `.env*`; secret scanning (gitleaks) in CI; rotate any exposed key.
- Dependency hygiene: lockfiles, `npm audit`/Dependabot, Trivy image scan, SBOM.
- Path traversal guard hardened (normalize + resolve + boundary check).

**AC**
- [ ] `POST /api/config` returns 404/410 in prod; no endpoint can mutate server secrets.
- [ ] CSP blocks inline scripts; no CDN without SRI (prefer self-host).
- [ ] gitleaks + Trivy clean in CI; zero high/critical vulns.
- [ ] Uploads: reject > 10 MB, non-image magic bytes, and decompression bombs.
- [ ] Rate limit returns 429 with `Retry-After`; verified by test.
- [ ] Independent pentest checklist completed; findings closed.

---

### WS7 — Reliability & observability
**Objective:** Know when it breaks before users do.
- Structured logs (pino) with request-id correlation; no PII/secrets in logs.
- OpenTelemetry traces (API → DB → AI provider); Sentry for exceptions.
- Metrics: RED (rate/errors/duration) + AI cost/latency + data freshness; Grafana dashboards.
- Alerts: 5xx rate, p95 breach, AI degraded-mode rate, data staleness, cert expiry.
- Runbooks per alert; on-call rotation; incident template + postmortems.

**AC**
- [ ] Every request has a trace + structured log with `requestId`.
- [ ] Dashboards for SLOs + AI cost exist and are linked in README.
- [ ] Synthetic uptime check every minute from 2 regions.
- [ ] Game-day: kill DB and AI provider; system degrades correctly and alerts fire.
- [ ] Documented RPO/RTO validated by a restore drill.

---

### WS8 — Testing & QA
**Objective:** Confidence to ship daily.
- Unit (Vitest) for pure logic, schemas, offline fallback.
- Integration (Fastify inject + testcontainers Postgres/Redis) for routes.
- Contract tests against OpenAPI.
- E2E (Playwright) for all 5 themes, both languages, mobile viewport.
- Load (k6) for chat/diagnose/weather/mandi; AI mocked + a small live smoke.
- AI eval harness in CI (nightly), not blocking fast PRs.
- Coverage gates: ≥ 80% lines on `api` and `shared`.

**AC**
- [ ] `pnpm test`, `pnpm test:e2e`, `pnpm test:load` documented and green.
- [ ] CI blocks merge on lint, typecheck, unit, integration, build, and security scan.
- [ ] Flaky tests quarantined with owners; < 1% flake rate.

---

### WS9 — CI/CD & infrastructure
**Objective:** Reproducible, safe deploys with rollback.
- pnpm workspace + lockfile; Node 22 pinned via `.nvmrc`/engines.
- Multi-stage Dockerfile (build → runtime, non-root user, distroless/alpine), image tagged by SHA.
- GitHub Actions: lint → typecheck → test → build → scan → deploy (staging) → smoke → promote (prod).
- DB migrations gated; backward-compatible expand/contract pattern.
- Blue-green or rolling deploy; automated rollback on failed smoke.
- IaC (Terraform) or platform config as code; environments: `dev`, `staging`, `prod`.
- `.env.example` only; real secrets in platform secret store.

**AC**
- [ ] One-command deploy; rollback in < 5 min.
- [ ] Image runs as non-root; no build tools in runtime layer.
- [ ] Migrations are reversible and tested in staging.
- [ ] README run/deploy instructions match reality (verified by a fresh clone test).

---

### WS10 — Performance & scalability
**Objective:** Handle growth without rewrites.
- Stateless API; horizontal scaling; connection pooling (PgBouncer) + Redis.
- Async AI jobs via BullMQ for vision; streaming for chat.
- Caching: CDN for static, Redis for weather/mandi; cache invalidation policy.
- Compression (brotli/gzip), HTTP/2, image optimization.
- Autoscaling + load test at 5x projected peak; document breaking points.

**AC**
- [ ] k6 at 5x peak meets SLOs with AI mocked.
- [ ] No N+1 queries; slow-query log reviewed; indexes for hot paths.
- [ ] Cache hit ratio for weather/mandi ≥ 80%.
- [ ] Capacity plan documented (rps, DB size, AI cost at 10k DAU).

---

### WS11 — UX, accessibility & i18n
**Objective:** Usable by rural, low-literacy, low-connectivity users.
- WCAG 2.1 AA: contrast, focus states, ARIA, 48px touch targets, keyboard nav.
- i18n framework (ICU messages) with EN + TE; all strings externalized (no inline bilingual ternaries).
- Low-bandwidth mode; skeleton loaders; clear offline + degraded states.
- Voice: graceful mic-permission handling; TTS fallback messaging.
- Usability testing with ≥ 5 target farmers; iterate.

**AC**
- [ ] axe-core: 0 critical/serious issues on all screens.
- [ ] All user-facing strings from message catalogs; no hardcoded bilingual text in components.
- [ ] Usability test report with fixes tracked.
- [ ] Works on a throttled 3G profile (Lighthouse mobile).

---

### WS12 — Compliance, legal & privacy
**Objective:** Legally deployable in India.
- Privacy policy + terms; DPDP Act 2023 consent, purpose limitation, data minimization.
- PII inventory + data map; encryption at rest/in transit; retention schedule; deletion/export flows.
- **Agri-advice disclaimer** (not a substitute for licensed agronomist/extension officer); pesticide dosage safety warnings.
- Image consent for uploaded photos; no training on user images without opt-in.
- Accessibility + language compliance; cookie/analytics consent where applicable.
- Trademark/branding review for "Rythu Mitra"; third-party license audit (fonts, icons).

**AC**
- [ ] Privacy policy, terms, disclaimer live and linked in-app.
- [ ] Consent captured before OTP/analytics; verifiable in DB.
- [ ] Retention + deletion jobs tested.
- [ ] Legal review sign-off recorded.

---

### WS13 — Analytics & business instrumentation
**Objective:** Investor-grade metrics.
- Product analytics (PostHog) with event taxonomy: `diagnosis_started/succeeded/degraded`, `chat_message`, `voice_used`, `tab_view`, `login`.
- Funnels, retention cohorts, DAU/WAU/MAU; north-star metric defined (e.g., weekly successful diagnoses).
- Cost dashboard (AI spend/user, gross margin per active user).
- Feature flags + A/B capability.
- Data warehouse export (Postgres → BigQuery/Snowflake) optional.

**AC**
- [ ] Event taxonomy documented and validated.
- [ ] Dashboard shows DAU, retention, success rate, AI cost/user.
- [ ] PII excluded from analytics; consent-gated.

---

### WS14 — Documentation & operations
**Objective:** Anyone can run, deploy, and recover it.
- README rewritten to match reality (single stack, accurate commands).
- ADRs for major decisions; runbooks for each alert; incident + postmortem templates.
- API docs (OpenAPI/Swagger UI), data dictionary, architecture diagram.
- Onboarding guide; `CONTRIBUTING.md`; code owners.
- Remove stale artifacts (`test-verify.ps1` old paths, outdated PODMAN doc).

**AC**
- [ ] Fresh clone → running locally in ≤ 10 min following README.
- [ ] Every alert links to a runbook.
- [ ] ADRs cover stack, DB, AI provider, auth, hosting.

---

## 6. Data Model (target, minimal)

```
users(id, phone_hash, locale, role, created_at, deleted_at)
sessions(id, user_id, refresh_hash, expires_at, revoked_at)
diagnoses(id, user_id, status, crop, disease, severity, confidence,
          image_key, ai_mode, ai_reason, prompt_version, model,
          result_jsonb, created_at)
chats(id, user_id, role, content, ai_mode, model, tokens, cost_usd, created_at)
weather_cache(lat, lon, payload_jsonb, source, fetched_at)
mandi_prices(id, commodity, market, min, max, modal, unit,
             source, fetched_at, unique(commodity,market,fetched_at))
ingest_runs(id, job, status, started_at, finished_at, error)
audit_log(id, actor_id, action, target, meta_jsonb, created_at)
```

Indexes: `diagnoses(user_id, created_at)`, `mandi_prices(commodity, market, fetched_at)`, `chats(user_id, created_at)`.

---

## 7. Environments, Secrets & Config

| Env | Purpose | Data | Access |
|---|---|---|---|
| dev | local | seeded/fake | developers |
| staging | pre-prod | anonymized | CI + team |
| prod | live | real | least privilege |

- Config via env vars validated by Zod at boot (fail fast on missing).
- Secrets in platform secret manager; **never** in repo, client bundle, or logs.
- `.env.example` documents required keys. `.gitignore` covers `.env*`.
- Rotate any previously exposed key immediately (see WS6).

---

## 8. Phased Roadmap

### Phase 0 — Stabilize (1–2 weeks)
Kill silent failures and lock security. Exit criteria:
- [ ] `live:false` surfaced in UI as degraded mode with reason.
- [ ] `POST /api/config` disabled; key rotated; `.gitignore` added.
- [ ] Outbound timeouts + retries added.
- [ ] Unknown `/api/*` returns JSON 404.
- [ ] Root `server.js` and `server/server.js` behavior reconciled (one canonical).

### Phase 1 — MVP hardening (3–5 weeks)
- [ ] Single Vite+TS frontend; delete `public/` duplicate.
- [ ] Fastify+TS API with Zod + OpenAPI; Postgres + Redis.
- [ ] Real Gemini 2.5 Flash vision + chat with provider abstraction.
- [ ] Auth (OTP), persistence, history.
- [ ] Tests (unit/integration/e2e) + CI.
- [ ] Real weather + mandi ingest with freshness.
Exit: all WS1–WS5 AC met; SLOs measured in staging.

### Phase 2 — Production (3–4 weeks)
- [ ] Security hardening (WS6), observability (WS7), CDICD (WS9).
- [ ] AI eval harness gating deploys.
- [ ] Compliance artifacts (WS12), analytics (WS13).
- [ ] Load test at 5x peak; restore drill.
Exit: all WS6–WS9, WS12–WS13 AC met; prod launch checklist signed.

### Phase 3 — Scale & polish (ongoing)
- [ ] Autoscaling, cost optimization, UX research (WS10–WS11).
- [ ] Feature flags/A-B, warehouse, monetization interfaces.
Exit: 10/10 scorecard achieved and monitored.

---

## 9. Definition of Done (per change)

A change ships only if ALL are true:
- [ ] Lint + typecheck + unit + integration pass.
- [ ] New/changed behavior has tests.
- [ ] API change has schema + OpenAPI + docs.
- [ ] Migration is reversible and tested.
- [ ] Security review for auth/input/secrets touched.
- [ ] Metrics/logs/alerts added where relevant.
- [ ] Runbook updated if new failure mode.
- [ ] Rollback verified (flag or deploy).
- [ ] README/docs updated.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI model retirement / outage | Core feature down | Provider abstraction + circuit breaker + second provider + deprecation alerts |
| Exposed API key | Cost/abuse | Rotate now; secrets manager; remove config endpoint |
| Data source (APMC) access/ToS | No real prices | Licensed feed or scrape-compliant partner; cache + fallback attribution |
| Regulatory (DPDP) non-compliance | Legal | Privacy/consent/deletion flows before launch |
| Agri-advice liability | Harm/legal | Disclaimers, safety guardrails, agronomist review |
| Solo/small team bandwidth | Slips | Phase gating; cut scope not quality |

---

## 11. Launch Checklist (prod)

- [ ] SLOs instrumented + alerting live.
- [ ] Backups + restore drill passed (RPO/RTO met).
- [ ] Secrets rotated; secret scanning clean.
- [ ] Penetration checklist closed; no high/critical vulns.
- [ ] Privacy/terms/disclaimer live; consent captured.
- [ ] Rate limits + quotas verified.
- [ ] Load test at 5x peak passed.
- [ ] Rollback rehearsed.
- [ ] On-call + runbooks in place.
- [ ] Analytics dashboards + cost tracking live.

---

## 12. Open Decisions (to confirm)

1. Hosting: Fly.io vs Render vs AWS (cost/latency in AP/TG).
2. Backend framework: Fastify (recommended) vs Express.
3. ORM: Drizzle (recommended) vs Prisma.
4. AI providers: Gemini-only vs Gemini + secondary (recommended) — which secondary.
5. Data source licensing for APMC/Agmarknet.
6. Auth: phone OTP only vs phone + Google.
7. Monorepo tool: pnpm workspace (recommended) vs Turborepo.
8. Timeline/budget constraints and team size.

---

## 13. Appendix — Immediate P0 fixes (map to code)

| Issue | Location | Fix |
|---|---|---|
| Silent AI fallback | `server.js:440-471` | Return `mode`/`reason`; surface in UI |
| Open key endpoint | `server.js:352-366` | Remove in prod; env-only key |
| No outbound timeout | `server.js:108-140` | Add timeout + retry + breaker |
| Unknown API returns HTML | `server.js:474-505` | 404 JSON for `/api/*` |
| Retired model | `server.js:228,255` | Use current GA model from config |
| Duplicate codebases | `public/` vs `client/`, `server.js` vs `server/server.js` | Consolidate |
| Missing assets in build | `client/src/components/CropDoctor.jsx:189` | Import assets or copy to public |
| Expo 404 | `client/src/services/api.js:17` | Add endpoint or remove tab |
| No `.gitignore` | repo root | Add; ignore `.env*` |
| Fake 5-day outlook | `client/src/components/WeatherCard.jsx:173` | Use daily API data |
