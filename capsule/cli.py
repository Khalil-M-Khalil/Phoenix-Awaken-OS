"""Local-only CLI for the first Phoenix Awaken OS prototype."""

from __future__ import annotations

import argparse
from pathlib import Path

from .model import EvidenceCapsule


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a Phoenix Awaken evidence capsule locally")
    parser.add_argument("title")
    parser.add_argument("evidence", nargs="+", type=Path)
    parser.add_argument("--trust", choices=("trusted", "review", "untrusted"), default="review")
    parser.add_argument("--risk-id")
    parser.add_argument("--control-id")
    parser.add_argument("--decision", action="append", default=[])
    parser.add_argument("--out", type=Path, default=Path("capsule-output"))
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    capsule = EvidenceCapsule(
        title=args.title,
        trust_level=args.trust,
        risk_id=args.risk_id,
        control_id=args.control_id,
    )
    for evidence_path in args.evidence:
        capsule.add_file(evidence_path)
    for decision in args.decision:
        capsule.add_decision(decision)
    json_path = capsule.export_json(args.out / "capsule.json")
    markdown_path = capsule.export_markdown(args.out / "capsule.md")
    print(f"Created {capsule.capsule_id}")
    print(f"JSON: {json_path}")
    print(f"Markdown: {markdown_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
