# Phoenix Awaken OS

## Evidence-First Security Desktop

Phoenix Awaken OS is a proposed USB-bootable and installable Linux desktop centered on locally controlled **Evidence Capsules**. The first repository milestone is deliberately smaller than a complete operating system: it proves the core workflow before we compose a Fedora Atomic image.

The prototype can create a local case, hash evidence incrementally with SHA-256, record a trust boundary, preserve decisions and timeline events, and export a JSON manifest plus a readable Markdown report. It does not upload files, contact a cloud service, delete anything, block IP addresses, or change the host operating system.

## Current Scope — v0.1.0

| Capability | Status |
|---|---|
| Local Evidence Capsule model | Implemented |
| Incremental SHA-256 hashing | Implemented |
| Trust levels: trusted, review, untrusted | Implemented |
| Risk/control identifiers | Implemented |
| Timeline and decisions | Implemented |
| JSON and Markdown export | Implemented |
| Phoenix OSINT desktop integration | Integrated into image build |
| Phoenix Aether transfer linkage | Integrated into image build |
| Evidence Capsule provenance workflow | Integrated |
| Phoenix Evidence Graph | Implemented locally in Python and CLI |
| Trust Boundary policy | Implemented with explicit transitions |
| Aether Evidence Relay bundle | Implemented locally with manifest verification |
| KDE desktop integration | Integrated into image build |
| Daily desktop applications | Integrated into image build |
| Phoenix Ember/Ash/Dawn/Evidence themes | Integrated into image build |
| SDDM and Plymouth Phoenix branding | Scaffolded for image build |
| Fedora Atomic image | Planned |
| Live USB and installer | Planned |

## Run Locally

```bash
python3 -m pytest
python3 -m capsule.cli "First local case" ./sample.txt \
  --trust review \
  --control-id A.8.15 \
  --decision "Retain locally until provenance is confirmed" \
  --out ./capsule-output
```

The command writes `capsule.json` and `capsule.md` under the selected output directory. The implementation is local-only and is intended for synthetic fixtures during this first milestone.

## Unified Phoenix Workbench

The planned desktop image brings together three related workflows. **Phoenix** is the authorised, local-first OSINT workbench for phone-number metadata and explicitly permitted enrichment. **Phoenix Aether** handles local transfer and links transfer metadata to evidence cases. **Evidence Capsule** preserves provenance, SHA-256 fingerprints, trust context, decisions, and exportable reports.

These components are deliberately separated by responsibility. Phoenix OSINT does not treat an enrichment result as proof; its reports must retain source, timestamp, status, confidence, and limitations. Aether does not silently upload files. Evidence Capsule stores verifiable metadata and operator decisions rather than pretending that a hash alone proves safety.

Inside the Fedora image, Phoenix OSINT is exposed as the `Phoenix` KDE application and `/usr/bin/phoenix-osint` launcher. Aether is exposed as `Phoenix Aether`, and the capsule CLI remains available as `phoenix-capsule`. Network enrichment stays opt-in and no provider secret is embedded in the image.

The image also includes a practical KDE desktop layer: Dolphin, Konsole, Kate, Ark, Okular, Gwenview, Spectacle, GIMP, Krita, Haruna, Kdenlive, GParted, KDE Partition Manager, Filelight, KBackup, KDE Connect, Skanlite, Pavucontrol, and LibreOffice. Disk partitioning tools are present for advanced users but are treated as privileged, potentially destructive operations; they must never be used casually or against an unverified device.

Phoenix Ember is the default visual identity, with Phoenix Ash and Phoenix Dawn for light desktop sessions and Phoenix Evidence for neutral evidence-review work. The image carries the KDE color schemes and SVG wallpapers, while the SDDM and Plymouth surfaces use Ember as the stable boot and login boundary.

The competitive core now includes a local **Phoenix Evidence Graph** and **Trust Boundary**. A graph connects cases, evidence, sources, findings, transfers, decisions, and controls. Trust transitions distinguish facts, signals, inferences, unverified automation, and operator decisions; automation cannot promote a result to fact without a human reason and evidence reference. The **Aether Evidence Relay** packages a payload with its capsule, graph, manifest, and SHA-256 verification metadata for local transfer.

## Security Validation

Strix is used outside the default desktop as an isolated qualification tool against Phoenix-owned components and disposable test fixtures. It is not bundled as an always-on offensive capability. Findings must be reproduced, remediated, and converted into regression tests before a release candidate is considered ready.

## Design Principles

Phoenix Awaken OS treats provenance as a first-class desktop concept. A file is not merely opened or moved; the user can state its trust context, preserve its fingerprint, connect it to a risk or control, and explain the decision that followed. The system must remain explicit about persistence, privacy boundaries, and limitations.

The operating system will be built only after this vertical slice is useful and tested. The initial target base is Fedora Atomic KDE/Kinoite, but the current bootc container image is the validated artifact; ISO conversion remains blocked by the constrained sandbox's missing EFI/vfat and device-mount capabilities. The first valid ISO will be tested in a virtual machine before any USB writing or installation on physical hardware.

## Security Boundaries

This prototype is not an antivirus, forensic certification, anonymity system, or guarantee that a host is uncompromised. It is an explainable local evidence workflow. Users must review paths, permissions, persistence choices, and exported reports before sharing them.

## Contact

Maintainer: Khalil Khalil  
Email: [khalilmkhalil0937@gmail.com](mailto:khalilmkhalil0937@gmail.com)  
WhatsApp: [wa.me/963960955844](https://wa.me/963960955844)
