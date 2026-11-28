import { useState } from "react";
import { View, Pressable, Linking } from "react-native";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Badge,
  Icon,
  SectionTitle,
  Notice,
  useWide,
} from "@/components/investing/ui";
import { rules } from "@/domain/allocation/engine";
const lessons = [
  {
    title: "Your tax bracket is a starting point.",
    tag: "THE BIG IDEA",
    body: "A marginal rate is the tax on your next taxable dollar. Your effective rate is the average across all taxable dollars. A pre-tax contribution can remove dollars from your highest current bracket, but later withdrawals may be taxable. Roth dollars are taxed now, with qualified withdrawals tax-free.",
  },
  {
    title: "First, capture the match.",
    tag: "01 · WORKPLACE",
    body: "Start with employee contributions needed to receive your employer’s match. Employer matching dollars are additional and do not consume your entered savings budget. Verify eligible salary, vesting, payroll timing and whether your plan offers a year-end true-up.",
  },
  {
    title: "The HSA has a special place.",
    tag: "02 · HEALTH",
    body: "An HSA can combine deductible contributions with tax-free qualified medical withdrawals. Eligibility matters: coverage, Medicare enrollment, other insurance, annual contribution history and who owns the HSA can all change your room. Family coverage has one shared base limit.",
  },
  {
    title: "Roth or pre-tax? It depends.",
    tag: "03 · THE PIVOT",
    body: "The lower brackets generally favor Roth in Rao’s methodology. The middle brackets reserve eligible Roth IRA room before additional workplace contributions. Higher brackets generally prioritize pre-tax workplace room. The model recalculates marginal rates as deductions accumulate. Future retirement rates are a personal assumption, not a forecast.",
  },
  {
    title: "An IRA strategy is not an extra limit.",
    tag: "04 · ELIGIBILITY",
    body: "Traditional and Roth IRA contributions share an annual limit. Direct Roth eligibility phases out with modified adjusted gross income. A backdoor contribution and conversion can involve pro-rata taxation based on all relevant IRA balances and basis. The app reserves conditional dollars for review instead of claiming a tax-free conversion.",
  },
  {
    title: "Flexibility before education.",
    tag: "05 · YOUR GOALS",
    body: "After retirement priorities, choose a brokerage target before funding a 529 goal. Brokerage has no statutory annual contribution limit; your target is a planning choice. Once both goals are met, excess funds remain flexible and unallocated. State 529 benefits and gift-tax rules need separate review.",
  },
];
export default function Learn() {
  const [open, setOpen] = useState<number | null>(0),
    wide = useWide();
  return (
    <Shell
      title="Know the why behind the next move."
      subtitle="A little understanding goes a long way."
    >
      <Card
        style={{
          backgroundColor: "#172010",
          borderColor: "#34432A",
          padding: wide ? 35 : 24,
        }}
      >
        <Badge>THE RAO’S RENDEZVOUS METHODOLOGY</Badge>
        <Txt size={wide ? 39 : 29} style={{ letterSpacing: -1, maxWidth: 650 }}>
          Your tax bracket is the order of operations.
        </Txt>
        <Txt size={13} color={C.muted} style={{ maxWidth: 600 }}>
          A practical framework for deciding which account gets your next
          dollar. Built around your household, your eligibility and the taxes on
          that dollar.
        </Txt>
        <Pressable
          onPress={() => {
            void Linking.openURL(
              "https://raosrendezvous.substack.com/p/your-tax-bracket-is-the-order-of?r=778881",
            );
          }}
        >
          <Txt size={12} color={C.green}>
            Read the original article ↗
          </Txt>
        </Pressable>
      </Card>
      <SectionTitle
        title="Build your investing intuition"
        subtitle="Open a lesson to see how the framework works."
      />
      {lessons.map((lesson, i) => (
        <Pressable
          key={lesson.tag}
          accessibilityRole="button"
          accessibilityState={{ expanded: open === i }}
          onPress={() => setOpen(open === i ? null : i)}
        >
          <Card>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Badge color={i === 2 ? C.teal : C.green}>{lesson.tag}</Badge>
              <Icon name={open === i ? "down" : "plus"} />
            </View>
            <Txt size={23}>{lesson.title}</Txt>
            {open === i && (
              <Txt size={14} color={C.muted}>
                {lesson.body}
              </Txt>
            )}
          </Card>
        </Pressable>
      ))}
      <SectionTitle
        title="The rules behind the math"
        subtitle={`Tax year 2026 · Source-checked November 27, 2026 · ${rules.version}`}
      />
      <Card>
        {rules.sources.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => {
              void Linking.openURL(source.url);
            }}
            style={{
              paddingVertical: 9,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Txt size={12} style={{ flex: 1 }}>
              {source.title}
            </Txt>
            <Icon name="external" size={16} color={C.green} />
          </Pressable>
        ))}
      </Card>
      <Notice>
        Independent tax review is pending. This model covers W-2 Single and MFJ
        households and federal ordinary income only. It does not calculate state
        taxes, credits, AMT, preferential income, NIIT or IRMAA. Conversion
        simulators and insurance illustrations are outside this release.
      </Notice>
    </Shell>
  );
}
