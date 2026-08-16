# Releases

Public Alpha and subsequent release notes for **DnDGem by DA62**.

| Version / gate                       | Document                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| DND-2.5 Stage A readiness            | [dnd-2.5-stage-a-readiness.md](./dnd-2.5-stage-a-readiness.md) |
| `0.1.0-alpha.0` (first Public Alpha) | [0.1.0-alpha.0.md](./0.1.0-alpha.0.md)                         |

Publication from `master` via the controlled publish workflow completed for `0.1.0-alpha.0` (dist-tag `alpha`). See [Release Strategy](../architecture/release-strategy.md) and [0.1.0-alpha.0](./0.1.0-alpha.0.md).

Post-release auth migration: primary publish uses npm Trusted Publishing (GitHub Actions OIDC). Full end-to-end verification waits for the next legitimate Alpha publish — do not create a test-only version solely to prove OIDC.

Canonical public identity: **https://dndgem.dev** (**OWNED AND LIVE**). Canonical playground: **https://playground.dndgem.dev/** (**LIVE**). Current brand attribution: **DnDGem by DA62**. Support: `support@dndgem.dev`. Security: `security@dndgem.dev`. See [Public site & domain hosting](../architecture/public-site.md) and [Product identity](../architecture/product-identity.md). Package `homepage` / support metadata in git point at `dndgem.dev`; published `0.1.0-alpha.0` tarballs are unchanged until the next legitimate Alpha release.
