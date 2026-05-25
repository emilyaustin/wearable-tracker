#!/usr/bin/env python3
"""
Monitor transparency report URLs for changes.
Reads data/companies.json, fetches each monitor_url, hashes the response,
and updates last_checked / last_changed / content_hash in place.
"""

import hashlib
import json
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import requests

DATA_FILE = Path(__file__).parent.parent / "data" / "companies.json"
REQUEST_TIMEOUT = 15
HEADERS = {
    "User-Agent": (
        "WearableTransparencyTracker/1.0 "
        "(https://github.com/; monitoring for public transparency report updates)"
    )
}


def hash_content(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme == "https" and bool(parsed.netloc)
    except Exception:
        return False


def fetch_page(url: str) -> str | None:
    if not is_valid_url(url):
        print(f"  WARNING: skipping invalid or non-HTTPS URL: {url}", file=sys.stderr)
        return None
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=False)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as exc:
        print(f"  WARNING: failed to fetch {url}: {exc}", file=sys.stderr)
        return None


def check_company(company: dict, today: str) -> bool:
    """Return True if the page content changed since last check."""
    url = company.get("monitor_url")
    if not url:
        return False

    print(f"Checking {company['name']} ({url})")
    content = fetch_page(url)
    if content is None:
        return False

    new_hash = hash_content(content)
    old_hash = company.get("content_hash")

    company["last_checked"] = today

    if old_hash is None:
        # First run — establish baseline, no change recorded
        company["content_hash"] = new_hash
        print(f"  Baseline set for {company['name']}")
        return False

    if new_hash != old_hash:
        company["content_hash"] = new_hash
        company["last_changed"] = today
        print(f"  CHANGED: {company['name']}")
        return True

    print(f"  No change: {company['name']}")
    return False


def main() -> None:
    data = json.loads(DATA_FILE.read_text())
    today = str(date.today())
    changed_companies = []

    for company in data["companies"]:
        if check_company(company, today):
            changed_companies.append(company["name"])

    data["last_updated"] = today
    DATA_FILE.write_text(json.dumps(data, indent=2) + "\n")

    if changed_companies:
        print(f"\nChanged: {', '.join(changed_companies)}")
        sys.exit(0)
    else:
        print("\nNo changes detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()
