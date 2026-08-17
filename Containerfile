# Phoenix Awaken OS image scaffold.
# Style reminder: keep the base image explicit, minimize host mutation, and make
# every security-relevant package or service auditable in version control.
#
# This file is an image scaffold. The first build is being validated in the
# sandbox with Podman; ISO conversion remains a separate, later step.

ARG FEDORA_VERSION=44
ARG SYFT_VERSION=1.51.0
ARG GRYPE_VERSION=0.117.0
ARG GITLEAKS_VERSION=8.30.1
ARG SYFT_SHA256=2a2e837a2c8d59ec9af5472ee22d3b04ee463c4e44476ecf993fd1e5ab6ebc7f
ARG GRYPE_SHA256=38525dab1e06f162ebaa02f94d82d1f807076b011a44180cf2777edf1a7b9c26
ARG GITLEAKS_SHA256=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
# Fedora bootc is the verified public base used for the first image build.
# The KDE layer is installed explicitly so the composition remains auditable.
FROM quay.io/fedora/fedora-bootc:${FEDORA_VERSION}

LABEL org.opencontainers.image.title="Phoenix Awaken OS"
LABEL org.opencontainers.image.description="Evidence-first security desktop prototype"
LABEL org.opencontainers.image.vendor="Khalil Khalil"

RUN dnf -y install \
      plasma-desktop \
      plasma-workspace \
      sddm \
      dolphin \
      konsole \
      ark \
      okular \
      kate \
      spectacle \
      filelight \
      kbackup \
      kde-connect \
      skanlite \
      gwenview \
      haruna \
      elisa \
      kdenlive \
      gimp \
      krita \
      gparted \
      kde-partitionmanager \
      pavucontrol \
      libreoffice \
      p7zip \
      p7zip-plugins \
      unzip \
      zip \
      rsync \
      smartmontools \
      NetworkManager \
      firewalld \
      python3 \
      python3-pip \
      python3-cryptography \
      python3-tkinter \
      python3-pytest \
      curl \
      yara \
      nodejs \
      npm \
      selinux-policy-targeted \
      policycoreutils \
      && dnf clean all \
      && systemctl enable sddm.service \
      && systemctl enable NetworkManager.service \
      && systemctl enable firewalld.service

# The Phoenix applications will be added as signed packages or immutable
# application layers after the Evidence Capsule API is reviewed.
COPY docs/v0.1-spec.md /usr/share/doc/phoenix-awaken-os/v0.1-spec.md
COPY docs/third-party-evaluation.md /usr/share/doc/phoenix-awaken-os/third-party-evaluation.md
COPY README.md /usr/share/doc/phoenix-awaken-os/README.md
COPY capsule /opt/phoenix-awaken/capsule
COPY aether /opt/phoenix-awaken/aether
COPY osint /opt/phoenix-awaken/osint
COPY packaging/phoenix-capsule /usr/bin/phoenix-capsule
COPY packaging/phoenix-osint /usr/bin/phoenix-osint
COPY packaging/phoenix-osint.desktop /usr/share/applications/phoenix-osint.desktop
COPY packaging/phoenix-aether /usr/bin/phoenix-aether
COPY packaging/phoenix-aether.desktop /usr/share/applications/phoenix-aether.desktop
COPY security/phoenix-security-check /usr/bin/phoenix-security-check
COPY security/phoenix-security-update-db /usr/bin/phoenix-security-update-db
COPY docs/tooling-roadmap-ar.md /usr/share/doc/phoenix-awaken-os/tooling-roadmap-ar.md
COPY docs/desktop-app-inventory-ar.md /usr/share/doc/phoenix-awaken-os/desktop-app-inventory-ar.md
COPY themes /opt/phoenix-awaken/themes

RUN chmod 0755 /usr/bin/phoenix-capsule /usr/bin/phoenix-aether /usr/bin/phoenix-osint /usr/bin/phoenix-security-check /usr/bin/phoenix-security-update-db \
      && curl -fsSL -o /tmp/syft.tgz "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_amd64.tar.gz" \
      && echo "${SYFT_SHA256}  /tmp/syft.tgz" | sha256sum -c - \
      && tar -xzf /tmp/syft.tgz -C /tmp syft \
      && install -m 0755 /tmp/syft /usr/local/bin/syft \
      && curl -fsSL -o /tmp/grype.tgz "https://github.com/anchore/grype/releases/download/v${GRYPE_VERSION}/grype_${GRYPE_VERSION}_linux_amd64.tar.gz" \
      && echo "${GRYPE_SHA256}  /tmp/grype.tgz" | sha256sum -c - \
      && tar -xzf /tmp/grype.tgz -C /tmp grype \
      && install -m 0755 /tmp/grype /usr/local/bin/grype \
      && curl -fsSL -o /tmp/gitleaks.tgz "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
      && echo "${GITLEAKS_SHA256}  /tmp/gitleaks.tgz" | sha256sum -c - \
      && tar -xzf /tmp/gitleaks.tgz -C /tmp gitleaks \
      && install -m 0755 /tmp/gitleaks /usr/local/bin/gitleaks \
      && rm -f /tmp/syft.tgz /tmp/grype.tgz /tmp/gitleaks.tgz /tmp/syft /tmp/grype /tmp/gitleaks \
      && chmod 0755 /opt/phoenix-awaken/themes/install-phoenix-themes.sh \
      && /opt/phoenix-awaken/themes/install-phoenix-themes.sh / \
      && mkdir -p /usr/share/sddm/themes/phoenix /etc/sddm.conf.d /usr/share/plymouth/themes/phoenix \
      && cp -a /opt/phoenix-awaken/themes/sddm/phoenix/. /usr/share/sddm/themes/phoenix/ \
      && cp -a /opt/phoenix-awaken/themes/sddm/10-phoenix.conf /etc/sddm.conf.d/10-phoenix.conf \
      && cp -a /opt/phoenix-awaken/themes/plymouth/phoenix/. /usr/share/plymouth/themes/phoenix/ \
      && python3 -m pip install --no-cache-dir --no-compile /opt/phoenix-awaken/osint \
      && python3 -m compileall -q /opt/phoenix-awaken/capsule /opt/phoenix-awaken/osint \
      && python3 -m pytest -q /opt/phoenix-awaken/osint/tests \
      && mkdir -p /etc/phoenix-awaken \
      && printf '%s\n' 'Phoenix OSINT network enrichment is opt-in and requires explicit operator authorization.' > /etc/phoenix-awaken/osint-policy.txt \
      && mkdir -p /tmp/phoenix-home /tmp/phoenix-npm-cache \
      && cd /opt/phoenix-awaken/aether \
      && HOME=/tmp/phoenix-home NPM_CONFIG_CACHE=/tmp/phoenix-npm-cache npm ci --omit=optional \
      && rm -rf /tmp/phoenix-home /tmp/phoenix-npm-cache \
      && dnf clean all

# Strix is intentionally not installed in the base image. It belongs in the
# opt-in, isolated security-validation profile documented in third-party-evaluation.md.
# Open SEO is intentionally not installed in the base image because it requires
# external SEO data credentials and network access.
