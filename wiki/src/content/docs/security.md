---
title: Security
description: Report vulnerabilities privately and understand the extension's trust boundaries.
---

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/Yivas/pi-subagent-models/security/advisories/new). Do not publish a suspected vulnerability in an issue.

Provide the affected versions, reproduction steps, expected impact, and a redacted proof of concept. Remove credentials, prompts, session files, logs containing private data, endpoints, and real model selections.

Read the complete [security policy](https://github.com/Yivas/pi-subagent-models/blob/main/SECURITY.md) before submitting a report.

## Trust boundaries

`pi-subagent-models` changes child launch request fields. It is not a sandbox or authorization mechanism.

| Responsibility | Owner |
| --- | --- |
| Model override selection | `pi-subagent-models` |
| Tool permissions and capability limits | Pi and `pi-subagents` |
| Provider credentials | Pi provider configuration |
| Child process isolation | `pi-subagents` runtime and host environment |
| Secret handling in prompts and tools | User and runtime policy |

The package performs no telemetry, analytics, or network requests.

:::caution
A selected child model still receives the tools and context granted by the surrounding runtime. Model selection does not reduce those permissions.
:::
