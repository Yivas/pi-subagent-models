# Contributing

Bug reports, documentation improvements, and focused pull requests are welcome.

## Before you start

- Use [private vulnerability reporting](https://github.com/Yivas/pi-subagent-models/security/advisories/new) for security issues.
- Search existing issues before opening a new one.
- Open an issue before a change that alters command behavior, persisted state, compatibility, or integration contracts.
- Keep examples fictional and remove prompts, credentials, session data, model selections, endpoints, and local configuration.

## Development setup

Requirements:

- Node.js 24;
- Pi `0.84.1`;
- `pi-subagents` `0.40.0` for integration contract work.

Clone the repository and run:

```text
npm test
npm pack --dry-run
```

The documentation site has its own dependencies:

```text
npm ci --prefix wiki
npm run build --prefix wiki
```

## Change guidelines

- Preserve `Default` as a no-op for native `pi-subagents` model resolution.
- Never change the parent Pi session model.
- Keep the package independent from installed `pi-subagents` files.
- Add no telemetry, analytics, phone-home behavior, or correlatable identifiers.
- Make the smallest change that covers every affected launch path.
- Write code, comments, tests, documentation, issues, pull requests, and commits in English.
- Update tests and user documentation when behavior changes.

## Pull requests

A pull request should explain the problem, the chosen change, compatibility impact, and verification performed. Keep unrelated refactors out of the same pull request.

Before requesting review:

- run `npm test`;
- run `npm pack --dry-run`;
- build the wiki when documentation files change;
- inspect the diff for private data, secrets, unexpected network access, and package contents;
- confirm the parent model and `Default` behavior remain unchanged.

Maintainers may ask for a smaller change or close proposals that conflict with the project scope. Submission does not guarantee inclusion or a release schedule.
