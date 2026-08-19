---
title: Development
description: Test package behavior, inspect the npm artifact, and build the documentation site.
---

## Package checks

From the repository root:

```text
npm test
npm pack --dry-run
```

`npm test` checks TypeScript syntax and runs the Node test suite. The pack dry run lists every file that would enter the npm tarball.

## Wiki checks

The wiki is an independent Astro project so its dependencies do not enter the plugin package:

```text
npm ci --prefix wiki
npm run build --prefix wiki
```

The production build writes to `wiki/dist/`.

## Integration invariants

Keep these behaviors intact:

- the parent Pi model never changes;
- `Default` leaves native resolution unchanged;
- forced overrides cover tool, slash, delegation, and RPC launches;
- global state remains shared across processes;
- session state follows the active branch;
- management actions remain unmodified.

## Pull requests

Read [CONTRIBUTING.md](https://github.com/Yivas/pi-subagent-models/blob/main/CONTRIBUTING.md) before changing behavior or compatibility. Pull requests should include focused verification and no private prompts, credentials, sessions, logs, endpoints, or real configuration.

:::tip
When changing `pi-subagents`, verify its event contracts before updating the declared peer version. A green unit test does not prove slash-command or RPC compatibility.
:::
