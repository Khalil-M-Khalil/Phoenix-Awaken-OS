"""Evidence Relay tests."""

from pathlib import Path

import pytest

from capsule.model import EvidenceCapsule
from capsule.relay import EvidenceRelay


def test_relay_build_and_inspect(tmp_path: Path) -> None:
    payload = tmp_path / "payload.iso"
    payload.write_bytes(b"synthetic payload")
    capsule = EvidenceCapsule("Transfer case")
    graph = __import__("capsule.graph", fromlist=["EvidenceGraph"]).EvidenceGraph("Transfer graph")
    graph.add_capsule(capsule)
    bundle = EvidenceRelay(capsule, graph).build([payload], tmp_path / "relay.zip")
    result = EvidenceRelay.inspect(bundle)
    assert result["status"] == "verified"
    assert result["items"][0]["size_bytes"] == payload.stat().st_size
    assert "capsule.json" in result["manifest"]["files"]


def test_relay_rejects_symlink(tmp_path: Path) -> None:
    payload = tmp_path / "payload.bin"
    payload.write_bytes(b"data")
    link = tmp_path / "link.bin"
    link.symlink_to(payload)
    with pytest.raises(ValueError):
        EvidenceRelay(EvidenceCapsule("Symlink case")).build([link], tmp_path / "relay.zip")


def test_relay_inspect_rejects_path_traversal(tmp_path: Path) -> None:
    import zipfile
    bundle = tmp_path / "unsafe.zip"
    with zipfile.ZipFile(bundle, "w") as archive:
        archive.writestr("manifest.json", '{"items": [{"archive_path": "../secret", "sha256": ""}]}')
    with pytest.raises(ValueError):
        EvidenceRelay.inspect(bundle)
