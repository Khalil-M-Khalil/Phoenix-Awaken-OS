# Phoenix Awaken OS image scaffold.
# Style reminder: keep the base image explicit, minimize host mutation, and make
# every security-relevant package or service auditable in version control.
#
# This file is a build scaffold only. It has not been built in the current
# sandbox because Podman/buildah/bootc-image-builder are not installed here.

ARG FEDORA_VERSION=44
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
      selinux-policy-targeted \
      policycoreutils \
      && dnf clean all \
      && systemctl enable sddm.service \
      && systemctl enable NetworkManager.service \
      && systemctl enable firewalld.service

# The Phoenix applications will be added as signed packages or immutable
# application layers after the Evidence Capsule API is reviewed.
COPY docs/v0.1-spec.md /usr/share/doc/phoenix-awaken-os/v0.1-spec.md
COPY README.md /usr/share/doc/phoenix-awaken-os/README.md

# Future integration points:
# - /usr/libexec/phoenix-capsule-service
# - Phoenix Aether local relay service
# - desktop launcher and KDE branding
