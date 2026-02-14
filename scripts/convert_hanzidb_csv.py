#!/usr/bin/env python3
"""Convert a source Hanzi CSV into hanzidb JSON with variant mappings.

Usage:
  python3 scripts/convert_hanzidb_csv.py \
    --input /path/to/source.csv \
    --output-json data/hanzidb.json \
    --output-csv data/hanzidb_enhanced.csv
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

FIELDNAMES = [
    "frequency_rank",
    "character",
    "pinyin",
    "pinyin_alternates",
    "common_word_1",
    "common_word_1_pinyin",
    "common_word_1_definition",
    "common_word_2",
    "common_word_2_pinyin",
    "common_word_2_definition",
    "definition",
    "radical",
    "radical_code",
    "stroke_count",
    "hsk_level",
    "general_standard_num",
    "traditional_character",
    "same_simp_trad",
    "alternate_characters",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Source CSV path")
    parser.add_argument("--output-json", required=True, help="Output JSON path")
    parser.add_argument("--output-csv", help="Output normalized CSV path (defaults to --input)")
    return parser.parse_args()


def to_int(value: str | None) -> int | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        return int(float(raw))
    except Exception:
        return None


def to_num(value: str | None) -> int | float | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        num = float(raw)
        return int(num) if num.is_integer() else num
    except Exception:
        return None


def main() -> None:
    args = parse_args()

    src_csv = Path(args.input)
    out_json = Path(args.output_json)
    out_csv = Path(args.output_csv) if args.output_csv else src_csv

    rows_json: list[dict[str, object]] = []
    enhanced_rows: list[dict[str, str]] = []

    with src_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            character = (row.get("character") or "").strip()
            if not character:
                continue

            traditional = (row.get("traditional_character") or "").strip()
            if traditional == character:
                traditional = ""

            alt_set: set[str] = set()
            row_alternates = (row.get("alternate_characters") or "").strip()
            for variant in row_alternates.split("|"):
                v = (variant or "").strip()
                if v and v != character:
                    alt_set.add(v)
            if traditional:
                alt_set.add(traditional)

            alternate = "|".join(sorted(alt_set, key=lambda x: (len(x), x)))
            frequency_rank = (row.get("frequency_rank") or row.get("frequency") or "").strip()
            pinyin_alternates = (row.get("pinyin_alternates") or "").strip()
            common_word_1 = (row.get("common_word_1") or "").strip()
            common_word_1_pinyin = (row.get("common_word_1_pinyin") or "").strip()
            common_word_1_definition = (row.get("common_word_1_definition") or "").strip()
            common_word_2 = (row.get("common_word_2") or "").strip()
            common_word_2_pinyin = (row.get("common_word_2_pinyin") or "").strip()
            common_word_2_definition = (row.get("common_word_2_definition") or "").strip()

            enhanced = {
                "frequency_rank": frequency_rank,
                "character": character,
                "pinyin": (row.get("pinyin") or "").strip(),
                "pinyin_alternates": pinyin_alternates,
                "common_word_1": common_word_1,
                "common_word_1_pinyin": common_word_1_pinyin,
                "common_word_1_definition": common_word_1_definition,
                "common_word_2": common_word_2,
                "common_word_2_pinyin": common_word_2_pinyin,
                "common_word_2_definition": common_word_2_definition,
                "definition": (row.get("definition") or "").strip(),
                "radical": (row.get("radical") or "").strip(),
                "radical_code": (row.get("radical_code") or "").strip(),
                "stroke_count": (row.get("stroke_count") or "").strip(),
                "hsk_level": (row.get("hsk_level") or "").strip(),
                "general_standard_num": (row.get("general_standard_num") or "").strip(),
                "traditional_character": traditional,
                "same_simp_trad": (row.get("same_simp_trad") or "").strip(),
                "alternate_characters": alternate,
            }
            enhanced_rows.append(enhanced)

            json_row: dict[str, object] = {
                "character": character,
                "traditional_character": traditional,
                "alternate_characters": alternate,
                "pinyin": (row.get("pinyin") or "").strip(),
                "pinyin_alternates": pinyin_alternates,
                "common_word_1": common_word_1,
                "common_word_1_pinyin": common_word_1_pinyin,
                "common_word_1_definition": common_word_1_definition,
                "common_word_2": common_word_2,
                "common_word_2_pinyin": common_word_2_pinyin,
                "common_word_2_definition": common_word_2_definition,
                "definition": (row.get("definition") or "").strip(),
                "hsk_level": to_int(row.get("hsk_level")),
                "frequency": to_int(frequency_rank),
                "radical": (row.get("radical") or "").strip(),
                "radical_code": to_num(row.get("radical_code")),
                "stroke_count": to_int(row.get("stroke_count")),
                "general_standard_num": to_int(row.get("general_standard_num")),
            }
            json_row = {k: v for k, v in json_row.items() if v not in (None, "")}
            rows_json.append(json_row)

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(enhanced_rows)

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(rows_json, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {len(rows_json)} rows to {out_json}")
    print(f"Wrote {len(enhanced_rows)} rows to {out_csv}")


if __name__ == "__main__":
    main()
