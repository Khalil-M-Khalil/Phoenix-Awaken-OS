"""
Phoenix Awaken OS — local Evidence Graph.

Style reminder: explicit provenance, deterministic serialization, local-only
processing, and conservative trust transitions are preferred over hidden
automation or implied certainty.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4


GRAPH_SCHEMA_VERSION = "0.1"
NODE_TYPES = {
    "case",
    "evidence",
    "source",
    "finding",
    "transfer",
    "decision",
    "control",
    "actor",
    "report",
}
TRUST_STATES = {
    "fact",
    "signal",
    "inference",
    "unverified_automation",
    "operator_decision",
}
EDGE_TYPES = {
    "contains",
    "derived-from",
    "observed-in",
    "transferred-by",
    "supports",
    "contradicts",
    "mapped-to",
    "decided-by",
    "created-by",
    "references",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _stable_id(prefix: str, value: str) -> str:
    digest = sha256(value.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


@dataclass(frozen=True)
class Provenance:
    source: str
    observed_at: str = field(default_factory=utc_now)
    tool: str = "manual"
    tool_version: str = "unknown"
    authorization: str = "operator-authorized-local"
    sha256: str | None = None
    limitations: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.source.strip():
            raise ValueError("Provenance source must not be empty")
        if not self.authorization.strip():
            raise ValueError("Authorization context must not be empty")
        if self.sha256 is not None:
            normalized = self.sha256.lower()
            if len(normalized) != 64 or any(char not in "0123456789abcdef" for char in normalized):
                raise ValueError("Provenance sha256 must be a 64-character hexadecimal digest")
            object.__setattr__(self, "sha256", normalized)


@dataclass(frozen=True)
class GraphNode:
    node_id: str
    node_type: str
    label: str
    trust_state: str
    provenance: Provenance
    attributes: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.node_type not in NODE_TYPES:
            raise ValueError(f"node_type must be one of {sorted(NODE_TYPES)}")
        if self.trust_state not in TRUST_STATES:
            raise ValueError(f"trust_state must be one of {sorted(TRUST_STATES)}")
        if not self.label.strip():
            raise ValueError("Graph node label must not be empty")
        if not self.node_id.strip():
            raise ValueError("Graph node_id must not be empty")


@dataclass(frozen=True)
class GraphEdge:
    edge_id: str
    edge_type: str
    from_node: str
    to_node: str
    rationale: str
    created_at: str = field(default_factory=utc_now)
    confidence: str = "review"

    def __post_init__(self) -> None:
        if self.edge_type not in EDGE_TYPES:
            raise ValueError(f"edge_type must be one of {sorted(EDGE_TYPES)}")
        if self.confidence not in {"high", "medium", "low", "review"}:
            raise ValueError("edge confidence must be high, medium, low, or review")
        if not self.rationale.strip():
            raise ValueError("Edge rationale must not be empty")
        if self.from_node == self.to_node:
            raise ValueError("Self-referential graph edges are not allowed")


class EvidenceGraph:
    """A deterministic, local graph for evidence provenance and decisions."""

    def __init__(self, title: str, graph_id: str | None = None) -> None:
        if not title.strip():
            raise ValueError("Graph title must not be empty")
        self.title = title.strip()
        self.graph_id = graph_id or f"graph-{uuid4().hex[:12]}"
        self.schema_version = GRAPH_SCHEMA_VERSION
        self.created_at = utc_now()
        self.updated_at = self.created_at
        self.nodes: dict[str, GraphNode] = {}
        self.edges: dict[str, GraphEdge] = {}

    def add_node(
        self,
        node_type: str,
        label: str,
        trust_state: str,
        provenance: Provenance,
        attributes: dict[str, Any] | None = None,
        node_id: str | None = None,
    ) -> GraphNode:
        stable_key = f"{node_type}|{label}|{provenance.source}|{provenance.observed_at}"
        identifier = node_id or _stable_id(node_type, stable_key)
        if identifier in self.nodes:
            return self.nodes[identifier]
        node = GraphNode(identifier, node_type, label.strip(), trust_state, provenance, attributes or {})
        self.nodes[identifier] = node
        self.updated_at = utc_now()
        return node

    def add_edge(
        self,
        edge_type: str,
        from_node: str,
        to_node: str,
        rationale: str,
        confidence: str = "review",
        edge_id: str | None = None,
    ) -> GraphEdge:
        if from_node not in self.nodes or to_node not in self.nodes:
            raise KeyError("Both edge endpoints must already exist in the graph")
        identifier = edge_id or _stable_id("edge", f"{edge_type}|{from_node}|{to_node}|{rationale}")
        if identifier in self.edges:
            return self.edges[identifier]
        edge = GraphEdge(identifier, edge_type, from_node, to_node, rationale.strip(), confidence=confidence)
        self.edges[identifier] = edge
        self.updated_at = utc_now()
        return edge

    def add_capsule(self, capsule: Any, source: str = "evidence-capsule") -> str:
        """Project an EvidenceCapsule into the graph without copying payload files."""
        case = self.add_node(
            "case",
            capsule.title,
            "operator_decision" if capsule.decisions else "fact",
            Provenance(source=source, observed_at=capsule.updated_at, tool="EvidenceCapsule", tool_version=capsule.schema_version),
            attributes={"capsule_id": capsule.capsule_id, "risk_id": capsule.risk_id, "control_id": capsule.control_id},
            node_id=f"case-{capsule.capsule_id}",
        )
        for item in capsule.items:
            evidence = self.add_node(
                "evidence",
                item.name,
                "fact",
                Provenance(source=item.source, observed_at=item.added_at, tool="EvidenceCapsule", tool_version=capsule.schema_version, sha256=item.sha256, limitations=("Hash verifies identity at observation time; it does not prove safety.",)),
                attributes={"path": item.path, "size_bytes": item.size_bytes, "notes": item.notes},
                node_id=f"evidence-{item.sha256}",
            )
            self.add_edge("contains", case.node_id, evidence.node_id, "Evidence item is recorded in the capsule manifest", "high")
        for index, decision in enumerate(capsule.decisions):
            decision_node = self.add_node(
                "decision",
                decision,
                "operator_decision",
                Provenance(source="operator", observed_at=capsule.updated_at, tool="EvidenceCapsule", tool_version=capsule.schema_version),
                attributes={"sequence": index},
            )
            self.add_edge("decided-by", case.node_id, decision_node.node_id, "Decision recorded by the operator in the capsule", "high")
        return case.node_id

    def validate(self) -> list[str]:
        errors: list[str] = []
        for edge in self.edges.values():
            if edge.from_node not in self.nodes or edge.to_node not in self.nodes:
                errors.append(f"Dangling edge: {edge.edge_id}")
        for node in self.nodes.values():
            if node.trust_state == "fact" and node.provenance.source == "manual" and node.provenance.sha256 is None and node.node_type == "evidence":
                errors.append(f"Evidence node lacks a content hash: {node.node_id}")
        return errors

    def to_dict(self) -> dict[str, Any]:
        return {
            "graph_type": "phoenix-awaken-evidence-graph",
            "schema_version": self.schema_version,
            "graph_id": self.graph_id,
            "title": self.title,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "nodes": [asdict(self.nodes[key]) for key in sorted(self.nodes)],
            "edges": [asdict(self.edges[key]) for key in sorted(self.edges)],
            "validation_errors": self.validate(),
        }

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
            f"- Graph ID: `{self.graph_id}`",
            f"- Schema: `{self.schema_version}`",
            f"- Nodes: {len(self.nodes)}",
            f"- Edges: {len(self.edges)}",
            "",
            "## Nodes",
            "",
            "| Type | Label | Trust | Source | SHA-256 |",
            "|---|---|---|---|---|",
        ]
        for node in sorted(self.nodes.values(), key=lambda value: value.node_id):
            digest = node.provenance.sha256 or "not-applicable"
            lines.append(f"| `{node.node_type}` | {node.label} | **{node.trust_state}** | {node.provenance.source} | `{digest}` |")
        lines += ["", "## Relationships", "", "| Type | From | To | Confidence | Rationale |", "|---|---|---|---|---|"]
        for edge in sorted(self.edges.values(), key=lambda value: value.edge_id):
            lines.append(f"| `{edge.edge_type}` | `{edge.from_node}` | `{edge.to_node}` | {edge.confidence} | {edge.rationale} |")
        errors = self.validate()
        lines += ["", "## Validation", ""]
        lines.append("Graph validation passed." if not errors else "\n".join(f"- {error}" for error in errors))
        target.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return target

    @classmethod
    def load_json(cls, source: str | Path) -> "EvidenceGraph":
        payload = json.loads(Path(source).expanduser().resolve().read_text(encoding="utf-8"))
        if payload.get("graph_type") != "phoenix-awaken-evidence-graph":
            raise ValueError("Unsupported graph type")
        graph = cls(payload["title"], graph_id=payload["graph_id"])
        graph.schema_version = payload.get("schema_version", GRAPH_SCHEMA_VERSION)
        graph.created_at = payload.get("created_at", graph.created_at)
        graph.updated_at = payload.get("updated_at", graph.updated_at)
        for raw in payload.get("nodes", []):
            raw = dict(raw)
            raw["provenance"] = Provenance(**raw["provenance"])
            graph.nodes[raw["node_id"]] = GraphNode(**raw)
        for raw in payload.get("edges", []):
            graph.edges[raw["edge_id"]] = GraphEdge(**raw)
        return graph
