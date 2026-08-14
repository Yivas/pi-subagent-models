# AGENTS.md

This repository contains only material intended for the public `pi-subagent-models` project. It is currently local and unpublished. All code, identifiers, comments, tests, documentation, issues, pull requests, releases, branches, and commits must be written in English.

## Scope

The package adds global and per-session model selectors for children launched through `pi-subagents`. It must never change the parent Pi session model.

Keep the package independent from private planning, local profiles, prompts, credentials, sessions, logs, and model selections. Examples must use fictional or generic values.

## Rules

- Make the smallest correct change and reuse Pi or Node APIs before adding dependencies.
- Do not modify installed `pi-subagents` files or depend on private APIs outside the documented event contracts pinned by this package.
- Preserve `Default`: it must leave native `pi-subagents` model resolution unchanged.
- Preserve package load order: `pi-subagent-models` must load before `pi-subagents`.
- Do not add telemetry, analytics, phone-home behavior, secrets, real endpoints, or correlatable identifiers.
- Read every file completely before editing it.
- Run `npm test` and `npm pack --dry-run` after executable changes.
- Run a code review after executable changes.

## Git

Work on the current branch. Do not create branches unless requested. Before committing, inspect `git status`, `git diff`, and recent history. Commit only public package files and use English commit messages without AI metadata.
