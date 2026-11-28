const ts = require("typescript");
require.extensions[".ts"] = (mod, file) =>
  mod._compile(
    ts.transpileModule(require("fs").readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
    file,
  );
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  calculate,
  tax,
  bracket,
  rothLimit,
  workplaceLimit,
  rules,
} = require("../src/domain/allocation/engine.ts");
const {
  presets,
  person,
  freshScenario,
} = require("../src/domain/scenarios/presets.ts");
const copy = (s) => structuredClone(s);
function reconcile(s) {
  const r = calculate(s);
  assert.deepEqual(r.errors, []);
  const cents = (n) => Math.round(n * 100);
  assert.equal(
    r.allocations.reduce((sum, a) => sum + cents(a.amount), 0) +
      cents(r.flexible),
    cents(s.budget),
  );
  assert.equal(
    new Set(r.allocations.map((a) => a.id)).size,
    r.allocations.length,
  );
  for (const a of r.allocations) {
    assert.ok(a.amount >= 0);
    assert.ok(a.amount <= a.capacity + 0.001);
  }
  for (const p of s.people) {
    const work = r.allocations.filter(
      (a) => a.owner === p.name && /^(match|work|catch)-/.test(a.id),
    );
    assert.ok(
      work.reduce((sum, a) => sum + a.amount, 0) +
        p.pretaxExisting +
        p.rothExisting <=
        workplaceLimit(p) + 0.01,
    );
  }
  assert.ok(
    Math.abs(
      r.allocations.reduce((sum, a) => sum + a.taxBefore - a.taxAfter, 0) -
        r.savings,
    ) < 0.02,
  );
  return r;
}
test("article bracket shaving fixture and progressive tax", () => {
  assert.equal(
    Math.round((tax(111900, "single") - tax(105700, "single")) * 100),
    148800,
  );
  assert.equal(tax(0, "single"), 0);
  assert.equal(tax(12400, "single"), 1240);
});
test("all brackets are continuous at each boundary", () => {
  for (const filing of ["single", "joint"])
    for (const t of rules[filing].thresholds) {
      assert.ok(tax(t + 0.01, filing) >= tax(t, filing));
      assert.ok(tax(t, filing) >= tax(t - 0.01, filing));
      assert.ok(bracket(t + 0.01, filing) >= bracket(t, filing));
    }
});
test("direct Roth phaseouts, minimum, and age catch-up", () => {
  assert.equal(rothLimit(32, 153000, "single"), 7500);
  assert.equal(rothLimit(32, 168000, "single"), 0);
  assert.equal(rothLimit(32, 167999, "single"), 200);
  assert.equal(rothLimit(50, 100000, "single"), 8600);
  assert.equal(rothLimit(32, 247000, "joint"), 3750);
});
test("independent age-based workplace limits", () => {
  for (const [age, limit] of [
    [49, 24500],
    [50, 32500],
    [59, 32500],
    [60, 35750],
    [63, 35750],
    [64, 32500],
  ])
    assert.equal(workplaceLimit({ ...person(), age }), limit);
});
test("all sample scenarios reconcile and have unique step IDs", () =>
  presets.forEach(reconcile));
