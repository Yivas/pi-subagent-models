# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.2.x | Yes |
| Earlier versions | No |

Security fixes target the latest published version. Upgrade before reporting an issue that only affects an older release.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Yivas/pi-subagent-models/security/advisories/new). Do not open a public issue for a suspected vulnerability.

Include:

- the affected package and version;
- the Pi and `pi-subagents` versions;
- reproduction steps or a minimal proof of concept;
- the expected and observed behavior;
- the impact you believe is possible;
- any suggested mitigation.

Remove API keys, credentials, model prompts, session files, logs containing private data, and real local configuration. A redacted example is enough.

The maintainer will use the private advisory to discuss validation, scope, credit, and coordinated disclosure. This project does not promise a fixed response or remediation time.

## Security boundaries

`pi-subagent-models` changes model fields on child launch requests. It does not provide a sandbox, authorization layer, secret store, network proxy, or security boundary around child agents. Pi and `pi-subagents` remain responsible for tool permissions, process isolation, provider authentication, and execution controls.
