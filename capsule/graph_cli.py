"""CLI for Phoenix Evidence Graph export."""

from __future__ import annotations

import argparse
from pathlib import Path

from .graph import EvidenceGraph
from .model import EvidenceCapsule


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build a local Phoenix Evidence Graph from a capsule JSON")
    parser.add_argument("capsule", type=Path, help="Path to capsule.json")
    parser.add_argument("--out", type=Path, required=True, help="Output directory")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    capsule = EvidenceCapsule.load_json(args.capsule)
    graph = EvidenceGraph(f"Evidence Graph — {capsule.title}")
    graph.add_capsule(capsule)
    args.out.mkdir(parents=True, exist_ok=True)
    graph.export_json(args.out / "evidence-graph.json")
    graph.export_markdown(args.out / "evidence-graph.md")
    errors = graph.validate()
    if errors:
        for error in errors:
            print(f"validation-error: {error}")
        return 2
    print(f"Created Evidence Graph with {len(graph.nodes)} node(s) and {len(graph.edges)} edge(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
