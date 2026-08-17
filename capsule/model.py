"""Phoenix Awaken OS Evidence Capsule domain model.

Style reminder: this module favors explicit provenance, deterministic output,
local-only processing, and readable audit trails over hidden automation.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from typing import Any
from uuid import uuid4
import json


SCHEMA_VERSION = "0.1"
TRUST_LEVELS = {"trusted", "review", "untrusted"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    """Hash a file incrementally so large evidence never needs full memory loading."""
    digest = sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


@dataclass
class EvidenceItem:
    name: str
    path: str
    size_bytes: int
    sha256: str
    added_at: str = field(default_factory=utc_now)
    source: str = "local"
    notes: str = ""


@dataclass
class CapsuleEvent:
    event_type: str
    summary: str
    occurred_at: str = field(default_factory=utc_now)
    actor: str = "operator"


@dataclass
class EvidenceCapsule:
    title: str
    trust_level: str = "review"
    risk_id: str | None = None
    control_id: str | None = None
    capsule_id: str = field(default_factory=lambda: f"capsule-{uuid4().hex[:12]}")
    schema_version: str = SCHEMA_VERSION
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    items: list[EvidenceItem] = field(default_factory=list)
    events: list[CapsuleEvent] = field(default_factory=list)
    decisions: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("Capsule title must not be empty")
        if self.trust_level not in TRUST_LEVELS:
            raise ValueError(f"trust_level must be one of {sorted(TRUST_LEVELS)}")

    def add_file(self, path: str | Path, notes: str = "", source: str = "local") -> EvidenceItem:
        candidate = Path(path).expanduser().resolve()
        if not candidate.is_file():
            raise FileNotFoundError(f"Evidence file does not exist: {candidate}")
        item = EvidenceItem(
            name=candidate.name,
            path=str(candidate),
            size_bytes=candidate.stat().st_size,
            sha256=sha256_file(candidate),
            source=source,
            notes=notes,
        )
        self.items.append(item)
        self.updated_at = utc_now()
        self.events.append(CapsuleEvent("evidence-added", f"Added {candidate.name}"))
        return item

    def add_decision(self, decision: str) -> None:
        if not decision.strip():
            raise ValueError("Decision must not be empty")
        self.decisions.append(decision.strip())
        self.updated_at = utc_now()
        self.events.append(CapsuleEvent("decision-recorded", decision.strip()))

    def add_event(self, event_type: str, summary: str) -> None:
        if not event_type.strip() or not summary.strip():
            raise ValueError("Event type and summary must not be empty")
        self.events.append(CapsuleEvent(event_type.strip(), summary.strip()))
        self.updated_at = utc_now()

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["capsule_type"] = "phoenix-awaken-evidence-capsule"
        return payload

    def export_json(self, destination: str | Path) -> Path:
        target = Path(destination).expanduser().resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(self.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return target

    def export_markdown(self, destination: str | Path) -> Path:
        target = Path(destination).expanduser().resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            f"# {self.title}",
            "",
            f"- Capsule ID: `{self.capsule_id}`",
            f"- Trust level: **{self.trust_level}**",
            f"- Created: `{self.created_at}`",
            f"- Updated: `{self.updated_at}`",
            f"- Risk ID: `{self.risk_id or 'not-mapped'}`",
            f"- Control ID: `{self.control_id or 'not-mapped'}`",
            "",
            "## Integrity Manifest",
            "",
            "| Evidence | Size (bytes) | SHA-256 | Source |",
            "|---|---:|---|---|",
        ]
        for item in self.items:
            lines.append(f"| `{item.name}` | {item.size_bytes} | `{item.sha256}` | {item.source} |")
        lines += ["", "## Decisions", ""]
        lines.extend(f"- {decision}" for decision in self.decisions) if self.decisions else lines.append("No decisions recorded yet.")
        lines += ["", "## Timeline", "", "| Time | Event | Summary |", "|---|---|---|"]
        for event in self.events:
            lines.append(f"| {event.occurred_at} | `{event.event_type}` | {event.summary} |")
        target.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return target
