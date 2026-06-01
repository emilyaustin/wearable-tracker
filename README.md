# Wearable Device Government Data Transparency Tracker

A static site that tracks which wearable health and fitness device companies publish transparency reports on government data requests. Checked monthly via GitHub Actions; deployed to GitHub Pages.

## What it tracks

12 companies across four categories:

- **GPS / Endurance**: Garmin, Coros, Polar, Suunto
- **Recovery / HRV**: WHOOP, Oura
- **Consumer / Mainstream**: Apple, Google / Fitbit, Samsung
- **Emerging / Niche**: Ultrahuman, Amazfit / Zepp, Withings

Status levels (viridis scale, least → most transparent):

| Status | Meaning |
|--------|---------|
| Report published | Company publishes aggregate stats on government data requests |
| Process page only | Intake form for law enforcement exists; no aggregate stats |
| No disclosure | No report and no process page found |


## Updating company data

Edit `data/companies.json` directly:

- `status`: one of `report_published`, `process_page_only`, `no_disclosure`, `chinese_jurisdiction`
- `report_url`: direct link to the published report (or `null`)
- `monitor_url`: page the cron job checks for changes
- `last_checked` / `last_changed` / `content_hash`: updated automatically by the workflow

## Adding a company

Add an entry to the `companies` array in `data/companies.json` following the existing schema. Set `content_hash` to `null` — the first workflow run will establish the baseline.

## How monitoring works

`scripts/check_urls.py` fetches each company's `monitor_url`, SHA-256 hashes the response body, and compares it to the stored `content_hash`. If the hash differs, `last_changed` is updated. On first run (hash is `null`), it stores the baseline without recording a change. The workflow commits `data/companies.json` if any field changed, then redeploys the site.

## Sources

- [This Week in Security — Oura transparency article (2026)](https://this.weekinsecurity.com/oura-says-it-gets-government-demands-for-user-data-will-it-share-how-many/)
- [npj Digital Medicine — Privacy in consumer wearables (2025)](https://www.nature.com/articles/s41746-025-01757-1)
- [Ranking Digital Rights](https://rankingdigitalrights.org/)
- [Apple Transparency Report](https://www.apple.com/legal/transparency/)
- [Google Transparency Report](https://transparencyreport.google.com/user-data/overview)
