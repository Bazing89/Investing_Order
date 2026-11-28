import { cloneScenario } from "@/domain/scenarios/presets";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { router, Link } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Button,
  Card,
  Badge,
  SectionTitle,
  Notice,
  useWide,
} from "@/components/investing/ui";
import { Ladder } from "@/components/investing/ladder";
import { usePlans } from "@/features/plan-store";
import { calculate, money, rules } from "@/domain/allocation/engine";
export default function LadderScreen() {
  const store = usePlans(),
    s = store.active,
    r = useMemo(() => calculate(s), [s]),
    wide = useWide();
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Shell
      title={s.name}
      subtitle="Your investment ladder · 2026 contribution plan"
      action={
        <Button
          small
          secondary
          onPress={() => {
            store.start(s);
            router.push("/plans/builder");
          }}
        >
          {s.sample ? "Use as starting point" : "Edit inputs"}
        </Button>
      }
    >
      {s.sample && (
        <Notice>
          Fictional example · These values are not your personal financial
          profile.
        </Notice>
      )}
      <View style={{ flexDirection: wide ? "row" : "column", gap: 15 }}>
        {[
          { label: "Annual budget", value: money(s.budget) },
          { label: "Estimated federal reduction", value: money(r.savings, 2) },
          {
            label: "Marginal bracket",
            value: `${r.bracketBefore * 100}% → ${r.bracketAfter * 100}%`,
          },
          { label: "Flexible savings left", value: money(r.flexible) },
        ].map((item) => (
          <Card key={item.label} style={{ flex: 1 }}>
            <Txt size={11} color={C.muted}>
              {item.label}
            </Txt>
            <Txt size={27} color={C.green}>
              {item.value}
            </Txt>
          </Card>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button icon="check" onPress={() => router.push("/plans/checklist")}>
          Execution checklist
        </Button>
        <Button secondary onPress={() => router.push("/plans/compare")}>
          Compare a change
        </Button>
        <Button secondary onPress={() => router.push("/plans/tax-view")}>
          Explore tax impact
        </Button>
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 32 }}>
        <View style={{ flex: 2, gap: 14 }}>
          <SectionTitle
            title="A purpose for every dollar"
            subtitle="Tap a step to see its capacity, reasoning and tax arithmetic."
          />
          <Ladder result={r} />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 16 }}>
          <Card>
            <Txt size={18}>How it adds up</Txt>
            {[
              {
                label: "Your contributions",
                value: money(
                  r.allocations.reduce((sum, a) => sum + a.amount, 0),
                ),
              },
              { label: "Flexible savings", value: money(r.flexible) },
              { label: "Total budget", value: money(r.budget) },
              {
                label: "Employer match (additional)",
                value: money(r.employerMatch),
              },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 15,
                }}
              >
                <Txt size={11} color={C.muted}>
                  {item.label}
                </Txt>
                <Txt size={12}>{item.value}</Txt>
              </View>
            ))}
          </Card>
          <Card>
            <Badge color={C.amber}>ASSUMPTIONS & REVIEW</Badge>
            <Txt size={12} color={C.muted}>
              Federal ordinary income only. No credits, state taxes, AMT,
              capital-gain stacking, NIIT or IRMAA calculation.
            </Txt>
            <Txt size={12} color={C.muted}>
              Lower-bracket IRA sequencing and brokerage targets are product
              interpretations of Rao’s methodology.
            </Txt>
            {r.warnings.map((w) => (
              <Notice key={w}>{w}</Notice>
            ))}
            <Link href="/learn">
              <Txt size={12} color={C.green}>
                Methodology & sources ↗
              </Txt>
            </Link>
            <Txt size={10} color={C.muted}>
              {rules.version} · {rules.reviewStatus}
            </Txt>
          </Card>
        </View>
      </View>
      {!s.sample && (
        <Card>
          <Txt size={18}>Manage this plan</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              secondary
              onPress={() => {
                store.start({
                  ...cloneScenario(s),
                  id: `copy-${Date.now()}`,
                  name: `${s.name} · copy`,
                  builderStep: 0,
                });
                router.push("/plans/builder");
              }}
            >
              Duplicate as a draft
            </Button>
            <Button secondary onPress={() => setConfirmDelete(!confirmDelete)}>
              Delete this plan
            </Button>
          </View>
          {confirmDelete && (
            <>
              <Notice>
                Remove this plan and its checklist from this workspace? Existing
                exports and cloud snapshots are separate and will not be
                deleted.
              </Notice>
              <Button
                onPress={() => {
                  store.remove(s.id);
                  router.replace("/plans");
                }}
              >
                Confirm plan deletion
              </Button>
            </>
          )}
        </Card>
      )}
    </Shell>
  );
}
