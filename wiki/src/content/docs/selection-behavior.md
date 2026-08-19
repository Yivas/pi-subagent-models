---
title: Selection behavior
description: Understand precedence, launch coverage, persistence, and boundaries.
---

## Precedence

Pi resolves a child launch in this order:

1. forced session selection;
2. forced global selection;
3. a model supplied by the parent agent or launch command;
4. native `pi-subagents` agent and session defaults.

A forced selection replaces the parent's per-run model. Set both selectors to `Default` when the parent should choose each child.

## Covered launch paths

| Path | Override format |
| --- | --- |
| `subagent` tool | `provider/model:thinking` model argument |
| `/run`, `/parallel`, `/chain` | patched slash-command request |
| Prompt-template delegation V2 | separate `model` and `thinking` fields |
| Legacy delegation | model argument on each task |
| RPC `spawn` | patched request parameters |
| Scheduled launch | selection captured when scheduled |

Management actions remain unchanged.

## Persistence

Global state is read at launch time so separate Pi processes can share updates. Session state uses Pi custom session entries and restores the latest valid marker from the active branch.

Invalid persisted values fall back to `Default` rather than forcing a malformed model reference.

## Boundaries

The extension does not:

- change the parent session model;
- choose models automatically;
- edit installed `pi-subagents` files;
- add provider fallback logic;
- send telemetry or network requests;
- rewrite a scheduled run after it has been queued.

:::caution
A forced override is intentionally stronger than a model selected by the parent for one run. Clear both scopes before testing native per-agent or per-run configuration.
:::
