# Phoenix Aether — Windows Offline Optical Transfer

Phoenix Aether is a **local-only optical transfer preview**. One Windows device emits an animated QR stream; a second device scans it through a camera, rebuilds the file, and checks its SHA-256 digest before saving.

This build is a clean-room implementation for local device testing. It does not copy the source code of Decimen Optical Transfer. The sender accepts arbitrary file names, extensions, MIME types, and binary content; it does not enforce an artificial file-size ceiling.

## Scope of version 0.1.0

| Capability | Status |
| --- | --- |
| Windows desktop application | Included |
| Offline transfer path between devices | Included |
| Animated QR transmission | Included |
| Camera-based receipt | Included |
| SHA-256 integrity verification | Included |
| Artificial file-size limit | None in the application |
| Resumable transfer / fountain coding | Not yet included |
| Encryption | Not yet included |
| Production security claims | Not appropriate for this preview |

## Run locally

```powershell
npm install
npm start
```

## Build a Windows portable executable

```powershell
npm run dist:win
```

The expected artifact is written under `dist/` as a portable `.exe`. Transfer duration and memory use increase with file size because the optical protocol repeats QR frames; this is a performance characteristic, not an application size restriction.

## Test procedure

1. Launch Phoenix Aether on the sender and receiver devices.
2. On the emitter, select any file type, including ISO, ZIP, image, archive, executable, or an extensionless binary file, and choose **Ignite stream**.
3. On the receiver, choose **Receive**, allow camera access, and place the animated QR inside the reticle.
4. Wait until the integrity state reads `SHA-256 MATCH`.
5. Save the reconstructed file and compare it to the original.

## Security boundary

The product avoids using a network path for the **transfer**, but the QR data is visible to any camera that can see the sender screen. That is not confidentiality. Do not transfer secrets with this preview. Encryption is a separate feature requiring design review and testing.

## Open-source components

This preview uses the MIT-licensed `qrcode` and `jsQR` packages. Their licenses remain in the installed dependency metadata. No source code from AGPL-licensed Decimen Optical Transfer is included in this project.

