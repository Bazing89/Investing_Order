import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Button,
  Field,
  Choices,
  Toggle,
  Badge,
  Notice,
  useWide,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { person } from "@/domain/scenarios/presets";
import type { Person, Scenario } from "@/domain/allocation/types";
import {
  validate,
  rules,
  money,
  workplaceLimit,
} from "@/domain/allocation/engine";
import { supabase } from "@/lib/supabase";
const steps = [
  "Household",
  "Income",
  "Workplace",
  "HSA",
  "IRA",
  "Goals",
  "Saving",
  "Review",
];
function NumberField({
  label,
  value,
  change,
  hint,
  dollar = true,
}: {
  label: string;
  value: number | null;
  change: (n: number) => void;
  hint?: string;
  dollar?: boolean;
}) {
  const [text, setText] = useState(
    value === null || !Number.isFinite(value) ? "" : String(value),
  );
  return (
    <Field
      label={label}
      value={text}
      onChange={(v) => {
        setText(v);
        change(v.trim() === "" ? NaN : Number(v.replace(/,/g, "")));
      }}
      numeric
      prefix={dollar ? "$" : undefined}
      hint={hint}
    />
  );
}
export default function Builder() {
  const store = usePlans(),
    wide = useWide(),
    s = store.draft;
  const [step, setStep] = useState(s?.builderStep ?? 0),
    [errors, setErrors] = useState<string[]>([]);
  if (!s)
    return (
      <Shell title="Build your plan">
        <Card>
          <Txt>No draft yet.</Txt>
          <Button onPress={() => store.start()}>Start a new plan</Button>
        </Card>
      </Shell>
    );
  const patch = (change: Partial<Scenario>) =>
    store.updateDraft({ ...s, ...change });
  const patchPerson = (i: number, change: Partial<Person>) =>
    patch({
      people: s.people.map((p, j) => (j === i ? { ...p, ...change } : p)),
    });
  function go(index: number) {
    setErrors([]);
    setStep(index);
    if (s) store.updateDraft({ ...s, builderStep: index });
  }
  function next() {
    const all = validate(s!);
    const required =
      step === 0
        ? all.filter((e) => /age|household|name|near-term/.test(e))
        : step === 1
          ? all.filter((e) => /deduction|amount/.test(e))
          : step === 2
            ? all.filter((e) => /workplace|match/.test(e))
            : step === 5
              ? all.filter((e) => /brokerage|amount/.test(e))
              : [];
    if (required.length) {
      setErrors(required);
      return;
    }
    go(Math.min(7, step + 1));
  }
  function finish() {
    const issues = validate(s!);
    setErrors(issues);
    if (issues.length) return;
    if (supabase && !store.session) {
      router.push("/auth/sign-in");
      return;
    }
    store.save(s!);
    router.replace("/plans/ladder");
  }
  return (
    <Shell
      title="Make your next dollar count."
      subtitle="A few details today. A clearer plan for the year."
      action={
        <Button small secondary onPress={() => router.push("/plans")}>
          Continue later
        </Button>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ gap: 25 }}
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          {steps.map((label, i) => (
            <View key={label} style={{ flex: 1, gap: 9 }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 3,
                  backgroundColor: i <= step ? C.green : C.line,
                }}
              />
              {wide && (
                <Txt size={10} color={i === step ? C.green : C.muted}>
                  {label}
                </Txt>
              )}
            </View>
          ))}
        </View>
        <View
          style={{ maxWidth: 700, width: "100%", alignSelf: "center", gap: 22 }}
        >
          <View style={{ gap: 6 }}>
            <Badge>
              STEP {step + 1} OF 8 · {steps[step].toUpperCase()}
            </Badge>
            <Txt size={29} style={{ letterSpacing: -0.7 }}>
              {
                [
                  "Let’s start with you.",
                  "The bigger income picture.",
                  "Put your workplace benefits to work.",
                  "A healthy advantage.",
                  "Make room for your future.",
                  "Give your dollars a destination.",
                  "Your plan. Your choice.",
                  "A quick look before the ladder.",
                ][step]
              }
            </Txt>
          </View>
          {errors.map((e) => (
            <Notice key={e} error>
              {e}
            </Notice>
          ))}
          {step === 0 && (
            <Card>
              <Field
                label="Plan name"
                value={s.name}
                onChange={(name) => patch({ name })}
              />
              <Choices
                label="Filing status"
                value={s.filing}
                options={[
                  { label: "Single", value: "single" },
                  { label: "Married filing jointly", value: "joint" },
                ]}
                onChange={(filing) =>
                  patch({
                    filing,
                    people:
                      filing === "single"
                        ? [s.people[0]]
                        : [
                            s.people[0],
                            s.people[1] ?? {
                              ...person("spouse", "Spouse"),
                              age: 0,
                              wages: 0,
                              priorWages: 0,
                              workplace: false,
                              pretaxExisting: 0,
                              matchPercent: 0,
                            },
                          ],
                  })
                }
              />
              <Txt size={11} color={C.muted}>
                Tax year 2026 · Other filing statuses are not supported in this
                preview.
              </Txt>
              {s.people.map((p, i) => (
                <View
                  key={p.id}
                  style={{
                    gap: 14,
                    paddingTop: 15,
                    borderTopWidth: 1,
                    borderColor: C.line,
                  }}
                >
                  <Txt color={C.green} size={12}>
                    {p.name}
                  </Txt>
                  <NumberField
                    label={`${p.name}: age at December 31, 2026`}
                    value={p.age || null}
                    dollar={false}
                    change={(age) => patchPerson(i, { age })}
                  />
                </View>
              ))}
              <Toggle
                label="My investing budget is ready"
                value={s.ready}
                onChange={(ready) => patch({ ready })}
                hint="I have considered near-term expenses, emergency savings and debt priorities."
              />
            </Card>
          )}
          {step === 1 && (
            <Card>
              <Notice>
                Use annual gross wages before employee payroll deferrals.
                Existing and committed contributions are entered separately.
              </Notice>
              {s.people.map((p, i) => (
                <NumberField
                  key={p.id}
                  label={`${p.name}: gross annual W-2 wages`}
                  value={p.wages}
                  change={(wages) => patchPerson(i, { wages })}
                />
              ))}
              <NumberField
                label="Other ordinary income"
                value={s.otherIncome}
                change={(otherIncome) => patch({ otherIncome })}
                hint="For example, taxable interest. Do not include qualified dividends, long-term gains, Social Security or self-employment income."
              />
              <Toggle
                label="Use a reviewed deduction estimate"
                value={s.deduction !== null}
                onChange={(v) =>
                  patch({ deduction: v ? rules[s.filing].deduction : null })
                }
                hint={`Otherwise use the base ${money(rules[s.filing].deduction)} standard deduction. Age 65+ requires a reviewed estimate.`}
              />
              {s.deduction !== null && (
                <NumberField
                  label="Total deduction estimate"
                  value={s.deduction}
                  change={(deduction) => patch({ deduction })}
                />
              )}
              <Notice>
                Complex income, credits, AMT and state taxes are outside this
                model. If those affect your household, use this as a partial
                planning illustration.
              </Notice>
            </Card>
          )}
          {step === 2 &&
            s.people.map((p, i) => (
              <Card key={p.id}>
                <Badge>{p.name.toUpperCase()}</Badge>
                <Toggle
                  label="I have one 401(k) or 403(b)"
                  value={p.workplace}
                  onChange={(workplace) =>
                    patchPerson(i, {
                      workplace,
                      ...(workplace
                        ? {}
                        : {
                            pretaxExisting: 0,
                            rothExisting: 0,
                            matchPercent: 0,
                          }),
                    })
                  }
                  hint="Multiple simultaneous plans and 457(b) arrangements need manual review."
                />
                {p.workplace && (
                  <>
                    <NumberField
                      label="Employer match: employee salary percentage"
                      value={p.matchPercent}
                      dollar={false}
                      change={(matchPercent) =>
                        patchPerson(i, { matchPercent })
                      }
                      hint="For a dollar-for-dollar match on the first 4%, enter 4 below and 100 in the next field. Use 0 for no match."
                    />
                    <NumberField
                      label="Employer match rate (%)"
                      dollar={false}
                      value={p.matchRate}
                      change={(matchRate) => patchPerson(i, { matchRate })}
                    />
                    <NumberField
                      label="Existing + committed pre-tax contributions"
                      value={p.pretaxExisting}
                      change={(pretaxExisting) =>
                        patchPerson(i, { pretaxExisting })
                      }
                      hint="Include future contributions outside this new budget. Do not include employer dollars."
                    />
                    <NumberField
                      label="Existing + committed Roth workplace contributions"
                      value={p.rothExisting}
                      change={(rothExisting) =>
                        patchPerson(i, { rothExisting })
                      }
                    />
                    <Toggle
                      label="My plan offers Roth contributions"
                      value={p.rothAvailable}
                      onChange={(rothAvailable) =>
                        patchPerson(i, { rothAvailable })
                      }
                    />
                    {p.age >= 50 && (
                      <>
                        <Toggle
                          label="My plan permits age-based catch-up contributions"
                          value={p.catchUp}
                          onChange={(catchUp) => patchPerson(i, { catchUp })}
                        />
                        <NumberField
                          label="2025 wages from this employer"
                          value={p.priorWages}
                          change={(priorWages) =>
                            patchPerson(i, { priorWages })
                          }
                          hint="Above $150,000 can require Roth catch-up treatment in 2026."
                        />
                      </>
                    )}
                    <Notice>
                      Uses a simple single-tier match on your full W-2 salary.
                      Check eligible salary, match true-up, vesting and
                      remaining payroll opportunities before executing.
                    </Notice>
                  </>
                )}
              </Card>
            ))}
          {step === 3 && (
            <Card>
              <Choices
                label="HSA coverage"
                value={s.hsa}
                options={[
                  { label: "Not eligible / none", value: "none" },
                  { label: "Self-only", value: "self" },
                  { label: "Family", value: "family" },
                  { label: "Partial year / unsure", value: "review" },
                ]}
                onChange={(hsa) => patch({ hsa })}
              />
              {s.hsa !== "none" && (
                <>
                  <Choices
                    label="HSA account owner"
                    value={s.hsaOwner}
                    options={s.people.map((p) => ({
                      label: p.name,
                      value: p.id,
                    }))}
                    onChange={(hsaOwner) => patch({ hsaOwner })}
                  />
                  <Toggle
                    label="Full-year HSA eligibility confirmed"
                    value={s.hsaEligible}
                    onChange={(hsaEligible) => patch({ hsaEligible })}
                    hint="Eligible coverage all year, not enrolled in Medicare, no disqualifying coverage and not a tax dependent."
                  />
                  <NumberField
                    label="Employee HSA contributions already made or committed"
                    value={s.hsaExisting}
                    change={(hsaExisting) => patch({ hsaExisting })}
                  />
                  <NumberField
                    label="Employer HSA contributions"
                    value={s.hsaEmployer}
                    change={(hsaEmployer) => patch({ hsaEmployer })}
                  />
                  <Notice>
                    Family coverage shares one base limit. Only the selected
                    owner’s age-55 catch-up is modeled. Spouse catch-ups and
                    coverage changes need separate review.
                  </Notice>
                </>
              )}
            </Card>
          )}
          {step === 4 &&
            s.people.map((p, i) => (
              <Card key={p.id}>
                <Badge>{p.name.toUpperCase()}</Badge>
                <NumberField
                  label="Traditional + Roth IRA contributions already made"
                  value={p.iraExisting}
                  change={(iraExisting) => patchPerson(i, { iraExisting })}
                  hint="Include contributions committed outside this budget; both types share one annual limit."
                />
                <Choices
                  label="Traditional, SEP or SIMPLE IRA pre-tax balances?"
                  value={p.iraBalances}
                  options={[
                    { label: "None reported", value: "none" },
                    { label: "Yes", value: "yes" },
                    { label: "I’m not sure", value: "unknown" },
                  ]}
                  onChange={(iraBalances) => patchPerson(i, { iraBalances })}
                />
                <Notice>
                  Direct Roth eligibility is calculated after proposed
                  deductions. A backdoor IRA strategy is always conditional
                  here; year-end balances, nondeductible basis and Form 8606
                  need review.
                </Notice>
              </Card>
            ))}
          {step === 5 && (
            <Card>
              <NumberField
                label="Remaining annual investing budget"
                value={s.budget}
                change={(budget) => patch({ budget })}
                hint="Contribution dollars available after existing and committed contributions. $1 pre-tax uses $1 of this budget. Zero is allowed."
              />
              <Choices
                label="Expected retirement tax rate compared with today"
                value={s.preference}
                options={[
                  { label: "Lower", value: "lower" },
                  { label: "Same or higher", value: "same" },
                  { label: "Uncertain", value: "uncertain" },
                ]}
                onChange={(preference) => patch({ preference })}
              />
              <Toggle
                label="Add an education savings goal"
                value={s.education}
                onChange={(education) => patch({ education })}
                hint="A 529 goal comes after your selected brokerage target."
              />
              {s.education && (
                <>
                  <NumberField
                    label="Annual brokerage target (required, zero allowed)"
                    value={s.brokerageTarget}
                    change={(brokerageTarget) => patch({ brokerageTarget })}
                  />
                  <NumberField
                    label="Annual 529 education target"
                    value={s.educationTarget}
                    change={(educationTarget) => patch({ educationTarget })}
                  />
                </>
              )}
              <Notice>
                Tax savings are shown separately and are not automatically
                reinvested. Monthly equivalents are planning amounts, not
                instructions to change payroll.
              </Notice>
            </Card>
          )}
          {step === 6 && (
            <Card>
              <Toggle
                label="Save plans on this device"
                value={store.local}
                onChange={(v) => {
                  void store.setLocal(v);
                }}
                hint="Opt in to keep your inputs after closing the app. Device storage is not encrypted by this app."
              />
              <Notice>
                {supabase
                  ? "Personal plans require sign-in. Cloud uploading is a separate, explicit snapshot action in Settings."
                  : "Local preview: Supabase has not been configured. You can build a plan in this session; no account or financial data is sent to a backend."}
              </Notice>
              <Txt color={C.muted} size={12}>
                With device saving off, closing or refreshing the app clears
                your draft. You can change your preference in Settings.
              </Txt>
            </Card>
          )}
          {step === 7 && (
            <Card>
              <Badge>TAX YEAR 2026</Badge>
              <Txt size={23}>{s.name}</Txt>
              {[
                {
                  label: "Household",
                  value:
                    s.filing === "single" ? "Single" : "Married filing jointly",
                  edit: 0,
                },
                {
                  label: "Gross wages",
                  value: money(s.people.reduce((sum, p) => sum + p.wages, 0)),
                  edit: 1,
                },
                {
                  label: "Workplace capacity",
                  value: money(
                    s.people.reduce(
                      (sum, p) =>
                        sum +
                        (p.workplace
                          ? Math.max(
                              0,
                              workplaceLimit(p) -
                                p.pretaxExisting -
                                p.rothExisting,
                            )
                          : 0),
                      0,
                    ),
                  ),
                  edit: 2,
                },
                { label: "HSA coverage", value: s.hsa, edit: 3 },
                { label: "Annual budget", value: money(s.budget), edit: 5 },
              ].map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: "row",
                    gap: 15,
                    alignItems: "center",
                    paddingVertical: 7,
                  }}
                >
                  <Txt size={12} color={C.muted} style={{ flex: 1 }}>
                    {row.label}
                  </Txt>
                  <Txt size={13}>{row.value}</Txt>
                  <Button secondary small onPress={() => go(row.edit)}>
                    Edit
                  </Button>
                </View>
              ))}
              <Notice>
                This preview applies Rao’s bracket-based ordering, with Roth IRA
                before additional workplace funding in the lower and middle
                brackets. All figures are estimates; conditional IRA dollars are
                held for review.
              </Notice>
              {validate(s).map((e) => (
                <Notice key={e} error>
                  {e}
                </Notice>
              ))}
            </Card>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 20,
            }}
          >
            <Button
              secondary
              onPress={() =>
                step === 0 ? router.push("/plans") : go(step - 1)
              }
            >
              Back
            </Button>
            <Button onPress={step === 7 ? finish : next} icon="arrow">
              {step === 7
                ? supabase && !store.session
                  ? "Sign in to build"
                  : "Build my ladder"
                : "Continue"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}
