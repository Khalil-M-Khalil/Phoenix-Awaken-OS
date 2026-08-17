"""Phoenix Awaken OS — local Aether Evidence Relay bundle.

Style reminder: bundles are deterministic in structure, local-only, explicit
about hashes, and defensive against path traversal and symlink confusion.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json
from pathlib import Path
import zipfile
from typing import Iterable

from .graph import EvidenceGraph
from .model import EvidenceCapsule, sha256_file, utc_now


RELAY_SCHEMA_VERSION = "0.1"


def _safe_name(name: str) -> str:
    candidate = Path(name).name
    if not candidate or candidate in {".", ".."}:
        raise ValueError("Payload name is not safe")
    return candidate


@dataclass(frozen=True)
class RelayItem:
    archive_path: str
    source_name: str
    size_bytes: int
    sha256: str


class EvidenceRelay:
    """Create and inspect a local evidence transfer bundle."""

    def __init__(self, capsule: EvidenceCapsule, graph: EvidenceGraph | None = None) -> None:
        self.capsule = capsule
        self.graph = graph

    def build(self, payloads: Iterable[str | Path], destination: str | Path) -> Path:
        entries: list[RelayItem] = []
        source_paths: list[tuple[Path, str]] = []
        seen_hashes: set[str] = set()
        for raw_path in payloads:
            unresolved = Path(raw_path).expanduser()
            if unresolved.is_symlink():
                raise ValueError(f"Relay payload must be a regular file, not a symlink: {unresolved}")
            source = unresolved.resolve()
            if not source.is_file():
                raise ValueError(f"Relay payload must be a regular file: {source}")
            digest = sha256_file(source)
            if digest in seen_hashes:
                raise ValueError(f"Duplicate payload hash in relay: {source.name}")
            seen_hashes.add(digest)
            archive_path = f"payloads/{digest[:16]}-{_safe_name(source.name)}"
            entries.append(RelayItem(archive_path, source.name, source.stat().st_size, digest))
            source_paths.append((source, archive_path))

        graph_payload = self.graph.to_dict() if self.graph else None
        capsule_payload = self.capsule.to_dict()
        manifest = {
            "relay_type": "phoenix-aether-evidence-relay",
            "schema_version": RELAY_SCHEMA_VERSION,
            "created_at": utc_now(),
            "capsule_id": self.capsule.capsule_id,
            "items": [asdict(item) for item in entries],
            "files": ["capsule.json", "manifest.json"] + (["evidence-graph.json"] if graph_payload else []),
            "limitations": [
                "Hashes verify bytes at packaging and extraction time; they do not prove safety.",
                "The relay is local-only and does not provide transport encryption by itself.",
            ],
        }
        target = Path(destination).expanduser().resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("capsule.json", json.dumps(capsule_payload, indent=2, ensure_ascii=False) + "\n")
            if graph_payload:
                archive.writestr("evidence-graph.json", json.dumps(graph_payload, indent=2, ensure_ascii=False) + "\n")
            archive.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
            for source, archive_path in source_paths:
                archive.write(source, archive_path)
        return target

    @staticmethod
    def inspect(bundle: str | Path) -> dict[str, object]:
        source = Path(bundle).expanduser().resolve()
        if not source.is_file():
            raise FileNotFoundError(source)
        with zipfile.ZipFile(source) as archive:
            names = archive.namelist()
            for name in names:
                normalized = Path(name)
                if normalized.is_absolute() or ".." in normalized.parts:
                    raise ValueError(f"Unsafe archive member: {name}")
            manifest = json.loads(archive.read("manifest.json"))
            results = []
            for item in manifest.get("items", []):
                archive_member = Path(item["archive_path"])
                if archive_member.is_absolute() or ".." in archive_member.parts or str(archive_member) not in names:
                    raise ValueError(f"Unsafe or missing manifest member: {item['archive_path']}")
                data = archive.read(str(archive_member))
                actual = sha256(data).hexdigest()
                results.append({
                    "archive_path": item["archive_path"],
                    "status": "verified" if actual == item["sha256"] else "changed",
                    "expected_sha256": item["sha256"],
                    "actual_sha256": actual,
                    "size_bytes": len(data),
                })
            return {"manifest": manifest, "items": results, "status": "verified" if all(item["status"] == "verified" for item in results) else "changed"}
