# Investing Order App Plan

Prepared November 27, 2026. Revised against the supplied article on November 27, 2026. Status: proposed product and implementation plan. No app implementation or deployment is included in this document.

**UX and backend scope update:** registration and Supabase are now planned. The [UX and screen flows](./INVESTING_ORDER_UX_FLOWS.md) define account onboarding, optional cloud saving, and screen-level behavior. This supersedes the account-free and exclusively local persistence assumptions below; calculations remain on the device, while opted-in cloud saving stores financial inputs in Supabase.

## 1. Product direction

Build **Investing Order by Rao’s Rendezvous**, an educational calculator that answers: **Where should my next investment dollar go, and why?** The product turns a household’s income, account eligibility, existing contributions, and remaining savings budget into an explainable annual contribution ladder.

The central idea from the supplied article is that the tax treatment of the next dollar depends on its position in the tax brackets and the expected tax rate when withdrawn. Preserve that idea through visible before-and-after arithmetic. Present the ladder as Rao’s methodology with adjustable assumptions, rather than a universally optimal investment prescription.

Use the existing Expo and TypeScript project for mobile and web. Launch a responsive web experience for newsletter readers first, then validate the same engine and flows for iOS and Android. Keep all household calculations on the device. The MVP needs no accounts, banking connections, transaction execution, or financial-data backend.

### Source basis and limitations

