from pathlib import Path

import pytest

from capsule.model import EvidenceCapsule, sha256_file


def test_capsule_hashes_and_exports(tmp_path: Path) -> None:
    evidence = tmp_path / "sample.txt"
    evidence.write_text("Phoenix Awaken OS\n", encoding="utf-8")

    capsule = EvidenceCapsule("First local case", trust_level="review", control_id="A.8.15")
    item = capsule.add_file(evidence, notes="Synthetic fixture")
    capsule.add_decision("Retain locally until the reviewer confirms provenance.")

    assert item.sha256 == sha256_file(evidence)
    assert item.size_bytes == evidence.stat().st_size
    assert capsule.items[0].source == "local"

    json_path = capsule.export_json(tmp_path / "out" / "capsule.json")
    markdown_path = capsule.export_markdown(tmp_path / "out" / "capsule.md")
    assert json_path.exists()
    assert markdown_path.exists()
    assert "First local case" in markdown_path.read_text(encoding="utf-8")
    assert item.sha256 in json_path.read_text(encoding="utf-8")


def test_capsule_rejects_invalid_trust_level() -> None:
    with pytest.raises(ValueError, match="trust_level"):
        EvidenceCapsule("Invalid", trust_level="unknown")


def test_capsule_rejects_missing_evidence(tmp_path: Path) -> None:
    capsule = EvidenceCapsule("Missing file")
    with pytest.raises(FileNotFoundError):
        capsule.add_file(tmp_path / "missing.bin")


def test_capsule_rejects_empty_decision() -> None:
    capsule = EvidenceCapsule("Decision test")
    with pytest.raises(ValueError, match="Decision"):
        capsule.add_decision("  ")


def test_capsule_can_reopen_verify_and_record_transfer(tmp_path: Path) -> None:
    evidence = tmp_path / "evidence.bin"
    evidence.write_bytes(b"phoenix-aether-proof")
    capsule = EvidenceCapsule("Reopenable case")
    item = capsule.add_file(evidence, source="local")
    capsule.add_transfer(item.name, item.sha256, item.size_bytes, "outgoing")
    json_path = capsule.export_json(tmp_path / "capsule.json")

    reopened = EvidenceCapsule.load_json(json_path)
    results = reopened.verify_items()

    assert results[0]["status"] == "verified"
    assert any(event.event_type == "aether-transfer" for event in reopened.events)
    assert reopened.schema_version == "0.2"


def test_verify_marks_changed_evidence(tmp_path: Path) -> None:
    evidence = tmp_path / "evidence.txt"
    evidence.write_text("original", encoding="utf-8")
    capsule = EvidenceCapsule("Changed case")
    capsule.add_file(evidence)
    evidence.write_text("modified", encoding="utf-8")

    assert capsule.verify_items()[0]["status"] == "changed"
