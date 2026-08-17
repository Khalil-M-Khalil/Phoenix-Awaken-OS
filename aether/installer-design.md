# Phoenix Aether Installer Design

## Chosen route

Use electron-builder's NSIS target with `oneClick: false`, per-machine installation, directory selection, desktop/start-menu shortcuts, and the existing Phoenix Aether ICO. NSIS is the recommended Windows target in electron-builder and supports customization through NSIS include/script hooks and Modern UI pages.

## Visual direction

The installer theme is “Aether of the Phoenix”: a near-black volcanic background, ember orange and red accents for rebirth, restrained mint/teal for the aether/light-transfer concept, and the transparent phoenix mark as the focal point. The design should feel like a secure technical instrument rather than a generic wizard.

## Safety and trust

The installer will not execute self-delete, IP blocking, surveillance, or destructive actions. It will install and uninstall through standard Windows mechanisms, preserve user files, and point users to the creator contact page for authorized development or modification.

## Sources

1. https://www.electron.build/docs/nsis/ — electron-builder NSIS configuration and customization.
2. https://nsis.sourceforge.io/Docs/Modern%20UI%202/Readme.html — NSIS Modern UI documentation.
3. https://www.electron.build/docs/api/app-builder-lib.interface.nsisoptions/ — electron-builder NSIS options.
