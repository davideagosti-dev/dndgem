# Public site & domain hosting

Canonical public product identity for **DnDGem by FinGem-AI**.

## Canonical URLs

| Role                     | URL                                  | Status                                          |
| ------------------------ | ------------------------------------ | ----------------------------------------------- |
| Product / developer home | https://dndgem.dev/                  | Domain owned; DNS/hosting configuration pending |
| Docs entry               | https://dndgem.dev/docs/             | Served by `apps/www` once deployed              |
| Quick Start              | https://dndgem.dev/docs/quick-start/ | Served by `apps/www` once deployed              |
| Support                  | https://dndgem.dev/support/          | Served by `apps/www` once deployed              |
| Playground (preferred)   | https://playground.dndgem.dev/       | Custom domain pending on existing Pages app     |
| Playground (provider)    | https://dndgem-playground.pages.dev/ | LIVE                                            |

Do **not** treat these as canonical product homes:

- `https://davideagosti.com/dndgem`
- `https://dndgem.fingem-ai.com`

## Architecture decision

Separate deployments:

```text
apps/www  →  Cloudflare Pages project (new)  →  dndgem.dev
apps/playground → existing Cloudflare Pages project → playground.dndgem.dev
                                              ↘ dndgem-playground.pages.dev (keep)
```

Rationale: product landing/docs stay static and decoupled from the interactive playground runtime. No library package depends on website hosting.

DNS authority remains at **Spaceship** (`launch1.spaceship.net` / `launch2.spaceship.net`) unless a later operational need justifies moving nameservers to Cloudflare.

## Repository artifacts

| Path               | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `apps/www/site/**` | Static Public Alpha site source                  |
| `apps/www/dist/**` | Build output (`pnpm --filter @dndgem/www build`) |
| `apps/playground`  | Interactive Alpha demo                           |

Build the site locally:

```bash
pnpm --filter @dndgem/www build
pnpm --filter @dndgem/www test
```

## External configuration (required for LIVE)

Repository changes alone cannot make `dndgem.dev` resolve. Complete these manually:

### A. Cloudflare Pages — root site (`dndgem.dev`)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages**.
2. Create a project for the root site (suggested name: `dndgem`).
3. Deploy `apps/www/dist` (Direct Upload) **or** connect the private GitHub repo and set:
   - build command: `pnpm --filter @dndgem/www build`
   - output directory: `apps/www/dist`
   - root directory: repository root (or follow the UI’s monorepo guidance)
4. **Custom domains** → add `dndgem.dev` (and optionally `www.dndgem.dev` if you want the www redirect).
5. Copy the **exact** DNS records Cloudflare displays for verification / routing.
   - Do not invent A / AAAA / CNAME / TXT values.
   - For apex domains, Cloudflare may require CNAME flattening / ALIAS / specific records depending on the registrar UI.

### B. Cloudflare Pages — playground (`playground.dndgem.dev`)

1. Open the existing Pages project that serves `https://dndgem-playground.pages.dev/`.
2. **Custom domains** → add `playground.dndgem.dev`.
3. Copy the **exact** DNS record(s) Cloudflare shows (typically a CNAME to the project’s `*.pages.dev` hostname, plus any verification TXT if requested).
4. Keep `dndgem-playground.pages.dev` available; do not delete it.

### C. Spaceship DNS

1. Spaceship → domain **dndgem.dev** → **DNS**.
2. Leave nameservers on Spaceship unless you intentionally migrate DNS to Cloudflare.
3. Add only the records Cloudflare showed in steps A/B (type / name / target / TTL as displayed).
4. Wait for DNS propagation, then confirm Cloudflare marks each custom domain as **Active**.

### D. Post-config verification

Confirm externally before claiming LIVE:

- `https://dndgem.dev/` → 200, intended landing, valid TLS
- `https://dndgem.dev/docs/`, `/docs/quick-start/`, `/support/` → intended pages
- `http://dndgem.dev/` → HTTPS upgrade (`.dev` is HSTS-preloaded)
- `https://www.dndgem.dev/` → redirect to `https://dndgem.dev/` **if** www was configured
- `https://playground.dndgem.dev/` → playground loads; provider URL still works
- No certificate mismatch / redirect loop

## Package metadata note

`homepage` / `bugs` in `@dndgem/*` package.json point at `https://dndgem.dev`. Published npm tarball `0.1.0-alpha.0` is unchanged until the next legitimate Alpha release. Do not republish solely for metadata.

## Contacts

- Support: `support@fingem-ai.com`
- Security: `security@fingem.ai`
