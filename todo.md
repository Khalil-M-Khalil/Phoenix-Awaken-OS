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

## Tooling expansion roadmap

- [ ] Define tool-selection criteria: mission fit, offline capability, least privilege, licensing, maintenance, attack surface, and evidence integration.
- [ ] Evaluate a forensic acquisition and triage tool for local evidence workflows.
- [ ] Evaluate a disk and file-system inspection tool with read-only defaults.
- [ ] Evaluate a network visibility tool for owned or consented networks, disabled by default.
- [ ] Evaluate a secrets and credential-exposure scanner for local source trees, with redaction and no upload.
- [ ] Evaluate SBOM, dependency, and container-image inspection utilities.
- [ ] Evaluate a GRC control-mapping and report-generation utility that can feed Evidence Capsule metadata.
- [ ] Exclude offensive exploitation frameworks, credential theft tools, hidden telemetry, and tools with unclear licensing from the default image.
- [ ] Package only the first priority set after dependency, license, offline, and Strix validation.

## First security tool bundle implementation

- [ ] Pin and document Syft, Grype, Gitleaks or maintained replacement, and YARA versions.
- [ ] Verify licenses, release provenance, architecture support, and offline behavior for the selected binaries.
- [ ] Add non-destructive wrappers with explicit target paths and redacted machine-readable reports.
- [ ] Add a local Phoenix security-workbench command to run selected checks and record metadata.
- [ ] Link generated reports to Evidence Capsule without uploading scan targets or secrets.
- [ ] Add synthetic fixtures and negative tests for secret redaction, path validation, and report integrity.
- [ ] Run Strix against the new wrappers and integration code before marking the bundle release-ready.
