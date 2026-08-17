# Phoenix Aether — Security Design Notes

## Evidence base

Microsoft Authenticode identifies the publisher and verifies that signed software has not changed since signing. It relies on cryptographic signatures and a trusted certificate chain.

Microsoft SmartScreen evaluates both publisher reputation and the specific file-hash reputation. A new signed binary may still show a warning until reputation accumulates; self-signed certificates do not provide the same trust signal as a publicly trusted certificate. SmartScreen guidance also recommends not modifying a signed file after signing and maintaining a consistent signing identity.

## Design decision

Phoenix Aether will use a tamper-evident integrity manifest and release hash, and the Windows release should be Authenticode-signed when the creator obtains a code-signing certificate. The application may stop normal operation and show an ownership/contact warning when its packaged resources fail an integrity check, but it must not delete itself, delete user files, block IP addresses, or perform network surveillance.

## Sources

1. https://learn.microsoft.com/en-us/windows-hardware/drivers/install/authenticode — Microsoft, Authenticode digital signatures.
2. https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation — Microsoft, SmartScreen reputation for Windows app developers.
3. https://owasp.org/Top10/2025/A08_2025-Software-or-Data-Integrity-Failures/ — OWASP, A08:2025 Software or Data Integrity Failures.
