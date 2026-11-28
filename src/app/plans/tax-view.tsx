import { View } from "react-native";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  SectionTitle,
  Notice,
  kindColor,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { calculate, money, rules } from "@/domain/allocation/engine";
export default function TaxView() {
  const s = usePlans().active,
    r = calculate(s),
    max = Math.max(1, r.baselineIncome);
  return (
    <Shell
      title="The tax picture, made clearer."
      subtitle="See the difference between your next-dollar rate and your total tax."
    >
      <Card>
        <SectionTitle
          title="Ordinary taxable income"
          subtitle="Gross wages + supported income − modeled deductions"
        />
        {[
          {
            label: "Before new allocations",
            value: r.baselineIncome,
            color: C.muted,
          },
          { label: "After your plan", value: r.proposedIncome, color: C.green },
        ].map((item) => (
          <View key={item.label} style={{ gap: 9 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt size={12} color={C.muted}>
                {item.label}
              </Txt>
              <Txt size={18}>{money(item.value)}</Txt>
            </View>
            <View
              style={{ height: 24, borderRadius: 4, backgroundColor: C.raised }}
            >
              <View
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                  height: 24,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        ))}
        <Txt size={14} color={C.green}>
          {money(r.baselineIncome - r.proposedIncome)} less modeled taxable
          income · {money(r.savings, 2)} estimated tax reduction
        </Txt>
      </Card>
      <Card>
        <SectionTitle
          title="Every slice has its own rate"
          subtitle="Your marginal bracket applies to the next taxable dollar, not all of your income."
        />
        {[0, ...rules[s.filing].thresholds].map((start, i) => {
          const end = rules[s.filing].thresholds[i] ?? Infinity,
            slice = Math.max(0, Math.min(r.proposedIncome, end) - start);
          return (
            <View
              key={start}
              style={{
                flexDirection: "row",
                gap: 15,
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderColor: C.line,
              }}
            >
              <Txt size={12} color={slice ? C.green : C.muted}>
                {rules.rates[i] * 100}%
              </Txt>
              <Txt size={12} color={C.muted} style={{ flex: 1 }}>
                {money(start)} – {end === Infinity ? "and above" : money(end)}
              </Txt>
              <Txt size={12}>{money(slice)} in this bracket</Txt>
            </View>
          );
        })}
      </Card>
      <Card>
        <SectionTitle title="IRA eligibility is a separate calculation" />
        <Txt size={24}>{money(r.magi)} modeled Roth IRA MAGI</Txt>
        <Txt size={12} color={C.muted}>
          The direct Roth phaseout band is{" "}
          {money(rules[s.filing].rothPhaseout[0])}–
          {money(rules[s.filing].rothPhaseout[1])} for{" "}
          {s.filing === "single" ? "Single" : "MFJ"}. This uses MAGI, not
          taxable income after the standard deduction.
        </Txt>
      </Card>
      <Card>
        <SectionTitle title="Tax savings by allocation" />
        {r.allocations
          .filter((a) => a.taxBefore > a.taxAfter)
          .map((a) => (
            <View
              key={a.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Txt size={12} color={kindColor[a.kind]}>
                {a.title} · {a.owner}
              </Txt>
              <Txt size={12}>{money(a.taxBefore - a.taxAfter, 2)}</Txt>
            </View>
          ))}
        <Txt size={16}>Total: {money(r.savings, 2)}</Txt>
      </Card>
      <Notice>
        This is a limited federal ordinary income model, not a complete tax
        return. Preferential income, deductions that depend on AGI, credits,
        AMT, NIIT and Medicare costs need separate review.
      </Notice>
    </Shell>
  );
}
