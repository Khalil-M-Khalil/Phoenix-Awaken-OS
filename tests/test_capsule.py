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
