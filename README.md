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
| CN jurisdiction | Chinese jurisdiction — government disclosure is a legal obligation, not a choice |

## Running locally

```bash
# Serve from the project root (required — fetch() won't work from file://)
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploying to GitHub Pages

1. Push this repo to GitHub (must be **public** for free-tier HTTPS).
2. Go to **Settings → Pages** and set source to **GitHub Actions**.
3. Go to **Settings → Actions → General** and set workflow permissions to **Read and write**.
4. Trigger the workflow manually (**Actions → Monitor Transparency Reports → Run workflow**) to establish URL baselines.
5. After the first run, the site is live at `https://<username>.github.io/<repo>/`.

### Optional: custom subdomain

1. Edit `.github/workflows/monitor.yml` and uncomment the `cname:` line, replacing the placeholder with your subdomain (e.g., `wearable.yourdomain.com`).
2. Add a `CNAME` file to the repo root containing only your subdomain.
3. In your DNS provider, add a CNAME record: `wearable` → `<username>.github.io`.
4. In GitHub **Settings → Pages → Custom domain**, enter your subdomain and save.
5. Check **Enforce HTTPS** once DNS propagates (10 min – 48 h). GitHub provisions a Let's Encrypt cert automatically.

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
