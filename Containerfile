# Phoenix Awaken OS image scaffold.
# Style reminder: keep the base image explicit, minimize host mutation, and make
# every security-relevant package or service auditable in version control.
#
# This file is an image scaffold. The first build is being validated in the
# sandbox with Podman; ISO conversion remains a separate, later step.

ARG FEDORA_VERSION=44
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
      NetworkManager \
      firewalld \
      python3 \
      python3-pip \
      python3-cryptography \
      python3-tkinter \
      python3-pytest \
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

RUN chmod 0755 /usr/bin/phoenix-capsule /usr/bin/phoenix-aether /usr/bin/phoenix-osint \
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
