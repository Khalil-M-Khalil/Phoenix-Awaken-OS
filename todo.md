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

## Desktop application layer

- [ ] Define default applications for disk management, file management, images, audio, video, archives, documents, terminals, and backup.
- [ ] Separate privileged or destructive tools such as GParted from ordinary user applications and document the authorization boundary.
- [ ] Verify Fedora package names, repository availability, licenses, and KDE integration.
- [ ] Add the approved desktop packages to the image and keep optional heavyweight tools in a separate profile.
- [ ] Add a desktop-app inventory and offline usability checks before the VMware image test.

## Phoenix visual identity

- [ ] Define Phoenix Ember, Ash, Dawn, and Evidence color tokens with accessible foreground/background pairs.
- [ ] Create reusable Phoenix wallpaper and branding assets without placing large binary files inside the image build context unnecessarily.
- [ ] Add KDE color-scheme and desktop configuration files with Ember as the default.
- [ ] Add SDDM and Plymouth theme scaffolds with graceful fallback if the theme package is unavailable.
- [ ] Apply the visual tokens to Phoenix Aether and Phoenix OSINT interfaces where supported.
- [ ] Test contrast, reduced motion, readable status colors, and theme installation in a Fedora VM.

## Competitive differentiation roadmap

- [ ] Define Phoenix Evidence Graph schema for files, numbers, URLs, cases, sources, findings, decisions, and controls.
- [ ] Add Trust Boundary UX that distinguishes fact, signal, inference, and unverified automated suggestion.
- [ ] Extend Aether to transfer an evidence bundle containing the payload, capsule manifest, hashes, and provenance.
- [ ] Design STIX 2.1 and MISP import/export adapters with original-source and tool-version preservation.
- [ ] Design Autopsy/TSK and Velociraptor report ingestion without attempting to replace those mature platforms.
- [ ] Add NIST CSF 2.0, CIS Controls, and ISO 27001 mapping metadata with versioned mappings and no automatic compliance claims.
- [ ] Add evidence profiles for Everyday Secure Desktop, OSINT Review, DFIR Triage, Evidence Review, and GRC Audit.
- [ ] Define a local-AI triage threat model; automated summaries must remain labeled as unverified suggestions.
- [ ] Prioritize P0/P1 features before adding fleet/server mode or a large offensive tool collection.

## Competitive core implementation

- [ ] Define the Phoenix Evidence Graph schema and version it.
- [ ] Define trust states for fact, signal, inference, unverified automation, and operator decision.
- [ ] Add provenance fields: source, timestamp, tool/version, hash, authorization context, and limitations.
- [ ] Implement a local graph/case export without a server or cloud dependency.
- [ ] Add Trust Boundary display and validation for Phoenix, Aether, security checks, and imported reports.
- [ ] Add Aether Evidence Relay bundle format containing payload manifest, capsule, hashes, and transfer metadata.
- [ ] Add tests for tampering, path traversal, missing provenance, invalid trust transitions, and offline operation.

## Integration and GRC mapping

- [ ] Inventory Phoenix OSINT output and Aether transfer metadata fields.
- [ ] Define versioned local mappings for NIST CSF 2.0, CIS Controls, and ISO 27001 Annex A references without making automatic compliance claims.
- [ ] Add Control Mapper records with control ID, framework, version, rationale, evidence references, and review status.
- [ ] Add graph adapters for OSINT findings, Aether transfers, and security-scan reports.
- [ ] Apply Trust Boundary states to imported and automated findings.
- [ ] Add unified integration CLI and machine-readable exports.
- [ ] Add integration tests and validate offline behavior.
