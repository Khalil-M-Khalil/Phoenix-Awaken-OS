"""Unified local integration CLI for Phoenix tool outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .controls import ControlMapper
from .graph import EvidenceGraph
from .integrations import add_aether_transfer, add_osint_finding, add_security_report


def read_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.expanduser().resolve().read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Input must contain a JSON object: {path}")
    return payload


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build a local Phoenix integration graph")
    parser.add_argument("--title", required=True)
    parser.add_argument("--osint-json", type=Path, action="append", default=[])
    parser.add_argument("--aether-json", type=Path, action="append", default=[])
    parser.add_argument("--security-report", type=Path, action="append", default=[])
    parser.add_argument("--control", action="append", default=[], help="mapping key=subject_id:rationale")
    parser.add_argument("--out", type=Path, required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    graph = EvidenceGraph(args.title)
    for path in args.osint_json:
        payload = read_json(path)
        add_osint_finding(graph, payload.get("title", path.stem), payload, source=str(path), tool_version=str(payload.get("tool_version", "unknown")))
    for path in args.aether_json:
        payload = read_json(path)
        add_aether_transfer(graph, str(payload["name"]), str(payload["sha256"]), int(payload["size_bytes"]), str(payload["direction"]), str(payload.get("transport", "local")), str(payload.get("tool_version", "unknown")))
    for path in args.security_report:
        payload = read_json(path)
        add_security_report(graph, payload.get("title", path.stem), str(path), payload.get("sha256"), str(payload.get("tool", "unknown")), str(payload.get("tool_version", "unknown")), str(payload.get("status", "unverified_automation")))
    mapper = ControlMapper()
    for spec in args.control:
        try:
            key, subject_and_reason = spec.split("=", 1)
            subject_id, rationale = subject_and_reason.split(":", 1)
        except ValueError as error:
            raise ValueError("Control format must be mapping-key=subject-id:rationale") from error
        mapper.apply(graph, subject_id, key, rationale)
    args.out.mkdir(parents=True, exist_ok=True)
    graph.export_json(args.out / "integration-graph.json")
    graph.export_markdown(args.out / "integration-graph.md")
    (args.out / "control-mappings.json").write_text(json.dumps(mapper.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created integration graph with {len(graph.nodes)} node(s), {len(graph.edges)} edge(s)")
    return 0 if not graph.validate() else 2


if __name__ == "__main__":
    raise SystemExit(main())
