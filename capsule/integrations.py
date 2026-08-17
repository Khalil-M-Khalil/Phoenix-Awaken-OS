"""Adapters from Phoenix tools into Evidence Graph."""

from __future__ import annotations

from typing import Any

from .controls import ControlMapper
from .graph import EvidenceGraph, Provenance


def add_osint_finding(
    graph: EvidenceGraph,
    title: str,
    result: dict[str, Any],
    source: str = "Phoenix OSINT",
    tool_version: str = "unknown",
    trust_state: str = "unverified_automation",
) -> str:
    """Add an OSINT result as a bounded lead, never as identity proof."""
    node = graph.add_node(
        "finding",
        title,
        trust_state,
        Provenance(
            source=source,
            tool="Phoenix OSINT",
            tool_version=tool_version,
            authorization="operator-authorized-OSINT",
            limitations=("Public-data result is a lead, not identity proof.", "Source availability and accuracy may change."),
        ),
        attributes={"result": result, "classification": "osint-lead"},
    )
    return node.node_id


def add_aether_transfer(
    graph: EvidenceGraph,
    name: str,
    sha256: str,
    size_bytes: int,
    direction: str,
    transport: str = "local",
    tool_version: str = "unknown",
) -> str:
    if direction not in {"incoming", "outgoing"}:
        raise ValueError("Aether direction must be incoming or outgoing")
    node = graph.add_node(
        "transfer",
        f"{direction.title()} transfer — {name}",
        "fact",
        Provenance(
            source="Phoenix Aether",
            tool="Phoenix Aether",
            tool_version=tool_version,
            sha256=sha256,
            authorization="operator-authorized-local-transfer",
            limitations=("Hash verifies received or sent bytes; it does not prove safety.",),
        ),
        attributes={"name": name, "size_bytes": size_bytes, "direction": direction, "transport": transport},
        node_id=f"transfer-{sha256[:16]}",
    )
    return node.node_id


def add_security_report(
    graph: EvidenceGraph,
    title: str,
    report_path: str,
    report_sha256: str | None,
    tool: str,
    tool_version: str,
    status: str = "review",
) -> str:
    if status not in {"fact", "signal", "inference", "unverified_automation"}:
        raise ValueError("Security report status must be a trust state")
    node = graph.add_node(
        "report",
        title,
        status,
        Provenance(
            source=report_path,
            tool=tool,
            tool_version=tool_version,
            sha256=report_sha256,
            authorization="operator-authorized-local-scan",
            limitations=("Scanner output requires review; absence of a finding is not proof of absence.",),
        ),
        attributes={"report_path": report_path},
    )
    return node.node_id


def map_finding_to_control(graph: EvidenceGraph, subject_node_id: str, mapping_key: str, reason: str) -> str:
    return ControlMapper().apply(graph, subject_node_id, mapping_key, reason)
