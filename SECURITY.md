# Security Policy

`@canvasflow/feed` is an **internal** Canvasflow library. It parses **untrusted
RSS/Atom feeds and HTML** into Canvasflow components, so input-handling bugs
(HTML/XML parsing, sanitization bypasses, ReDoS) are treated as security issues.

## Supported versions

Only the latest released version is supported. Fixes are shipped forward; please
upgrade to the most recent release rather than patching older versions.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Report privately via GitHub's **[Report a vulnerability](https://github.com/Canvasflow/feed/security/advisories/new)**
(Security → Advisories), or contact the Canvasflow maintainers directly through
internal channels.

Please include:

- A description of the issue and its impact.
- A minimal feed/HTML snippet or steps to reproduce.
- The affected version and any relevant configuration (`Params` / `Mapping`).

We'll acknowledge the report, investigate, and coordinate a fix and release.
Since this package handles untrusted input, please avoid sharing working
exploits in any public forum until a fix is available.

## Scope notes

- The library is designed to be **pure** and to surface malformed input through
  `errors` / `warnings` rather than throwing — report cases where bad input
  instead crashes, hangs, or produces unsafe output.
- HTML sanitization relies on `sanitize-html`; suspected sanitization bypasses
  are in scope.
