"""Phoenix Evidence Graph tests: deterministic, local, and tamper-aware."""

from pathlib import Path

import pytest

from capsule.graph import EvidenceGraph, Provenance
from capsule.model import EvidenceCapsule


def test_graph_projects_capsule_and_exports(tmp_path: Path) -> None:
    evidence = tmp_path / "report.txt"
    evidence.write_text("synthetic evidence\n", encoding="utf-8")
    capsule = EvidenceCapsule("Local review", trust_level="review")
    item = capsule.add_file(evidence, source="fixture")
    capsule.add_decision("Retain locally for review")

    graph = EvidenceGraph("Local review graph")
    case_id = graph.add_capsule(capsule)
    assert case_id in graph.nodes
    assert len(graph.nodes) == 3
    assert len(graph.edges) == 2
    assert graph.validate() == []

    output = graph.export_json(tmp_path / "graph.json")
    reopened = EvidenceGraph.load_json(output)
    assert reopened.to_dict()["graph_type"] == "phoenix-awaken-evidence-graph"
    assert reopened.nodes[f"evidence-{item.sha256}"].provenance.sha256 == item.sha256


def test_graph_rejects_unsupported_trust_and_dangling_edges() -> None:
    graph = EvidenceGraph("Validation")
    with pytest.raises(ValueError):
        graph.add_node("finding", "bad", "trusted", Provenance("fixture"))
    with pytest.raises(KeyError):
        graph.add_edge("supports", "missing", "also-missing", "not allowed")


def test_evidence_requires_hash_when_manually_declared() -> None:
    graph = EvidenceGraph("Hash validation")
    node = graph.add_node("evidence", "unhashed", "fact", Provenance("manual"))
    assert graph.validate() == [f"Evidence node lacks a content hash: {node.node_id}"]


def test_provenance_rejects_invalid_hash() -> None:
    with pytest.raises(ValueError):
        Provenance(source="fixture", sha256="not-a-sha256")
