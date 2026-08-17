# Phoenix Awaken OS — Strix Rules of Engagement

The only authorized targets are Phoenix Awaken OS source files, locally built images, and intentionally created test services owned by the project operator.

The assessment must not scan public websites, third-party repositories, home directories, production credentials, personal files, or arbitrary network addresses. It must not use real customer data or secrets. The test environment must be disposable, isolated, and network-restricted to the minimum required for the local target.

Findings must be treated as hypotheses until reproduced safely. Do not run destructive payloads, persistence actions, denial-of-service tests, credential attacks, or data exfiltration. Store reports locally and attach only sanitized findings to an Evidence Capsule. Any proposed patch must be reviewed by a human and followed by a regression test.

The Strix process is a release-qualification aid. It is not a replacement for an independent penetration test, secure code review, threat modeling, or distribution-level hardening review.
