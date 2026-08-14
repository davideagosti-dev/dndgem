# Security Policy

## Supported versions

DnDGem is preparing Public Alpha (`0.x` prereleases). Security fixes will target the default development branch until a stable release exists.

## Reporting a vulnerability

Please report security issues privately. Do not open public issues for undisclosed vulnerabilities.

Preferred contact: **security@fingem.ai**

Include:

- description of the issue
- impact assessment if known
- reproduction steps or proof-of-concept if available
- affected commit/branch if known

You should receive an acknowledgement when the report is received. Timing may vary during early development.

## Dependency hygiene

- Use the committed `pnpm-lock.yaml`
- Prefer `pnpm install --frozen-lockfile` in CI
- Keep GitHub Actions pinned to major versions with least privilege (`contents: read` by default)
- Do not commit secrets (`.env`, credentials, tokens)
