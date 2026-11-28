import type { Scenario } from "@/domain/allocation/types";
import { calculate, money, rules } from "@/domain/allocation/engine";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const csvCell = (s: string | number) =>
  `"${String(s)
    .replace(/^[=+@\t\r-]/, "'$&")
    .replace(/"/g, '""')}"`;
export function csv(s: Scenario) {
  const r = calculate(s);
  const rows: (string | number)[][] = [
    ["Investing Order", s.name],
    ["Tax year", s.year],
    ["Ruleset", rules.version],
    [
      "Scope",
      "Educational federal ordinary income model; not executed contributions",
    ],
    ["Budget", s.budget],
    ["Estimated tax reduction", r.savings],
    ["Flexible savings", r.flexible],
    [],
    [
      "Step",
      "Owner",
      "Treatment",
      "Planned amount",
      "Available capacity",
      "Employer match outside budget",
      "Rationale",
    ],
    ...r.allocations.map((a) => [
      a.title,
      a.owner,
      a.kind,
      a.amount,
      a.capacity,
      a.employer,
      a.reason,
    ]),
    [],
    ["Warnings"],
    ...r.warnings.map((w) => [w]),
    [
      "Assumptions",
      "Contribution-dollar budget. No state taxes, credits, AMT, gains stacking, NIIT or IRMAA. IRA strategies may be conditional.",
    ],
    ["Review status", rules.reviewStatus],
    ...rules.sources.map((source) => [source.title, source.url]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function checklistHtml(s: Scenario) {
  const r = calculate(s);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Investing Order — ${escape(s.name)}</title><style>body{font:14px/1.6 -apple-system,Arial,sans-serif;color:#142015;max-width:850px;margin:45px auto;padding:24px}h1{font-size:32px;letter-spacing:-1px}h2{margin-top:28px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{text-align:left;border-bottom:1px solid #d6dfd3;padding:12px 8px}.meta{color:#556650}.step{break-inside:avoid;padding:14px 0;border-bottom:1px solid #ddd}a{color:#274a22}@media print{body{margin:0;padding:20px}}</style></head><body><p class="meta">INVESTING ORDER · BY RAO’S RENDEZVOUS</p><h1>${escape(s.name)}</h1><p>Tax year ${s.year} · ${rules.version} · ${s.sample ? "Fictional sample" : "Personal plan"}</p><p>Budget: <b>${money(s.budget)}</b> · Estimated federal ordinary tax reduction: <b>${money(r.savings, 2)}</b> · Flexible: ${money(r.flexible)}</p><h2>Your contribution checklist</h2>${r.allocations
    .filter((a) => a.amount > 0)
    .map(
      (a) =>
        `<div class="step"><b>☐ ${escape(a.title)} · ${escape(a.owner)} · ${money(a.amount)}</b><br>${escape(a.reason)}<br>Available step capacity: ${money(a.capacity)}. Additional employer match: ${money(a.employer)}.</div>`,
    )
    .join(
      "",
    )}<h2>Before you act</h2><p>Confirm payroll timing, contribution totals and account eligibility. This checklist does not execute transactions.</p><ul>${r.warnings.map((w) => `<li>${escape(w)}</li>`).join("")}</ul><p>Federal ordinary income model only. Excludes state taxes, credits, AMT, preferential income, NIIT and IRMAA. Contribution-dollar budget; tax savings are not reinvested. Lower-bracket IRA sequencing and brokerage target ordering are methodology interpretations. Conditional IRA allocations require a basis, year-end balance and Form 8606 review.</p><p>${escape(rules.reviewStatus)}</p><h2>Sources</h2>${rules.sources.map((source) => `<p><a href="${source.url}">${escape(source.title)}</a></p>`).join("")}</body></html>`;
}
