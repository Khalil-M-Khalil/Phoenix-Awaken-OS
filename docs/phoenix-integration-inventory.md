# Phoenix Awaken OS Integration Inventory

## Confirmed Phoenix OSINT component

The local checkout at `/home/ubuntu/Pheonix` points to `https://github.com/Khalil-M-Khalil/Phoenix`. Its package metadata identifies it as `phoenix-tool` version `2026.1.0`, a Python 3.10+ desktop utility for public phone-numbering-plan metadata and authorised enrichment workflows. The application uses Tkinter and exposes the `phoenix` console entry point.

The base package includes `phonenumbers`, `folium`, and `opencage`. Optional enrichment dependencies include `holehe`, `python-whois`, `requests`, and `socialscan`. Optional provider keys are configured through environment variables rather than committed secrets. The repository README states that enrichment and network checks require an authorisation acknowledgement and must be limited to data, accounts, domains, and IP addresses the operator owns or is explicitly authorised to assess.

## Integration decision

Phoenix OSINT will be integrated as a native desktop application and launcher target inside Phoenix Awaken OS, not copied into the Evidence Capsule core. Aether and OSINT will share a local integration contract: every user-requested operation can produce a provenance record containing operation type, timestamp, input fingerprint or redacted identifier, source/provider, result status, and operator decision. Evidence Capsule will store metadata and exported reports, not silently upload raw data.

The initial system integration will preserve offline-first behavior. Numbering-plan analysis, local parsing, and report generation remain usable without network access. Network-based enrichment will be opt-in, visibly labelled, bounded by explicit authorisation, and disabled by default in the OS baseline. No API key or secret will be embedded into the bootable image.

## Strix usage

Strix will be used as an isolated security qualification step against Phoenix-owned code and disposable local test fixtures. It will not be bundled as an always-on offensive tool in the default desktop. Findings must be reproduced, triaged, remediated, and converted into regression tests before any release candidate is marked ready.

## Open integration questions

The exact boundary between the existing Phoenix GUI and a future unified Phoenix launcher must be decided after reviewing the application entry points and tests. The OS packaging should initially use a wrapper or desktop entry rather than a large refactor, reducing the chance of breaking the already functional Windows edition.
