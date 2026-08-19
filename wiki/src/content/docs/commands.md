---
title: Commands
description: Use the global and session model selectors.
---

## `/subagents-model`

Sets the global selection stored in `~/.pi/agent/subagent-model.json`. Pi processes share this file, so new child launches in other terminals see the change.

Choose `Default` to clear the global override.

## `/subagents-model-session`

Adds a custom entry to the active Pi session branch. The session selection wins over the global selection and follows branch navigation and resume.

Choose `Default` to make the session inherit the global selection.

## TUI selector controls

These controls apply in interactive TUI mode. Non-TUI clients use Pi's native selection dialog.

| Input | Result |
| --- | --- |
| Type text | Fuzzy-filter the available choices |
| `Up` / `Down` | Move through results and wrap at either end |
| `Enter` | Confirm the highlighted choice |
| `Escape` or `Ctrl+C` | Cancel without changing state |

Long catalogs show at most ten choices and include a position indicator such as `(1/102)`.

:::note
Entering a query with no matches keeps the selector open. Edit the query or cancel the dialog.
:::

## Thinking levels

The second selector starts with `Default`, followed by the levels supported by the chosen model. `Default` preserves native `pi-subagents` thinking resolution.

A model that does not support reasoning exposes only `off`. Provider-specific mappings can hide unsupported `xhigh` or `max` choices.
