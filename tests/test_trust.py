"""Trust Boundary tests."""

import pytest

from capsule.trust import TrustBoundary


def test_automation_can_create_signal_but_not_fact() -> None:
    boundary = TrustBoundary()
    transition = boundary.transition("finding-1", "unverified_automation", "signal", "Scanner emitted a match", actor="automation")
    assert transition.to_state == "signal"
    with pytest.raises(ValueError):
        boundary.transition("finding-1", "signal", "fact", "Automation confirms it", actor="automation", evidence_refs=("evidence-1",))


def test_fact_requires_evidence_and_operator() -> None:
    boundary = TrustBoundary()
    with pytest.raises(ValueError):
        boundary.transition("finding-2", "inference", "fact", "Looks correct", actor="operator")
    transition = boundary.transition("finding-2", "inference", "fact", "Validated against the hashed artifact", actor="operator", evidence_refs=("evidence-2",))
    assert transition.actor == "operator"
    assert "finding-2" in boundary.render_markdown()


def test_terminal_operator_decision_cannot_be_changed_silently() -> None:
    boundary = TrustBoundary()
    boundary.transition("finding-3", "signal", "operator_decision", "Keep for review")
    with pytest.raises(ValueError):
        boundary.transition("finding-3", "operator_decision", "fact", "Promote later", evidence_refs=("evidence-3",))
