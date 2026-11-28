import { useMemo, useState } from "react";
import { View } from "react-native";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Button,
  Field,
  Choices,
  Notice,
  Badge,
  useWide,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { calculate, money } from "@/domain/allocation/engine";
import type { Scenario } from "@/domain/allocation/types";
export default function Compare() {
  const store = usePlans(),
    base = store.active,
    wide = useWide();
  const [income, setIncome] = useState(String(base.people[0].wages)),
    [budget, setBudget] = useState(String(base.budget)),
    [preference, setPreference] = useState(base.preference),
    [saved, setSaved] = useState(false);
  const changed: Scenario = useMemo(
    () => ({
      ...base,
      people: base.people.map((p, i) =>
        i === 0 ? { ...p, wages: Number(income) } : p,
      ),
      budget: Number(budget),
      preference,
    }),
    [base, income, budget, preference],
  );
  const original = calculate(base),
    result = calculate(changed);
  function reset() {
    setIncome(String(base.people[0].wages));
    setBudget(String(base.budget));
    setPreference(base.preference);
    setSaved(false);
  }
  return (
    <Shell
      title="A different move. A clearer view."
      subtitle="Change a few assumptions and see what shifts. Your original stays intact."
    >
      <View style={{ flexDirection: wide ? "row" : "column", gap: 22 }}>
        <Card style={{ flex: 1 }}>
          <Badge>WHAT IF?</Badge>
          <Field
            label={`${base.people[0].name}: gross wages`}
            numeric
            prefix="$"
            value={income}
            onChange={(v) => {
              setIncome(v);
              setSaved(false);
            }}
          />
          <Field
            label="Remaining annual budget"
            numeric
            prefix="$"
            value={budget}
            onChange={(v) => {
              setBudget(v);
              setSaved(false);
            }}
          />
          <Choices
            label="Retirement tax rate"
            value={preference}
            options={[
              { label: "Lower", value: "lower" },
              { label: "Same or higher", value: "same" },
              { label: "Uncertain", value: "uncertain" },
            ]}
            onChange={(v) => {
              setPreference(v);
              setSaved(false);
            }}
          />
          <Button secondary onPress={reset}>
            Reset changes
          </Button>
        </Card>
        <Card style={{ flex: 2 }}>
          <Txt size={20}>{base.name}</Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Txt style={{ flex: 1 }} size={11} color={C.muted}>
              2026.1-preview
            </Txt>
            <Txt style={{ flex: 1 }} size={12}>
              Original
            </Txt>
            <Txt style={{ flex: 1 }} size={12} color={C.green}>
              What if
            </Txt>
          </View>
          {[
            {
              label: "Annual budget",
              a: money(original.budget),
              b: money(result.budget),
            },
            {
              label: "Tax reduction",
              a: money(original.savings),
              b: money(result.savings),
            },
            {
              label: "Marginal bracket",
              a: `${Math.round(original.bracketAfter * 100)}%`,
              b: `${Math.round(result.bracketAfter * 100)}%`,
            },
            {
              label: "Roth + HSA",
              a: money(original.rothHsa),
              b: money(result.rothHsa),
            },
            {
              label: "Flexible savings",
              a: money(original.flexible),
              b: money(result.flexible),
            },
          ].map((row) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                gap: 10,
                paddingVertical: 15,
                borderTopWidth: 1,
                borderColor: C.line,
              }}
            >
              <Txt style={{ flex: 1 }} size={12} color={C.muted}>
                {row.label}
              </Txt>
              <Txt style={{ flex: 1 }} size={16}>
                {row.a}
              </Txt>
              <Txt style={{ flex: 1 }} size={16} color={C.green}>
                {row.b}
              </Txt>
            </View>
          ))}
          {result.errors.map((e) => (
            <Notice key={e} error>
              {e}
            </Notice>
          ))}
          {!result.errors.length && (
            <Notice>
              {money(result.savings - original.savings)} change in modeled
              federal tax reduction. No return forecasts are included.
            </Notice>
          )}
        </Card>
      </View>
      <Card>
        <Txt size={20}>Where the dollars move</Txt>
        {Array.from(
          new Set(
            [...original.allocations, ...result.allocations].map((a) => a.id),
          ),
        ).map((id) => {
          const a = original.allocations.find((x) => x.id === id),
            b = result.allocations.find((x) => x.id === id);
          return (
            <View
              key={id}
              style={{
                flexDirection: "row",
                gap: 15,
                borderBottomWidth: 1,
                borderColor: C.line,
                paddingVertical: 10,
              }}
            >
              <Txt size={12} style={{ flex: 1 }}>
                {b?.title ?? a?.title} · {b?.owner ?? a?.owner}
              </Txt>
              <Txt size={12} color={C.muted}>
                {money(a?.amount ?? 0)}
              </Txt>
              <Txt size={12} color={C.green}>
                → {money(b?.amount ?? 0)}
              </Txt>
            </View>
          );
        })}
      </Card>
      <Button
        disabled={!!result.errors.length || saved}
        onPress={() => {
          const copy = {
            ...changed,
            id: `comparison-${Date.now()}`,
            name: `${base.name} · what if`,
            sample: false,
          };
          store.start(copy);
          setSaved(true);
        }}
      >
        {saved
          ? "Comparison copied to a draft in Plans"
          : "Keep this comparison as a draft"}
      </Button>
    </Shell>
  );
}