test("zero and exhausted budgets preserve next targets", () => {
  for (const budget of [0, 1, 500, 3400, 7500, 12000, 30000, 100000]) {
    const s = { ...copy(presets[0]), budget };
    const r = reconcile(s);
    if (!budget) assert.ok(r.next);
  }
});
test("employer HSA contributions share room and do not reduce gross wages", () => {
  const s = copy(presets[0]);
  s.hsaEmployer = 2000;
  const r = reconcile(s);
  assert.equal(r.allocations.find((a) => a.id === "hsa").capacity, 2400);
  assert.equal(r.baselineIncome, 120000 - 6000 - 16100);
});
test("overfunded HSA returns blocking issue", () => {
  const s = copy(presets[0]);
  s.hsaEmployer = 5000;
  assert.ok(calculate(s).errors.length);
});
test("family HSA uses one household base limit", () => {
  const s = copy(presets[2]);
  const r = reconcile(s);
  assert.equal(
    r.allocations
      .filter((a) => a.kind === "hsa")
      .reduce((sum, a) => sum + a.capacity, 0),
    7250,
  );
});
test("no workplace plan, no compensation, and no HSA", () => {
  const s = { ...freshScenario(), ready: true, budget: 1000 };
  const r = reconcile(s);
  assert.equal(
    r.allocations
      .filter((a) => a.kind === "roth")
      .reduce((sum, a) => sum + a.amount, 0),
    0,
  );
  assert.equal(r.allocations.find((a) => a.kind === "brokerage").amount, 1000);
});
test("budget is employee dollars; match is external", () => {
  const s = copy(presets[1]);
  s.budget = 2000;
  const r = reconcile(s);
  assert.equal(r.allocations[0].amount, 2000);
  assert.equal(r.employerMatch, 2000);
});
test("education follows explicit brokerage target and overflow stays flexible", () => {
  const s = copy(presets[2]);
  s.budget = 150000;
  const r = reconcile(s);
  assert.equal(r.allocations.find((a) => a.id === "brokerage").amount, 10000);
  assert.equal(r.allocations.find((a) => a.id === "education").amount, 5000);
  assert.ok(r.flexible > 0);
  s.brokerageTarget = null;
  assert.ok(calculate(s).errors.some((e) => e.includes("brokerage")));
});
test("middle bracket funds IRA before pre-tax workplace even with Roth preference", () => {
  const s = copy(presets[0]);
  s.preference = "same";
  const r = reconcile(s);
  assert.ok(
    r.allocations.findIndex((a) => a.id.startsWith("ira-")) <
      r.allocations.findIndex((a) => a.id.startsWith("work-")),
  );
  assert.equal(
    r.allocations.find((a) => a.id.startsWith("work-")).kind,
    "pretax",
  );
});
test("high wages require Roth catch-up and no conversion is assumed tax-free", () => {
  const s = copy(presets[3]);
  s.people[0].age = 60;
  s.people[0].pretaxExisting = 0;
  s.budget = 100000;
  const r = reconcile(s);
  const catches = r.allocations.filter((a) => a.id.startsWith("catch-"));
  assert.ok(catches.length);
  assert.ok(catches.every((a) => a.kind === "roth"));
  assert.ok(r.allocations.some((a) => a.kind === "review"));
});
test("bounded randomized conservation and capacity checks", () => {
  let seed = 42;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < 400; i++) {
    const s = copy(presets[i % presets.length]);
    s.budget = Math.floor(random() * 12000000) / 100;
    s.people = s.people.map((p) => ({
      ...p,
      wages: Math.round(30000 + random() * 370000),
      pretaxExisting: Math.round(random() * 5000),
      age: 20 + Math.floor(random() * 44),
    }));
    reconcile(s);
  }
});

test("saved snapshots reject malformed structures before restore", () => {
  const { parsePlanData } = require("../src/lib/plan-data.ts");
  assert.throws(() => parsePlanData({ plans: [{}] }));
  const data = {
    ownerId: null,
    plans: [copy(presets[0])],
    activeId: presets[0].id,
    draft: null,
    checks: {},
  };
  assert.equal(parsePlanData(data).plans.length, 1);
  data.plans[0].people = [];
  assert.throws(() => parsePlanData(data));
});
test("missing eligibility and invalid values block precise results", () => {
  const s = copy(presets[0]);
  s.people[0].age = 65;
  assert.ok(calculate(s).errors.some((e) => e.includes("65")));
  s.people[0].age = 32;
  s.budget = NaN;
  assert.ok(calculate(s).errors.length);
  s.budget = -1;
  assert.ok(calculate(s).errors.length);
});

test("exports reconcile budget rows and escape HTML and spreadsheet formulas", () => {
  const Module = require("module"),
    path = require("path"),
    original = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    return original.call(
      this,
      request.startsWith("@/")
        ? path.join(__dirname, "..", "src", request.slice(2))
        : request,
      parent,
      ...rest,
    );
  };
  try {
    const { csv, checklistHtml } = require("../src/lib/export-content.ts");
    const s = copy(presets[0]);
    s.name = "=1+1<script>alert(1)</script>";
    const output = csv(s),
      html = checklistHtml(s),
      r = calculate(s);
    assert.ok(output.includes("'=1+1"));
    assert.ok(output.includes(String(r.budget)));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.ok(output.includes("2026.1-preview"));
  } finally {
    Module._resolveFilename = original;
  }
});
