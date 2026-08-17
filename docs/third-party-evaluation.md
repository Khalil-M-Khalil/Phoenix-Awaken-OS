# Third-Party Evaluation for Phoenix Awaken OS

## Decision summary

Phoenix Awaken OS will use Strix as an **external, opt-in security validation tool** during development and release qualification. Strix will not run as a privileged background service inside the base OS image. Tests will target only locally owned Phoenix images, applications, and intentionally isolated lab services.

Open SEO will remain an **optional workstation profile** and will not be included in the base ISO. Its purpose is SEO research and agent-assisted site analysis, which is orthogonal to the core security desktop. It requires a DataForSEO API key and may perform external data collection, so enabling it by default would weaken the local-only and minimal-network posture of the base image.

## Strix assessment

The official repository describes Strix as an Apache-2.0 licensed, Docker-based AI penetration-testing tool with reconnaissance, dynamic testing, exploit validation, proof-of-concept generation, reporting, and CI/CD integration. The README requires Docker and an LLM provider key for the first scan. It stores run results on disk and exposes a local viewer bound to loopback.

The safe Phoenix integration is therefore a **security qualification profile**, not a default end-user feature. The profile should provide a documented runner that:

1. Builds a disposable Phoenix test target or starts a local test service.
2. Applies explicit scope and rules of engagement.
3. Runs Strix with no production credentials and no access to the host filesystem beyond the target workspace.
4. Stores the run directory as an Evidence Capsule input.
5. Converts validated findings into remediation tasks and regression tests.

The profile must require an explicit operator action. It must not scan arbitrary network targets, the user's home directory, or external services by default.

## Open SEO assessment

The official repository is MIT-licensed and provides keyword research, rank tracking, competitor insights, backlinks, site audits, AI visibility, MCP integration, and agent skills. Its self-hosting documentation describes Docker and Cloudflare paths, and its data workflows require a DataForSEO API key with direct usage costs.

Open SEO is not part of the security core. If included later, it should be a separate profile or optional container with:

- no automatic startup;
- secrets stored outside the immutable base image;
- explicit network permission;
- clear cost and external-data disclosure;
- no MCP exposure until the operator configures it.

## Architectural boundary

| Component | Base ISO | Optional profile | Development-only |
|---|---:|---:|---:|
| Fedora Atomic/KDE | Yes | No | No |
| Evidence Capsule | Yes | No | No |
| Phoenix Aether | Yes, as an application | No | No |
| Strix | No | Security Validation profile | Yes during release testing |
| Open SEO | No | SEO/Research profile | Optional |

## References

[1]: https://github.com/usestrix/strix "usestrix/strix official repository"
[2]: https://github.com/every-app/open-seo "every-app/open-seo official repository"
[3]: https://github.com/osbuild/bootc-image-builder "bootc-image-builder official repository"

## Local qualification runner

The repository now includes `security/strix-local-qualification.sh` and `security/strix-rules-of-engagement.md`. The runner refuses URLs and targets outside the Phoenix project root, requires explicit LLM environment variables, and writes run output under `security/runs/`. It is intentionally not copied into the base OS image and is not executed automatically.
