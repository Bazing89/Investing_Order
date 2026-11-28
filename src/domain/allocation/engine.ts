import rules from "../tax/rules/2026.json";
import type { Allocation, Person, Result, Scenario } from "./types";
export { rules };
export const cents = (n: number) => Math.round(n * 100);
export const money = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(n);
export function tax(income: number, filing: Scenario["filing"]) {
  const bounds = [0, ...rules[filing].thresholds, Infinity];
  return (
    Math.round(
      rules.rates.reduce(
        (sum, rate, i) =>
          sum + Math.max(0, Math.min(income, bounds[i + 1]) - bounds[i]) * rate,
        0,
      ) * 100,
    ) / 100
  );
}
export function bracket(income: number, filing: Scenario["filing"]) {
  const index = rules[filing].thresholds.findIndex((t) => income <= t);
  return rules.rates[index < 0 ? 6 : index];
}
export function workplaceLimit(p: Person) {
  return Math.min(
    p.wages,
    rules.workplace +
      (p.age >= 50 && p.catchUp
        ? p.age >= 60 && p.age <= 63
          ? rules.superCatchUp
          : rules.catchUp
        : 0),
  );
}
export function rothLimit(
  age: number,
  magi: number,
  filing: Scenario["filing"],
) {
  const cap = rules.ira + (age >= 50 ? rules.iraCatchUp : 0);
  const [low, high] = rules[filing].rothPhaseout;
  if (magi >= high) return 0;
  if (magi <= low) return cap;
  // IRS worksheet: round the reduced limit up to $10; minimum positive limit $200.
  const ratio = (magi - low) / (high - low);
  return Math.min(
    cap,
    Math.max(200, Math.ceil((cap * (1 - ratio)) / 10 - 1e-10) * 10),
  );
}
export function validate(s: Scenario): string[] {
  const errors: string[] = [];
  if (!s.name.trim()) errors.push("Give your plan a name.");
  if (!s.ready)
    errors.push("Confirm your budget is available after your near-term needs.");
  if (s.people.length !== (s.filing === "single" ? 1 : 2))
    errors.push("Complete the household details.");
  const values = [
    s.budget,
    s.otherIncome,
    s.hsaExisting,
    s.hsaEmployer,
    s.educationTarget,
    ...s.people.flatMap((p) => [
      p.wages,
      p.priorWages,
      p.pretaxExisting,
      p.rothExisting,
      p.iraExisting,
    ]),
  ];
  if (values.some((n) => !Number.isFinite(n) || n < 0 || n > 1e9))
    errors.push("Enter valid nonnegative amounts below $1 billion.");
  if (
    s.deduction !== null &&
    (!Number.isFinite(s.deduction) || s.deduction < 0)
  )
    errors.push("Check your deduction estimate.");
  if (
    s.education &&
    (s.brokerageTarget === null ||
      !Number.isFinite(s.brokerageTarget) ||
      s.brokerageTarget < 0)
  )
    errors.push(
      "Choose an annual brokerage target before funding education. Zero is allowed.",
    );
  if (s.hsa !== "none" && s.hsa !== "review" && s.hsaEligible) {
    const owner = s.people.find((p) => p.id === s.hsaOwner) ?? s.people[0];
    const limit =
      (s.hsa === "family" ? rules.hsaFamily : rules.hsaSingle) +
      (owner.age >= 55 ? rules.hsaCatchUp : 0);
    if (s.hsaExisting + s.hsaEmployer > limit)
      errors.push(
        "Existing and employer HSA contributions exceed the modeled limit.",
      );
  }
  if (
    s.people.reduce((sum, p) => sum + p.iraExisting, 0) >
    s.people.reduce((sum, p) => sum + p.wages, 0)
  )
    errors.push(
      "Existing IRA contributions exceed modeled household compensation.",
    );
  for (const p of s.people) {
    if (!Number.isInteger(p.age) || p.age < 18 || p.age > 100)
      errors.push(`${p.name}: enter a year-end age from 18 to 100.`);
    if (p.age >= 65 && s.deduction === null)
      errors.push(
        "Age 65+ requires a reviewed deduction estimate including applicable age-related deductions.",
      );
    if (
      p.matchPercent < 0 ||
      p.matchPercent > 100 ||
      p.matchRate < 0 ||
      p.matchRate > 200
    )
      errors.push(`${p.name}: check the simple match percentages.`);
    if (p.pretaxExisting + p.rothExisting > workplaceLimit(p))
      errors.push(
        `${p.name}: existing workplace contributions exceed modeled capacity.`,
      );
    if (!p.workplace && p.pretaxExisting + p.rothExisting > 0)
      errors.push(
        `${p.name}: confirm workplace access for existing contributions.`,
      );
    if (p.iraExisting > rules.ira + (p.age >= 50 ? rules.iraCatchUp : 0))
      errors.push(
        `${p.name}: existing IRA contributions exceed the annual limit.`,
      );
  }
  return errors;
}
export function calculate(s: Scenario): Result {
  const errors = validate(s),
    warnings: string[] = [];
  const income = s.people.reduce((sum, p) => sum + p.wages, 0) + s.otherIncome;
  const existingDeduction =
    s.people.reduce((sum, p) => sum + p.pretaxExisting, 0) + s.hsaExisting;
  const baselineAgi = Math.max(0, income - existingDeduction);
  const baselineIncome = Math.max(
    0,
    baselineAgi - (s.deduction ?? rules[s.filing].deduction),
  );
  const baselineTax = tax(baselineIncome, s.filing);
  const empty: Result = {
    allocations: [],
    budget: s.budget,
    flexible: s.budget,
    baselineIncome,
    proposedIncome: baselineIncome,
    baselineTax,
    proposedTax: baselineTax,
    savings: 0,
    bracketBefore: bracket(baselineIncome, s.filing),
    bracketAfter: bracket(baselineIncome, s.filing),
    rothHsa: 0,
    employerMatch: 0,
    warnings,
    errors,
    magi: baselineAgi,
    next: undefined,
  };
  if (errors.length) return empty;
  let remaining = cents(s.budget),
    deduction = 0,
    employerMatch = 0;
  const allocations: Allocation[] = [];
  const capacity = s.people.map((p) =>
    cents(
      p.workplace
        ? Math.max(0, workplaceLimit(p) - p.pretaxExisting - p.rothExisting)
        : 0,
    ),
  );
  const fundedWorkplace = s.people.map(() => 0);
  function add(
    id: string,
    title: string,
    owner: string,
    kind: Allocation["kind"],
    room: number,
    reason: string,
    existing = 0,
    employerRate = 0,
  ) {
    const amount = Math.min(remaining, Math.max(0, Math.round(room)));
    const before = Math.max(0, baselineIncome - deduction / 100);
    if (kind === "pretax" || kind === "hsa") deduction += amount;
    remaining -= amount;
    const employer = Math.round(amount * employerRate);
    employerMatch += employer;
    if (allocations.some((a) => a.id === id))
      id = `${id}-${allocations.length}`;
    allocations.push({
      id,
      title,
      owner,
      kind,
      amount: amount / 100,
      capacity: room / 100,
      existing,
      employer: employer / 100,
      reason,
      taxBefore: tax(before, s.filing),
      taxAfter: tax(Math.max(0, baselineIncome - deduction / 100), s.filing),
    });
    return amount;
  }
  function workplace(
    i: number,
    requested: number,
    match = false,
    forcePretax = false,
  ) {
    const p = s.people[i];
    const room = Math.min(capacity[i], requested);
    const forceRothCatch = p.age >= 50 && p.priorWages > rules.rothCatchUpWages;
    const rate = bracket(
      Math.max(0, baselineIncome - deduction / 100),
      s.filing,
    );
    let kind: Allocation["kind"] =
      rate <= 0.12 || (rate < 0.32 && s.preference === "same")
        ? "roth"
        : "pretax";
    if (forcePretax || !p.rothAvailable) kind = "pretax";
    const baseRemaining = Math.max(
      0,
      cents(
        Math.min(p.wages, rules.workplace) - p.pretaxExisting - p.rothExisting,
      ) - fundedWorkplace[i],
    );
    const ordinary = Math.min(room, baseRemaining);
    const reason = match
      ? `Contribute up to ${p.matchPercent}% of eligible salary to receive a ${p.matchRate}% employer match. Confirm payroll timing, vesting and true-up with your plan.`
      : kind === "pretax"
        ? "Reduce modeled ordinary taxable income while using remaining employee deferral room. Earlier match contributions share this same limit."
        : "Favor Roth contributions at this bracket or under your retirement-rate preference. Qualified withdrawals depend on age and holding-period rules.";
    const a = add(
      `${match ? "match" : "work"}-${p.id}`,
      match
        ? "Capture your employer match"
        : `${kind === "roth" ? "Roth" : "Pre-tax"} workplace plan`,
      p.name,
      kind,
      ordinary,
      reason,
      p.pretaxExisting + p.rothExisting + fundedWorkplace[i] / 100,
      match ? p.matchRate / 100 : 0,
    );
    capacity[i] -= a;
    fundedWorkplace[i] += a;
    const catchRoom = Math.min(capacity[i], room - ordinary);
    if (catchRoom > 0) {
      if (forceRothCatch && !p.rothAvailable)
        warnings.push(
          `${p.name}: catch-up funding requires Roth availability; reserved capacity is not allocated.`,
        );
      else {
        const b = add(
          `catch-${match ? "match" : "work"}-${p.id}`,
          "Workplace catch-up",
          p.name,
          forceRothCatch ? "roth" : kind,
          catchRoom,
          forceRothCatch
            ? "Prior-year employer wages exceed $150,000. This modeled catch-up must use Roth treatment; confirm plan applicability."
            : "Age-based catch-up uses remaining workplace capacity.",
          0,
          match ? p.matchRate / 100 : 0,
        );
        capacity[i] -= b;
        fundedWorkplace[i] += b;
      }
    }
  }
  s.people.forEach((p, i) => {
    if (p.workplace && p.matchPercent > 0 && p.matchRate > 0)
      workplace(
        i,
        cents(
          Math.max(
            0,
            (p.wages * p.matchPercent) / 100 -
              p.pretaxExisting -
              p.rothExisting,
          ),
        ),
        true,
      );
  });
  const hsaOwner = s.people.find((p) => p.id === s.hsaOwner) ?? s.people[0];
  const hsaLimit =
    (s.hsa === "family"
      ? rules.hsaFamily
      : s.hsa === "self"
        ? rules.hsaSingle
        : 0) +
    (hsaOwner.age >= 55 && s.hsa !== "none" && s.hsa !== "review"
      ? rules.hsaCatchUp
      : 0);
  if (s.hsa !== "none" && s.hsa !== "review" && s.hsaEligible) {
    if (s.hsaExisting + s.hsaEmployer > hsaLimit)
      warnings.push(
        "Existing HSA contributions exceed modeled annual room. Review excess contributions.",
      );
    add(
      "hsa",
      "Fund your HSA",
      hsaOwner.name,
      "hsa",
      cents(Math.max(0, hsaLimit - s.hsaExisting - s.hsaEmployer)),
      "Confirmed full-year eligibility only. Employer contributions share this limit. Qualified medical withdrawals are tax-free; other withdrawals have different rules.",
      s.hsaExisting + s.hsaEmployer,
    );
  } else if (s.hsa === "review" || (s.hsa !== "none" && !s.hsaEligible))
    warnings.push(
      "HSA allocation is excluded until full-year eligibility, Medicare and other coverage are confirmed.",
    );
  if (s.filing === "joint" && s.people.some((p) => p.age >= 55))
    warnings.push(
      "Only the selected HSA owner’s catch-up is modeled. A spouse’s separate HSA catch-up requires individual review.",
    );
  const high =
    bracket(Math.max(0, baselineIncome - deduction / 100), s.filing) >= 0.32;
  if (high) s.people.forEach((_, i) => workplace(i, capacity[i]));
  // Reserve direct IRA space conservatively using current MAGI. Reconcile after workplace deductions.
  const iraRows: { i: number; room: number; used: number; direct: number }[] =
    [];
  let compensation = cents(
    Math.max(
      0,
      s.people.reduce((sum, p) => sum + p.wages - p.iraExisting, 0),
    ),
  );
  s.people.forEach((p, i) => {
    const room = Math.min(
      Math.max(
        0,
        cents(rules.ira + (p.age >= 50 ? rules.iraCatchUp : 0) - p.iraExisting),
      ),
      compensation,
    );
    compensation = Math.max(0, compensation - room);
    const direct = Math.max(
      0,
      Math.min(
        room,
        cents(
          rothLimit(
            p.age,
            Math.max(0, baselineAgi - deduction / 100),
            s.filing,
          ) - p.iraExisting,
        ),
      ),
    );
    const used = add(
      `ira-${p.id}`,
      "Fund your Roth IRA",
      p.name,
      "roth",
      direct,
      "Direct Roth IRA room is based on modeled MAGI, age, eligible compensation and contributions already made. Traditional and Roth IRAs share one annual limit.",
      p.iraExisting,
    );
    iraRows.push({ i, room, used, direct });
  });
  if (!high) {
    const rate = bracket(
      Math.max(0, baselineIncome - deduction / 100),
      s.filing,
    );
    if (rate >= 0.22 && rate <= 0.24) {
      s.people.forEach((_, i) => {
        const shave = Math.max(
          0,
          cents(baselineIncome - rules[s.filing].thresholds[1]) - deduction,
        );
        if (shave > 0) workplace(i, Math.min(capacity[i], shave), false, true);
      });
    }
    s.people.forEach((_, i) => {
      if (capacity[i] > 0) workplace(i, capacity[i]);
    });
  }
  const finalMagi = Math.max(0, baselineAgi - deduction / 100);
  // Deductions can restore direct Roth eligibility. Add restored space before brokerage.
  iraRows.forEach(({ i, room, used }) => {
    const p = s.people[i];
    const finalDirect = Math.max(
      0,
      Math.min(
        room,
        cents(rothLimit(p.age, finalMagi, s.filing) - p.iraExisting),
      ),
    );
    const extra = Math.max(0, finalDirect - used);
    const row = allocations.find((a) => a.id === `ira-${p.id}`)!;
    row.capacity = finalDirect / 100;
    if (extra > 0 && remaining > 0) {
      const amount = Math.min(remaining, extra);
      row.amount += amount / 100;
      remaining -= amount;
    }
    const pending = Math.max(0, room - finalDirect);
    if (pending > 0) {
      add(
        `ira-review-${p.id}`,
        "IRA strategy · review needed",
        p.name,
        "review",
        pending,
        `Direct Roth eligibility is limited at this MAGI. ${p.iraBalances === "none" ? "Even with no reported pre-tax balance, a backdoor contribution/conversion needs a Form 8606 and year-end balance review." : "Review traditional, SEP and SIMPLE balances, basis and Form 8606 before a backdoor strategy."} These dollars are reserved, not assumed converted.`,
      );
      warnings.push(
        `${p.name}: some IRA capacity needs a backdoor/pro-rata review; no tax-free conversion is assumed.`,
      );
    }
  });
  add(
    "brokerage",
    "Build your flexible brokerage",
    "Household",
    "brokerage",
    s.education ? cents(s.brokerageTarget ?? 0) : remaining,
    "Flexible, taxable investing comes after retirement priorities. An annual target is a personal goal, not a statutory limit.",
  );
  if (s.education)
    add(
      "education",
      "Save for education",
      "Household",
      "education",
      cents(s.educationTarget),
      "Fund your selected 529 goal after your explicit brokerage target. State benefits and gift-tax limits are not modeled.",
    );
  if (
    s.otherIncome > 0 &&
    finalMagi > (s.filing === "single" ? 200000 : 250000)
  )
    warnings.push(
      "Review net investment income tax separately. No NIIT estimate is included.",
    );
  if (s.preference === "uncertain")
    warnings.push(
      "Uncertain retirement rate: preview favors bracket shaving, then pre-tax above 12%. Compare a Roth-leaning scenario; no universal split is assumed.",
    );
  const proposedIncome = Math.max(0, baselineIncome - deduction / 100),
    proposedTax = tax(proposedIncome, s.filing);
  return {
    ...empty,
    allocations,
    flexible: remaining / 100,
    proposedIncome,
    proposedTax,
    savings: Math.round((baselineTax - proposedTax) * 100) / 100,
    bracketAfter: bracket(proposedIncome, s.filing),
    rothHsa: allocations
      .filter((a) => a.kind === "roth" || a.kind === "hsa")
      .reduce((sum, a) => sum + a.amount, 0),
    employerMatch: employerMatch / 100,
    magi: finalMagi,
    next: allocations.find((a) => a.amount < a.capacity && a.kind !== "review"),
  };
}