- Editorial source reviewed: [Raos_Rendezvous_Tax_Bracket_Order_of_Operations_2026.docx](/Users/raothopucherla/Downloads/Raos_Rendezvous_Tax_Bracket_Order_of_Operations_2026.docx), supplied as the article text.
- Product specification reviewed: [Raos_Rendezvous_Investment_Ladder_App_Spec.docx](/Users/raothopucherla/Downloads/Raos_Rendezvous_Investment_Ladder_App_Spec.docx).
- Publication link: [Your Tax Bracket Is the Order of Operations](https://raosrendezvous.substack.com/p/your-tax-bracket-is-the-order-of?r=778881). The supplied Word document resolves the earlier access limitation; the live page was not independently retrieved.
- Use the article for editorial intent, the specification for proposed features, and verified tax sources for calculation rules. Differences and new product decisions are identified below. Neither attachment authorizes app implementation or deployment.
- Tax implementation must use authoritative annual sources, linked below. A requirement in the specification is a product proposal, not proof of a tax rule.
- Repository snapshot: Expo `~58.1.0`, React `19.3.0`, React Native `0.88.1`, TypeScript, and Expo Router in `src/app/`. These describe the checked-in package manifest, not a dependency compatibility assessment.

## 2. Audience and outcomes

Start with U.S. W-2 employees filing Single or Married Filing Jointly. Support households in the low brackets, the 22%–24% decision range, and the higher brackets. Model each spouse separately where eligibility and contribution limits differ.

The first session should let a reader:

1. Enter a supported household profile without creating an account.
2. See an ordered allocation of their remaining contribution budget.
3. Understand the reason for each allocation and the next unfunded step.
4. Compare a changed income or Roth/pre-tax preference with the original scenario.
5. Export a checklist for discussion with a tax professional.

Measure comprehension as well as completion: in user testing, can readers distinguish marginal from effective tax rates, identify their next contribution target, and explain why the recommendation changes?

## 3. Scope and release boundaries

### MVP

- Explicit Tax Year 2026 selection and ruleset version.
- Single and MFJ profiles, including independent spouse ages and workplace access.
- W-2 wages, ordinary investment income, current contributions, eligible HSA coverage, workplace match, and remaining savings budget.
- Standard deduction for supported profiles; advanced deduction overrides clearly labeled as user supplied estimates.
- Dynamic Roth/pre-tax allocation, direct Roth IRA eligibility, and conditional backdoor Roth education.
- Per-person contribution limits and household HSA constraints.
- Allocation cards, contribution totals, a bracket visualization, assumptions, and warnings.
- Two locally held scenarios for comparison.
- User-defined brokerage target followed by an optional 529 target, preserving the article’s education-last priority.
- Client-generated CSV and printable checklist; PDF after export feasibility is validated.
- Public sample scenarios linked from Substack, using preset IDs only.

### Subsequent releases

- Gap-year Roth conversion and capital-gain stacking simulator.
- Detailed NIIT modeling when investment-income inputs are sufficient.
- Medicare IRMAA modeling with the appropriate income lookback and premium year.
- Full partial-year HSA and coverage-change workflows.
- State-specific 529 benefits and state tax treatment.
- Insurance illustration education, separately reviewed and separate from the allocation ladder.
- Additional filing statuses, specialized retirement plans, and self-employment calculations.

### Outside the first release

Brokerage execution, security selection, full tax-return preparation, return forecasts, automatic Roth conversions, insurance recommendations, subscriptions, and server-saved financial profiles.

Before entering the ladder, ask users to confirm that their investment budget is available after near-term cash needs and their chosen debt/emergency-fund priorities. This is a readiness prompt, not another financial planning engine.

## 4. Changes needed to make the specification implementable

### Preserve the article’s ladder and explain its changing middle

The article’s baseline is: employer match → HSA → bracket-selected workplace contribution → Roth IRA → remaining workplace capacity → taxable brokerage → 529 education. Insurance is a separate, last-considered topic, not the seventh allocation rung. In the split zone, the article explicitly moves Roth IRA funding ahead of additional pre-tax workplace funding. High earners prioritize pre-tax workplace capacity before the IRA step.

Keep these account names visible in the interface while showing scenario-specific priority. Distinguish an allocation step from its account: the match, pivot, and workplace-completion steps may all draw from the same employee deferral limit.

The article does not specify how much beyond the match to fund at the low-bracket workplace pivot before switching to the IRA. Proposed MVP default: after match/HSA, secure eligible Roth IRA space and then fund remaining Roth workplace room. Clearly record this as a product interpretation pending editorial confirmation; it is not an explicit ordering instruction from the article.

### Separate account order from account limits

The specification reuses workplace capacity across multiple rungs and describes seven rungs inconsistently. Use one capacity ledger per person and account category. Match contributions consume employee deferral room; later workplace steps use only the remainder. Employer matching dollars appear separately and never consume the user’s savings budget.

### Define when brokerage is funded before moving to 529

Both documents put brokerage before education. The previous plan proposed moving 529 ahead of brokerage; this revision replaces that proposal to preserve the article’s order. Because brokerage has no annual contribution ceiling, ask a household with an education goal to define its annual brokerage target. After the retirement steps, fund that target, then the 529 target. Any remaining money is shown as unallocated flexible savings with an explicit option to add it to brokerage.

If education is disabled, all post-retirement overflow can go to brokerage. If education is enabled and the brokerage target is unknown, show a decision-needed state rather than choosing a target silently. A user may explicitly choose zero. This target mechanism is a new product interpretation, not a statutory limit or an amount specified by the article.

### Treat insurance as a separate educational module

Do not route savings into insurance automatically. A death-benefit/cash-value ratio can illustrate a statutory corridor for an applicable policy, but cannot establish policy quality, actual insurance charges, or MEC status. Section 7702 distinguishes the cash-value accumulation test from the guideline-premium/corridor approach; the corridor is not a universal efficiency score. [26 USC 7702](https://www.govinfo.gov/content/pkg/USCODE-2022-title26/html/USCODE-2022-title26-subtitleF-chap79-sec7702.htm)

Remove labels such as “Corridor Floor = Efficient” and “MEC Risk” inferred solely from a ratio. Any later module needs contract-test type, insurer-confirmed values, premium history, and specialist review before making stronger claims.

Preserve the article’s permanent-death-benefit-need prerequisite and its emphasis on funding other priorities first. Separate corridor education under § 7702 from the MEC seven-pay test under § 7702A; one ratio cannot establish compliance with both. [26 USC 7702A](https://www.law.cornell.edu/uscode/text/26/7702A)

### Collect eligibility rather than infer it from household income

Do not assume that MFJ means two workplace plans or two eligible catch-up contributors. Ask for each spouse’s age, compensation, plan access, and prior-year wages from the relevant employer. Use year-end age for contribution-age rules. Unknown information must remain unknown; sample defaults must not look like confirmed facts.

### Use the full Roth IRA phaseout

Crossing the lower phaseout threshold does not remove all direct Roth eligibility. Calculate permitted contributions within the band using the official worksheet and rounding rules. Traditional and Roth IRA contributions share an annual limit. Review the compensation and spousal IRA requirements. [IRS Publication 590-A](https://www.irs.gov/publications/p590a)

Re-evaluate Roth eligibility after the final proposed deductions. Use deterministic stages or bounded recalculation so changing MAGI cannot produce unstable allocations.

### Define savings budget consistently

For the MVP, the entered budget means **remaining employee contribution dollars to allocate**, not equivalent take-home-pay cost. A $1,000 pre-tax allocation consumes $1,000 of this budget. Display estimated tax savings separately and do not automatically reinvest them. A later take-home-pay mode would require a different budget solver.

Collect contributions already made and planned outside this budget. Never deduct an existing payroll contribution twice from wages or count it twice against available room.

### Keep tax-law constraints distinct from editorial preferences

The article says to lean pre-tax when the expected retirement rate is lower, lean Roth when it is the same or higher, and diversify when uncertain. It does not prescribe percentages. The specification’s 75/25 and 50/50 splits are proposed implementation defaults. Label their origin, make them editable, and confirm them in editorial review. Statutory contribution ceilings and eligibility rules always override a preference.

### Translate article examples into balanced comparisons

Use the article’s low-income conversion window, bracket shaving, and asset-location concepts as learning modules. Avoid turning phrases such as “Roth first, always” into an unconditional guarantee. Show assumptions about future withdrawal rates and the specific eligibility or tax-cliff exception.

If adding a Roth-versus-pre-tax growth illustration later, compare equal economic cost and account for the handling of the pre-tax deduction. Do not present equal nominal contributions with different out-of-pocket costs as a complete strategy comparison. Conversion and gain-harvesting modules must share a single income calculation so the same headroom is not counted twice.

## 5. User experience

### Welcome and sample scenarios

Lead with “Find the next account to fund.” Offer “Build my plan” and sample profiles for an early-career saver, a couple in the split zone, and a high earner. Show the tax year, calculation scope, privacy statement, and article attribution before entry.

### Step 1 — Household and budget

Collect filing status, each person’s age, gross wages before employee deferrals, other supported income, current contributions, deduction choice, and remaining annual budget. Accept zero dollars so users can explore their next target without receiving a validation error.

Explain income definitions beside the field. Separate tax-exempt interest, qualified dividends, and long-term gains from ordinary income. If preferential-income treatment is not implemented yet, show the case as unsupported for precise tax savings rather than applying ordinary tax rates to it.

### Step 2 — Accounts and preferences

Collect workplace plan details per person, match formula and eligible salary, Roth availability, catch-up availability, employer HSA contributions, HSA eligibility, IRA history, expected retirement-bracket preference, and optional education target. When education is enabled, require an explicit annual brokerage target before proceeding to that step.

Ask about match true-ups and remaining payroll opportunities before turning annual targets into executable payroll instructions. The MVP may support a simple single-tier match formula and flag more complex formulas for manual review.

### Results

Display three main summaries: current and proposed marginal bracket, estimated reduction in modeled federal ordinary income tax, and planned Roth plus HSA contributions. Explain that Roth and HSA withdrawal treatment depends on the applicable conditions.

Each ladder card shows account owner, contribution amount, pre-tax/Roth treatment, capacity used, capacity remaining, and “Why this step?” Expand the explanation to show the tax-income change and any assumptions. Incomplete steps remain visible with a “Next dollar target” marker.

Use teal for Roth/HSA, navy for pre-tax, slate for brokerage, and purple for education savings. Pair colors with labels and icons. On mobile, use vertical cards and a compact stacked allocation bar. On desktop, put the editable profile beside results. Provide text equivalents for charts, keyboard access, screen-reader labels, large text support, and reduced-motion behavior.

### Compare and export

Keep a baseline and a modified scenario in memory. Show changes in contribution dollars, tax estimate, and remaining capacity. Export the selected scenario with tax year, ruleset version, assumptions, unresolved eligibility questions, owner-specific targets, and relevant sources.

The checklist is for review and execution planning; it must not imply that contributions, conversions, or transfers have already occurred.

## 6. Inputs and calculation data

Use four groups of typed data:

- **Household:** filing status, tax year, supported income categories, deduction inputs, budget, brokerage target when education is enabled, education target, and strategy preference.
- **Person:** identifier, year-end age, eligible compensation, prior-year employer-specific wages, plan access, and Roth/catch-up availability.
- **Account state:** contributions already made, committed future contributions, employer contributions, remaining capacities, IRA basis and relevant balances, HSA coverage and eligibility.
- **Result:** ordered allocations, external employer match, baseline/proposed tax estimates, remaining cash, warnings, assumptions, explanation steps, and source references.

Do not use one generic MAGI value for every rule. Maintain a calculation trace for AGI, taxable ordinary income, Roth IRA MAGI, and NIIT MAGI when supported. Qualified dividends and long-term gains need their own stacking treatment.

Require actual ages rather than defaulting a spouse’s age. Record HSA coverage by eligible period or limit the initial workflow to confirmed full-year eligibility. Include Medicare enrollment and disqualifying coverage checks.

HSA limits include employer contributions. Family coverage does not create two family limits; eligible spouses’ catch-up contributions need their own HSAs. Employer/payroll exclusions and personal deductions must not both be applied to the same dollars. [IRS Publication 969](https://www.irs.gov/publications/p969)

## 7. Allocation engine

Implement a pure TypeScript domain layer, independent of Expo, navigation, storage, and chart libraries. Use integer cents for budget and contribution arithmetic, explicit tax precision, and the IRS-prescribed rounding where required.

### Processing sequence

1. Validate supported scope and identify missing facts. Return structured issues rather than silently substituting eligibility.
2. Normalize income and contributions, preserving whether wages already exclude payroll deferrals.
3. Calculate remaining owner-specific capacity and the baseline tax position.
4. Allocate employee dollars required for employer matches, constrained by remaining budget and capacity.
5. Allocate remaining eligible HSA capacity.
6. Apply the bracket-driven strategy to IRA and remaining workplace contributions.
7. If education is enabled, allocate its prerequisite brokerage target and then the education target; keep any further remainder visible as flexible savings until the user assigns it. Otherwise allocate residual dollars to brokerage.
8. Reconcile deductions and Roth IRA eligibility; finalize a stable allocation and explanation trace.
9. Verify conservation, eligibility, and capacity invariants before displaying results.

### Proposed bracket strategy

- **10%–12%:** use Roth treatment for workplace contributions, subject to the supported exceptions. After match/HSA, the proposed MVP funds permitted Roth IRA space, then remaining Roth workplace room. The article establishes the Roth preference but leaves the workplace-pivot amount unspecified; confirm this sequencing interpretation in editorial review.
- **22%–24%:** reserve eligible IRA space, then direct pre-tax workplace dollars toward the next lower bracket boundary. If that boundary cannot be reached, explain the partial reduction. Use the retirement-bracket preference only for remaining room after this step.
- **32%–37%:** favor pre-tax workplace base contributions, handle any mandatory Roth catch-up slice separately, then eligible IRA space.
- Re-evaluate the marginal position as deductions accumulate. Do not continue treating every dollar as if it saved tax at the initial highest rate.
- For dual-plan households, prioritize each match, then use a documented stable tie-breaker for equivalent opportunities; let users adjust the household split within lawful capacities.

Use the article’s seven named steps as the baseline display, with retirement steps reordered or merged when a scenario requires it. Brokerage remains before education. Show unused or completed steps explicitly, and show remaining flexible savings outside the seven steps. A single capacity ledger prevents duplicate funding across workplace steps.

### Explainable arithmetic

Compute savings as the difference between baseline and proposed modeled tax, holding other inputs constant. Sum explanation-level tax changes back to the displayed total.

Example fixture: a Single filer with $111,900 of ordinary taxable income before a proposed $6,200 pre-tax deferral reaches $105,700 after the deferral. Under the 2026 ordinary bracket schedule, that slice produces a $1,488 modeled federal ordinary income tax reduction. This illustration excludes credits, state taxes, and other interactions. [IRS Revenue Procedure 2025-32](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf)

### Backdoor Roth handling

Treat a backdoor Roth as a conditional contribution-and-conversion workflow, not another independent account limit. If IRA aggregation or basis information is incomplete, reserve the suggested amount as “IRA strategy pending review” and keep its dollars in the budget reconciliation. Do not describe a conversion as tax-free based only on today’s pre-tax balance. Relevant year-end balances, basis, distributions, and Form 8606 treatment matter. [IRS Form 8606 instructions](https://www.irs.gov/instructions/i8606)

## 8. Annual rules and tax boundaries

Store sourced constants in `src/domain/tax/rules/2026.json`, with tax year, version, publication reference, section locator, verification date, and review status. Keep separate configuration for editorial allocation preferences.

Key 2026 retirement anchors are the $24,500 workplace base limit, $8,000 standard catch-up, $11,250 age-60–63 catch-up, $7,500 IRA base limit, and $1,100 IRA catch-up. The specified Roth IRA phaseout bands are $153,000–$168,000 for Single and $242,000–$252,000 for MFJ. The Roth catch-up wage threshold is $150,000 of applicable prior-year wages, not current household income. Plan-specific applicability must be reviewed. [IRS Notice 2025-67](https://www.irs.gov/irb/2025-49_IRB)

The 2026 HSA annual anchors are $4,400 self-only and $8,750 family, subject to eligibility and contribution adjustments. [IRS Revenue Procedure 2025-19](https://www.irs.gov/pub/irs-drop/rp-25-19.pdf)

Do not combine 401(k), 403(b), and governmental 457(b) limits under a single generic cap without reviewing their aggregation rules. Initially support one 401(k) or 403(b) per person; flag simultaneous-plan and governmental 457(b) cases until dedicated logic is validated. Compensation also limits deferrals. [IRS retirement contribution guidance](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-contributions)

NIIT is a separate calculation based on net investment income and MAGI excess. Crossing a MAGI threshold alone does not establish the amount owed, and an IRA conversion is not itself net investment income. In MVP, show a contextual alert rather than estimating a surtax without the required data. [IRS NIIT overview](https://www.irs.gov/individuals/net-investment-income-tax)

Additional deductions for age/blindness and other applicable deductions cannot be represented by the base standard deduction alone. Route unsupported cases to an advanced estimated-income mode or clearly limit the result. Do not advertise a complete federal tax calculation while excluding AMT, credits, Social Security taxation, QBI, or other material interactions.

Because planning begins late in 2026, label 2026 explicitly and collect contributions to date and payroll capacity remaining. Do not silently use 2026 for a 2027 planning session. A 2027 ruleset is a separately verified release.

## 9. Technical design

**Confirmed UI preference:** use Expo with Tailwind-styled components for the user interface. Build reusable buttons, inputs, cards, toggles, and allocation views with consistent utility-based styling across iOS, Android, and web. Select an Expo-compatible React Native Tailwind styling integration and component library during implementation, after checking compatibility with the installed SDK. No specific library has been selected yet.

Retain Expo Router and the repository’s mobile-first conventions. Do not migrate to Vite or Next.js just because the source specification suggested them. Keep implementation decisions compatible with the installed Expo major version and check the matching official documentation before touching Expo APIs.

Proposed organization:

```text
src/app/                     Welcome, profile, ladder, comparison, methodology
src/components/ladder/       Reusable allocation cards and accessible charts
src/features/profile/        Form state, validation, input explanations
src/features/comparison/     Baseline and modified scenarios
src/domain/tax/              Tax calculations and annual sourced rules
src/domain/allocation/       Capacity ledger, strategy, explanation trace
src/domain/scenarios/        Synthetic fixtures and public preset IDs
src/lib/storage/             Optional local persistence adapters
src/lib/export/              Checklist, CSV, and platform export adapters
docs/                        Product decisions and review records
```

Start with React state and pure selectors. Add a state library only if form and comparison complexity warrants it. Select chart and PDF packages after a small web/native feasibility exercise; browser-only chart or DOM-to-PDF libraries should not determine the shared architecture.

Target under 50 ms for engine recalculation on an agreed representative device, measured independently of chart rendering. Keep rendering responsive and avoid recomputing unaffected scenarios. This is a target to validate, not a promised benchmark.

The current web configuration uses `output: server`. Review hosting requirements before changing it. Prefer a static deployment when no server features are needed, while retaining local-only calculations. Deployment provider selection and store submission are later implementation tasks.

## 10. Privacy and trust

- Keep household values in memory by default. Local saving is opt-in and includes a clear “Delete saved data” action.
- No financial inputs in URLs, analytics, crash reports, server logs, or session replay. Share links contain public synthetic scenario IDs only.
- Treat local storage as device-accessible data; avoid claiming that local-only operation removes all privacy or compliance obligations.
- Offer export previews and explain that saved files contain financial information.
- Add anonymous funnel analytics only after a data-flow review. Restrict events to general actions such as opening a preset or exporting a checklist.
- Every result includes model scope, tax year, source version, strategy assumptions, and an educational-use disclosure. Annual rules updates require review and regression tests.

## 11. Validation and release gates

### Calculation tests

Use meaningful boundary and scenario tests rather than a blanket promise of 100% line coverage:

- Values immediately below, at, and above every supported bracket and Roth phaseout boundary.
- Ages 49/50, 54/55, 59/60, 63/64, with independent spouse eligibility.
- Prior-year applicable wages at and just above the Roth catch-up threshold.
- No plan, no match, no Roth option, insufficient compensation, and existing contributions that consume capacity.
- Zero budget, cash exhausted at each step, zero taxable income, and income beyond the top bracket.
- HSA employer contributions, shared family limit, Medicare exclusions, and unsupported partial-year cases.
- Partial Roth eligibility, existing IRA basis/balances, and unresolved backdoor workflows.
- Brokerage target funded before 529; missing brokerage target; zero brokerage target; budget exhausted before education; and flexible savings remaining after both targets.
- Article reconciliation fixtures: fixed match/HSA anchors, split-zone IRA before additional workplace funding, high-zone pre-tax-first allocation, and no automatic insurance allocation.
- The $6,200 bracket-shaving fixture above, plus a case spanning multiple brackets.

For every generated result, allocated dollars plus explicitly unallocated/review-reserved dollars must equal the budget. No allocation may be negative, exceed capacity, duplicate an existing contribution, or use unsupported eligibility.

### Product and privacy tests

Verify web/mobile layout, keyboard and screen-reader navigation, comparison reset, export reconciliation, persistence deletion, preset links, and handling of missing facts. Inspect network traffic to confirm entered financial values are not transmitted. Validate exports on each supported platform.

Before public release, have an independent qualified tax reviewer check the ruleset, golden scenarios, and explanatory copy. Disclosures do not substitute for correct calculations.

## 12. Delivery sequence

Estimates assume one developer, timely product decisions, and available tax review. Budget approximately six to eight weeks for the core web MVP; native release work and advanced modules have separate estimates.

### Milestone 1 — Resolve scope and design the flow

About one week. Confirm the article-aligned ladder, low-bracket pivot amount, brokerage-target interpretation, budget meaning, supported household scope, and brand. Create low-fidelity welcome/profile/results/comparison/export designs and review with a small group of newsletter readers.

Exit: readers understand the next-dollar concept, and the methodology ambiguities have recorded decisions.

### Milestone 2 — Build and review the calculation core

About two weeks. Implement typed inputs, sourced annual rules, tax calculation, capacity ledger, allocation strategy, and explanation trace. Build boundary fixtures and obtain initial tax review before styling results.

Exit: reviewed scenarios reconcile, unsupported cases are explicit, and allocation invariants pass.

### Milestone 3 — Build the usable calculator

About two weeks. Implement progressive forms, allocation cards, bracket visualization, comparison, public presets, and optional local persistence.

Exit: a reader can complete a supported scenario on mobile web and understand each target.

### Milestone 4 — Export and prepare the web release

About one to two weeks. Add checklist/CSV, validate PDF feasibility, accessibility, privacy checks, performance measurements, and independent review fixes. Prepare hosting and newsletter links without publishing until implementation is approved.

Exit: export totals match results, the ruleset is reviewed, and no financial data leaves the device during calculation.

### Milestone 5 — Expand after reader feedback

Estimate separately. Prioritize native packaging, a reviewed 2027 ruleset, the gap-year simulator, and specialized eligibility workflows according to observed demand. Keep the insurance module behind its own accuracy and editorial review gate.

## 13. Proposed decisions and immediate backlog

Proceed with these planning defaults unless revised during product review:

1. Use “Investing Order by Rao’s Rendezvous” as the working product name.
2. Retain Expo with a Substack-friendly web launch first, and use Tailwind-styled UI components as requested.
3. Treat the savings budget as contribution dollars and display tax savings separately.
4. Keep account capacity per person, with household-specific rules where required.
5. Preserve brokerage before education, using an explicit annual brokerage target when a 529 goal is enabled.
6. Keep insurance outside the allocation engine and defer conversion modeling.
7. Use the supplied article as the editorial basis; label the specification’s percentage splits and the plan’s low-bracket sequencing and brokerage-target mechanism as proposed product decisions.

The first implementation backlog should be: document these decisions; create the reviewed synthetic scenarios; build the sourced rules configuration; define the input/output contracts; implement capacity and tax calculations; then connect a minimal profile form to an explainable ladder. Visual polish follows validation of the underlying arithmetic.
