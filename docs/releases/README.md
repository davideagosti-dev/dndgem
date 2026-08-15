# Releases

Public Alpha and subsequent release notes for **DnDGem by FinGem-AI**.

| Version / gate                       | Document                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| DND-2.5 Stage A readiness            | [dnd-2.5-stage-a-readiness.md](./dnd-2.5-stage-a-readiness.md) |
| `0.1.0-alpha.0` (first Public Alpha) | [0.1.0-alpha.0.md](./0.1.0-alpha.0.md)                         |

Publication from `master` via the controlled publish workflow completed for `0.1.0-alpha.0` (dist-tag `alpha`). See [Release Strategy](../architecture/release-strategy.md) and [0.1.0-alpha.0](./0.1.0-alpha.0.md).

Post-release auth migration: primary publish uses npm Trusted Publishing (GitHub Actions OIDC). Full end-to-end verification waits for the next legitimate Alpha publish — do not create a test-only version solely to prove OIDC.

Canonical public identity (post-release follow-up): **https://dndgem.dev** — see [Public site & domain hosting](../architecture/public-site.md). Package `homepage` / support metadata in git point at `dndgem.dev`; published `0.1.0-alpha.0` tarballs are unchanged until the next legitimate Alpha release.
