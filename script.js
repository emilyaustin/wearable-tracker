"use strict";

const STATUS_CONFIG = {
  report_published: {
    label: "Report published",
    badgeClass: "badge-report",
    legendLabel: "Transparency report published",
  },
  process_page_only: {
    label: "Process page only",
    badgeClass: "badge-process",
    legendLabel: "Process / intake page — no aggregate stats",
  },
  no_disclosure: {
    label: "No disclosure",
    badgeClass: "badge-none",
    legendLabel: "No disclosure found",
  },
};

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Parses [label](https://...) links in note text — nothing else.
function parseNoteLinks(text) {
  const fragment = document.createDocumentFragment();
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const matches = [...text.matchAll(pattern)];
  let last = 0;
  for (const m of matches) {
    if (m.index > last) {
      fragment.appendChild(document.createTextNode(text.slice(last, m.index)));
    }
    const a = document.createElement("a");
    a.href = m[2];
    a.textContent = m[1];
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    fragment.appendChild(a);
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(last)));
  }
  return fragment;
}

function createBadge(status) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.no_disclosure;
  const span = document.createElement("span");
  span.className = `badge ${cfg.badgeClass}`;
  span.textContent = cfg.label;
  return span;
}

function createLink(url, label) {
  if (!url) return null;
  const a = document.createElement("a");
  a.href = url;
  a.textContent = label;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function createCell(...children) {
  const td = document.createElement("td");
  for (const child of children) {
    if (child == null) {
      const s = document.createElement("span");
      s.style.color = "var(--text-muted)";
      s.textContent = "—";
      td.appendChild(s);
    } else if (typeof child === "string") {
      td.appendChild(document.createTextNode(child));
    } else {
      td.appendChild(child);
    }
  }
  return td;
}

let activeCategory = "All";

function buildFilters(companies) {
  const container = document.getElementById("filters");
  if (!container) return;
  container.textContent = "";

  const categories = ["All", ...new Set(companies.map((c) => c.category))];

  for (const cat of categories) {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeCategory ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeCategory = cat;
      container.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("active", b.textContent === activeCategory);
      });
      renderTable(
        cat === "All" ? _allCompanies : _allCompanies.filter((c) => c.category === cat)
      );
    });
    container.appendChild(btn);
  }
}

let _allCompanies = [];

function renderTable(companies) {
  const tbody = document.getElementById("company-tbody");
  if (!tbody) return;
  tbody.textContent = "";

  for (const c of companies) {
    const tr = document.createElement("tr");

    // Company name
    const tdName = document.createElement("td");
    tdName.className = "company-name";
    tdName.textContent = c.name;
    tr.appendChild(tdName);

    // Category
    const tdCat = document.createElement("td");
    tdCat.className = "category";
    tdCat.textContent = c.category;
    tr.appendChild(tdCat);

    // Status badge
    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createBadge(c.status));
    tr.appendChild(tdStatus);

    // Jurisdiction
    const tdJur = document.createElement("td");
    tdJur.className = "jurisdiction";
    tdJur.textContent = c.jurisdiction ?? "—";
    if (c.jurisdiction_group === "EU") {
      const asterisk = document.createElement("sup");
      asterisk.textContent = "*";
      tdJur.appendChild(asterisk);
    }
    tr.appendChild(tdJur);

    // Last checked
    const tdChecked = document.createElement("td");
    tdChecked.className = "date-cell";
    tdChecked.textContent = c.last_checked ?? "—";
    tr.appendChild(tdChecked);

    // Notes
    const tdNotes = document.createElement("td");
    tdNotes.className = "notes-cell";
    tdNotes.appendChild(parseNoteLinks(c.notes ?? ""));
    tr.appendChild(tdNotes);

    // Link
    const tdLink = document.createElement("td");
    tdLink.className = "link-cell";
    const linkUrl = c.report_url ?? c.monitor_url ?? null;
    const linkLabel = c.report_url ? "View report" : "Privacy page";
    const link = createLink(linkUrl, linkLabel);
    if (link) {
      tdLink.appendChild(link);
    } else {
      tdLink.textContent = "—";
    }
    tr.appendChild(tdLink);

    tbody.appendChild(tr);
  }
}

function renderSummary(companies, lastUpdated) {
  const countEl = document.getElementById("report-count");
  const dateEl = document.getElementById("last-updated");
  const summaryDateEl = document.getElementById("summary-date");

  const reportCount = companies.filter((c) => c.status === "report_published").length;

  if (countEl) countEl.textContent = `${reportCount} of ${companies.length}`;
  if (dateEl) dateEl.textContent = lastUpdated ?? "unknown";
  if (summaryDateEl) summaryDateEl.textContent = lastUpdated ?? "unknown";
}

async function init() {
  try {
    const resp = await fetch("data/companies.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    _allCompanies = data.companies;
    renderSummary(data.companies, data.last_updated);
    buildFilters(data.companies);
    renderTable(data.companies);
  } catch (err) {
    const tbody = document.getElementById("company-tbody");
    if (tbody) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.style.cssText =
        "color:var(--text);background:var(--badge-none);padding:1rem;text-align:center";
      td.textContent = `Failed to load data: ${err.message}. If running locally, serve with a web server (python3 -m http.server).`;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
