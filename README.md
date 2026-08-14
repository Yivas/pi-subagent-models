# pi-subagent-models

Set one model and thinking level for every `pi-subagents` child, globally or for one Pi session. The parent session keeps its current model.

## Package

- npm: [`pi-subagent-models`](https://www.npmjs.com/package/pi-subagent-models)
- Source: [`Yivas/pi-subagent-models`](https://github.com/Yivas/pi-subagent-models)

Current release: `0.1.0`.

## Requirements

- Pi `0.84.1`.
- `pi-subagents` `0.40.0`.
- This package must load before `pi-subagents`.

## Installation

Install the pinned npm release:

```text
pi install npm:pi-subagent-models@0.1.0
```

Then make sure this package appears before `pi-subagents` in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "npm:pi-subagent-models@0.1.0",
    "npm:pi-subagents@0.40.0"
  ]
}
```

Keep the remaining package entries unchanged. Restart Pi or run `/reload`.

The order matters because this extension patches delegation requests before `pi-subagents` resolves them.

You can also install the matching Git tag:

```text
pi install git:github.com/Yivas/pi-subagent-models@v0.1.0
```

## Usage

Choose a global model:

```text
/subagents-model
```

Override only the current session:

```text
/subagents-model-session
```

Both commands show `Default` first, followed by the models available in the current Pi registry. Selecting a model opens a second selector for its thinking level.

Global `Default` restores normal `pi-subagents` model resolution. Session `Default` inherits the global selection.

Changes affect new child launches without changing the parent session model.

## Default and parent choice

`Default` makes this extension a no-op for that scope. With both scopes on `Default`, the parent agent can choose a model when it creates a child through the native `model` field:

```text
subagent({ agent: "reviewer", task: "Review the change", model: "provider/model:high" })
```

The same field is available on parallel tasks and chain steps. This extension does not choose models automatically for the parent.

Selection precedence is:

1. Forced session selection.
2. Forced global selection.
3. Model supplied by the parent agent or command.
4. Native agent configuration and Pi session defaults.

A forced selection replaces the parent's per-run choice. Set the session and global selectors to `Default` when the parent should choose each child model. `Default` in the thinking selector preserves native `pi-subagents` thinking resolution.

## Coverage

The override applies to:

- the `subagent` tool;
- `/run`, `/parallel`, and `/chain`;
- prompt-template delegation;
- `pi-subagents` RPC spawn requests.

It replaces per-agent and per-run model choices while forced. Management calls remain unchanged.

Scheduled runs capture the selection active when they are scheduled. Changing the selector later does not rewrite queued runs.

## State

The global selection is stored in `~/.pi/agent/subagent-model.json`. Session selections use Pi custom session entries and survive resume and branch navigation.

## Development

```text
npm test
npm pack --dry-run
```

The integration depends on the `pi-subagents` `0.40.0` event contracts. Run the tests and verify each launch path before updating `pi-subagents`.

## License

[MIT](LICENSE)
