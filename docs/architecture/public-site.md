# Public site & domain hosting

Canonical public product identity for **DnDGem by DA62**.

See also [Product identity](./product-identity.md).

## Status

| Surface                 | Classification     |
| ----------------------- | ------------------ |
| `dndgem.dev`            | **OWNED AND LIVE** |
| `playground.dndgem.dev` | **LIVE**           |
| TLS (both hosts)        | **ACTIVE**         |

Post-release canonical-domain follow-up: **COMPLETE**.

## Canonical URLs

| Role                     | URL                                  | Status                                        |
| ------------------------ | ------------------------------------ | --------------------------------------------- |
| Product / developer home | https://dndgem.dev/                  | **OWNED AND LIVE**                            |
| Docs entry               | https://dndgem.dev/docs/             | LIVE (`apps/www`)                             |
| Quick Start              | https://dndgem.dev/docs/quick-start/ | LIVE (`apps/www`)                             |
| Support                  | https://dndgem.dev/support/          | LIVE (`apps/www`)                             |
| Playground (canonical)   | https://playground.dndgem.dev/       | **LIVE**                                      |
| Root provider / fallback | https://dndgem.pages.dev/            | LIVE (Cloudflare Pages; not product identity) |
| Playground provider      | https://dndgem-playground.pages.dev/ | LIVE (fallback; not product identity)         |

Do **not** treat these as canonical product homes:

- `https://davideagosti.com/dndgem`
- `https://dndgem.fingem-ai.com`
- `https://dndgem.pages.dev` (provider URL only)
- `https://dndgem-playground.pages.dev/` (provider / historical Alpha launch URL)

## Topology

```text
Spaceship
  ↓ registrar (domain registration remains at Spaceship)

Cloudflare authoritative DNS
  ├── dndgem.dev
  │     ↓
  │   Cloudflare Pages project: dndgem
  │     · canonical: https://dndgem.dev
  │     · provider:  https://dndgem.pages.dev
  │
  └── playground.dndgem.dev
        ↓
      Cloudflare Pages (existing playground project)
        · canonical: https://playground.dndgem.dev
        · provider:  https://dndgem-playground.pages.dev
```

| Layer             | Provider                                        |
| ----------------- | ----------------------------------------------- |
| Registrar         | Spaceship                                       |
| Authoritative DNS | Cloudflare (nameservers delegated at registrar) |
| Hosting / edge    | Cloudflare Pages                                |

Spaceship remains the **registrar**. Cloudflare is **authoritative DNS** and the **hosting edge**. Both custom domains are proxied through Cloudflare with TLS active.

Rationale for split deployments: product landing/docs stay static and decoupled from the interactive playground runtime. No library package depends on website hosting.

```text
apps/www        → Cloudflare Pages `dndgem`           → dndgem.dev
apps/playground → existing Cloudflare Pages project → playground.dndgem.dev
                                                  ↘ dndgem-playground.pages.dev (keep)
```

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

## Maintenance / recovery

Initial DNS, custom-domain, and TLS activation for `dndgem.dev` and `playground.dndgem.dev` are **complete**. The steps below are for **maintenance or recovery only**, not pending setup.

### Root site (`dndgem` Pages project)

1. Cloudflare Dashboard → **Workers & Pages** → project **`dndgem`**.
2. Deploy `apps/www/dist` (Direct Upload) **or** connect the private GitHub repo with:
   - build command: `pnpm --filter @dndgem/www build`
   - output directory: `apps/www/dist`
   - root directory: repository root (or follow the UI’s monorepo guidance)
3. Custom domain `dndgem.dev` remains attached; restore from Cloudflare’s displayed DNS guidance if records drift.
4. Keep provider URL `https://dndgem.pages.dev` available.

### Playground Pages project

1. Open the existing Pages project that serves `https://dndgem-playground.pages.dev/`.
2. Custom domain `playground.dndgem.dev` remains attached; restore DNS only if records drift.
3. Keep `https://dndgem-playground.pages.dev/` available; do not delete it.

### Registrar / DNS recovery

1. Spaceship → domain **dndgem.dev** — confirm Cloudflare nameservers remain delegated.
2. Cloudflare DNS zone — restore only records Cloudflare shows for the Pages custom domains (do not invent targets).
3. Confirm Cloudflare marks each custom domain **Active** and TLS valid.

### Sanity checks

- `https://dndgem.dev/` → intended landing, valid TLS
- `https://dndgem.dev/docs/`, `/docs/quick-start/`, `/support/` → intended pages
- `http://dndgem.dev/` → HTTPS upgrade (`.dev` is HSTS-preloaded)
- `https://www.dndgem.dev/` → redirect to `https://dndgem.dev/` if www is configured
- `https://playground.dndgem.dev/` → playground loads
- Provider URLs still resolve as fallbacks
- No certificate mismatch / redirect loop

## Package metadata note

`homepage` / `bugs` in `@dndgem/*` package.json point at `https://dndgem.dev`. Published npm tarball `0.1.0-alpha.0` is unchanged until the next legitimate Alpha release. Do not republish solely for metadata.

## Contacts

- Support: `support@dndgem.dev`
- Security: `security@dndgem.dev`
