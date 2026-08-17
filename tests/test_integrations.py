"""Integration adapters and Control Mapper tests."""

import pytest

from capsule.controls import ControlMapper
from capsule.graph import EvidenceGraph
from capsule.integrations import add_aether_transfer, add_osint_finding, add_security_report


SHA = "a" * 64


def test_osint_is_bounded_as_unverified_lead() -> None:
    graph = EvidenceGraph("OSINT integration")
    node_id = add_osint_finding(graph, "Phone metadata result", {"possible": True, "region": "unknown"})
    node = graph.nodes[node_id]
    assert node.trust_state == "unverified_automation"
    assert "not identity proof" in node.provenance.limitations[0]


def test_aether_transfer_is_hashed_and_mappable() -> None:
    graph = EvidenceGraph("Aether integration")
    node_id = add_aether_transfer(graph, "sample.iso", SHA, 123, "incoming")
    mapper = ControlMapper()
    control_id = mapper.apply(graph, node_id, "data-transfer", "Transfer integrity metadata recorded for review")
    assert graph.nodes[node_id].provenance.sha256 == SHA
    assert control_id in graph.nodes
    assert len(graph.edges) == 1


def test_security_report_requires_supported_state() -> None:
    graph = EvidenceGraph("Security integration")
    with pytest.raises(ValueError):
        add_security_report(graph, "scan", "report.json", SHA, "gitleaks", "8.30.1", status="trusted")
    node_id = add_security_report(graph, "scan", "report.json", SHA, "gitleaks", "8.30.1", status="unverified_automation")
    assert graph.nodes[node_id].trust_state == "unverified_automation"


def test_unknown_control_mapping_is_rejected() -> None:
    graph = EvidenceGraph("Control mapping")
    node_id = add_osint_finding(graph, "lead", {"value": "redacted"})
    with pytest.raises(KeyError):
        ControlMapper().apply(graph, node_id, "not-a-control", "invalid")
