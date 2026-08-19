---
title: Getting started
description: Install pi-subagent-models and verify that Pi loads it before pi-subagents.
---

## Requirements

| Component | Supported version |
| --- | --- |
| Pi | `0.84.1` |
| `pi-subagents` | `0.40.0` |
| `pi-subagent-models` | `0.2.0` |

## Install the package

npm publication is pending registry 2FA. Until `0.2.0` appears on npm, install the verified Git tag:

```text
pi install git:github.com/Yivas/pi-subagent-models@v0.2.0
```

The package must load before `pi-subagents`. Keep all other package entries unchanged:

```json
{
  "packages": [
    "git:github.com/Yivas/pi-subagent-models@v0.2.0",
    "npm:pi-subagents@0.40.0"
  ]
}
```

Restart Pi or run `/reload` after changing package order.

:::caution
A later `pi-subagents` version may change the event contracts used for slash commands, delegation, or RPC. Test every launch path before changing the pinned version.
:::

## Verify the installation

Run:

```text
pi list
```

Confirm that `pi-subagent-models` appears before `pi-subagents`. In Pi, type `/subagents-model` and `/subagents-model-session`; both commands should appear in completion.

:::tip
Start with `Default` in both scopes. This confirms the commands load without changing native child model resolution.
:::

## Choose a model

Use the global command when every Pi terminal should share the same child model:

```text
/subagents-model
```

Use the session command when only the active session branch should differ:

```text
/subagents-model-session
```

Selecting a model opens a second selector for its supported thinking levels.
