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
| Phoenix Aether transfer linkage | Planned |
| KDE desktop integration | Planned |
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

## Design Principles

Phoenix Awaken OS treats provenance as a first-class desktop concept. A file is not merely opened or moved; the user can state its trust context, preserve its fingerprint, connect it to a risk or control, and explain the decision that followed. The system must remain explicit about persistence, privacy boundaries, and limitations.

The operating system will be built only after this vertical slice is useful and tested. The initial target base is Fedora Atomic KDE/Kinoite, but no ISO is claimed to exist yet. The first image will be tested in a virtual machine before any USB writing or installation on physical hardware.

## Security Boundaries

This prototype is not an antivirus, forensic certification, anonymity system, or guarantee that a host is uncompromised. It is an explainable local evidence workflow. Users must review paths, permissions, persistence choices, and exported reports before sharing them.

## Contact

Maintainer: Khalil Khalil  
Email: [khalilmkhalil0937@gmail.com](mailto:khalilmkhalil0937@gmail.com)  
WhatsApp: [wa.me/963960955844](https://wa.me/963960955844)
