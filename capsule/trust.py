"""Phoenix Awaken OS — explicit trust-boundary transitions.

Style reminder: no automated result becomes a fact silently. Every transition
has a reason, provenance, and an actor; the local record remains reviewable.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from .graph import TRUST_STATES


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class TrustTransition:
    subject_id: str
    from_state: str
    to_state: str
    reason: str
    actor: str
    occurred_at: str = field(default_factory=utc_now)
    evidence_refs: tuple[str, ...] = ()
    limitations: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if self.from_state not in TRUST_STATES or self.to_state not in TRUST_STATES:
            raise ValueError("Trust transition uses an unsupported state")
        if not self.reason.strip() or not self.actor.strip():
            raise ValueError("Trust transition requires a reason and actor")
        if self.from_state == self.to_state:
            raise ValueError("Trust transition must change state")


class TrustBoundary:
    """Policy object for conservative, explainable trust changes."""

    ALLOWED: dict[str, set[str]] = {
        "unverified_automation": {"signal", "inference", "operator_decision"},
        "signal": {"inference", "operator_decision"},
        "inference": {"operator_decision", "fact"},
        "fact": {"operator_decision"},
        "operator_decision": set(),
    }

    def __init__(self) -> None:
        self.transitions: list[TrustTransition] = []

    def transition(
        self,
        subject_id: str,
        from_state: str,
        to_state: str,
        reason: str,
        actor: str = "operator",
        evidence_refs: tuple[str, ...] = (),
        limitations: tuple[str, ...] = (),
    ) -> TrustTransition:
        if to_state not in self.ALLOWED.get(from_state, set()):
            raise ValueError(f"Trust transition {from_state} -> {to_state} is not allowed")
        if to_state == "fact" and actor == "automation":
            raise ValueError("Automation cannot promote a result to fact")
        if to_state == "fact" and not evidence_refs:
            raise ValueError("Promotion to fact requires at least one evidence reference")
        transition = TrustTransition(subject_id, from_state, to_state, reason.strip(), actor.strip(), evidence_refs=evidence_refs, limitations=limitations)
        self.transitions.append(transition)
        return transition

    def to_dict(self) -> dict[str, Any]:
        return {"policy": "phoenix-trust-boundary-v0.1", "transitions": [asdict(item) for item in self.transitions]}

    def render_markdown(self) -> str:
        lines = [
            "# Phoenix Trust Boundary",
            "",
            "Automated results are signals or inferences until an operator records a reasoned decision.",
            "",
            "| Subject | From | To | Actor | Reason | Evidence refs |",
            "|---|---|---|---|---|---|",
        ]
        for item in self.transitions:
            refs = ", ".join(item.evidence_refs) or "none"
            lines.append(f"| `{item.subject_id}` | {item.from_state} | **{item.to_state}** | {item.actor} | {item.reason} | {refs} |")
        return "\n".join(lines) + "\n"
