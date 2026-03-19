"""
seed_crisis_resources.py — Seed crisis resources into Supabase

Usage (from backend/ directory):
    python scripts/seed_crisis_resources.py           # seed both EN and TH
    python scripts/seed_crisis_resources.py --clear   # clear table first, then seed
    python scripts/seed_crisis_resources.py --lang en # seed EN only
    python scripts/seed_crisis_resources.py --lang th # seed TH only
"""
import json
import sys
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.config import supabase

FILES = {
    'en': 'data/crisis_resources.json',
    'th': 'data/crisis_resources_th.json',
}


def clear_table():
    print("Clearing crisis_resources table...")
    try:
        # Delete all rows by filtering on a column that always has a value
        supabase.table("crisis_resources").delete().neq("language", "").execute()
        print("Table cleared.\n")
    except Exception as e:
        print(f"Error clearing table: {e}")
        sys.exit(1)


def seed_language(lang: str):
    file_path = FILES.get(lang)
    if not file_path:
        print(f"Unknown language: {lang}")
        return

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        resources = json.load(f)

    print(f"Seeding {len(resources)} resources ({lang.upper()}) from {file_path}...")

    success = 0
    failed = 0
    for resource in resources:
        data = {
            "name": resource['name'],
            "country": resource['country'],
            "phone": resource.get('phone'),
            "website": resource.get('website'),
            "description": resource['description'],
            "available_hours": resource.get('available_hours', ''),
            "company_lang": resource.get('company_lang', ''),
            "language": resource['language'],
        }
        try:
            supabase.table("crisis_resources").insert(data).execute()
            print(f"  ✓ {resource['name']}")
            success += 1
        except Exception as e:
            print(f"  ✗ {resource['name']}: {e}")
            failed += 1

    print(f"\n{lang.upper()} done: {success} inserted, {failed} failed.\n")


def main():
    parser = argparse.ArgumentParser(description='Seed crisis resources into Supabase')
    parser.add_argument('--clear', action='store_true', help='Clear table before seeding')
    parser.add_argument('--lang', choices=['en', 'th'], help='Seed only this language')
    args = parser.parse_args()

    if args.clear:
        clear_table()

    langs = [args.lang] if args.lang else ['en', 'th']
    for lang in langs:
        seed_language(lang)

    print("Seeding complete.")


if __name__ == "__main__":
    main()
