"""Phoenix Awaken OS — versioned, non-claiming GRC control mappings."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from .graph import EvidenceGraph, Provenance


MAPPING_VERSION = "0.1"


@dataclass(frozen=True)
class ControlReference:
    framework: str
    framework_version: str
    control_id: str
    short_label: str
    rationale: str
    mapping_version: str = MAPPING_VERSION
    limitations: tuple[str, ...] = ("Reference mapping is not an automated compliance determination.",)


DEFAULT_CONTROLS: dict[str, ControlReference] = {
    "provenance": ControlReference("NIST CSF", "2.0", "DE.CM", "Continuous monitoring", "Use when a local scan or observation records a monitored security signal."),
    "evidence-integrity": ControlReference("ISO/IEC 27001", "2022 Annex A", "A.8.15", "Logging", "Use when an integrity event, audit record, or evidence timeline is retained."),
    "data-transfer": ControlReference("ISO/IEC 27001", "2022 Annex A", "A.8.24", "Use of cryptography", "Use when a transfer record documents a protected or integrity-checked exchange; verify the actual cryptographic boundary separately."),
    "incident-review": ControlReference("CIS Controls", "v8", "17", "Incident Response Management", "Use when a finding is routed into a documented incident or review workflow."),
}


class ControlMapper:
    def __init__(self, references: dict[str, ControlReference] | None = None) -> None:
        self.references = references or DEFAULT_CONTROLS.copy()
        self.applied: list[dict[str, Any]] = []

    def apply(self, graph: EvidenceGraph, subject_node_id: str, key: str, reason: str) -> str:
        if subject_node_id not in graph.nodes:
            raise KeyError(f"Unknown graph subject: {subject_node_id}")
        if key not in self.references:
            raise KeyError(f"Unknown control mapping key: {key}")
        reference = self.references[key]
        control_node = graph.add_node(
            "control",
            f"{reference.framework} {reference.control_id} — {reference.short_label}",
            "inference",
            Provenance(source="Phoenix Control Mapper", tool="phoenix-control-mapper", tool_version=MAPPING_VERSION, limitations=reference.limitations),
            attributes=asdict(reference),
            node_id=f"control-{reference.framework.replace('/', '-').replace(' ', '-').lower()}-{reference.control_id.replace('.', '-')}",
        )
        graph.add_edge("mapped-to", subject_node_id, control_node.node_id, reason, "review")
        self.applied.append({"subject_node_id": subject_node_id, "mapping_key": key, "control_node_id": control_node.node_id, "reason": reason})
        return control_node.node_id

    def to_dict(self) -> dict[str, Any]:
        return {"mapper": "phoenix-control-mapper", "mapping_version": MAPPING_VERSION, "references": [asdict(value) for value in self.references.values()], "applied": self.applied}
