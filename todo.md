# Phoenix Awaken OS — Integration Tasks

## Current integration scope

- [ ] Confirm the exact private GitHub repository and source path for the Phoenix OSINT application.
- [ ] Inventory Phoenix OSINT runtime dependencies, network behavior, local data stores, and licensing.
- [ ] Define a least-privilege integration boundary for Phoenix Aether, Phoenix OSINT, and Evidence Capsule.
- [ ] Add a unified Phoenix launcher and KDE application entries without weakening OS isolation.
- [ ] Route OSINT outputs and Aether transfer metadata into Evidence Capsule manifests without uploading user data.
- [ ] Add local-only audit logging, SHA-256 provenance, export, and clear user consent for any network-enabled lookup.
- [ ] Build isolated test fixtures for phone, domain, URL, and file-evidence workflows.
- [ ] Run Strix only against Phoenix-owned components and a disposable test environment; record findings and remediation.
- [ ] Add regression tests for permissions, path traversal, unsafe URL handling, secrets exposure, and offline mode.
- [ ] Rebuild the bootc image in a Fedora VM or persistent Linux host with loop devices, EFI/vfat support, and normal `/dev/shm`.
- [ ] Generate an ISO and validate boot, install, offline operation, Aether transfer, OSINT workflows, and Evidence Capsule export in VMware.
- [ ] Prepare release documentation, threat model, checksums, SBOM, privacy notice, and download-site requirements.

## Safety and product constraints

- [ ] Keep all GitHub repositories private until the owner explicitly chooses a public release.
- [ ] Keep core workflows local-first; no hidden telemetry, cloud upload, self-deletion, IP blocking, or destructive anti-tamper behavior.
- [ ] Treat OSINT results as leads, not proof; display source, timestamp, confidence, and limitations.
- [ ] Do not bundle offensive exploitation tools into the default desktop experience.
