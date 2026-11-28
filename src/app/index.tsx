import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { router, Link } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Icon,
  Button,
  Card,
  Badge,
  SectionTitle,
  AllocationChart,
  kindColor,
  useWide,
  Notice,
} from "@/components/investing/ui";
import { Ladder } from "@/components/investing/ladder";
import { usePlans } from "@/features/plan-store";
import { calculate, money } from "@/domain/allocation/engine";
export default function Home() {
  const store = usePlans(),
    s = store.active,
    r = useMemo(() => calculate(s), [s]),
    wide = useWide();
  const filled = r.allocations.filter((a) => a.amount > 0),
    next = r.next;
  function build() {
    store.start();
    router.push("/plans/builder");
  }
  return (
    <Shell
      title="Your next dollar, with direction."
      subtitle="A little intention today. More possibility tomorrow."
    >
      {s.sample && (
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderColor: C.line,
          }}
        >
          <Badge>EXPLORE MODE</Badge>
          <Txt size={11} color={C.muted} style={{ flex: 1 }}>
            You’re viewing a fictional example. Make a plan that’s yours.
          </Txt>
          <Pressable onPress={build} accessibilityRole="button">
            <Txt size={11} color={C.green}>
              Create my plan ↗
            </Txt>
          </Pressable>
        </View>
      )}
      <View style={{ flexDirection: wide ? "row" : "column", gap: 28 }}>
        <View style={{ flex: 1.8, gap: 22 }}>
          <View style={{ gap: 6 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Txt size={13} color={C.muted}>
                Your annual investing budget
              </Txt>
              <Icon name="info" size={13} />
            </View>
            <Txt
              size={wide ? 58 : 48}
              weight="400"
              style={{
                letterSpacing: -2.7,
                lineHeight: wide ? 70 : 60,
                fontVariant: ["tabular-nums"],
              }}
            >
              {money(Math.floor(s.budget))}
              <Txt size={wide ? 40 : 30} color="#566052">{`.${Math.round(
                (s.budget % 1) * 100,
              )
                .toString()
                .padStart(2, "0")}`}</Txt>
            </Txt>
            <View
              style={{ flexDirection: "row", gap: 7, alignItems: "center" }}
            >
              <Icon name="check" color={C.green} size={15} />
              <Txt size={12} color={C.green}>
                {money(s.budget - r.flexible)} given a purpose
              </Txt>
              <Txt size={11} color={C.muted}>
                · {s.year} contribution plan
              </Txt>
            </View>
          </View>
          <View style={{ paddingTop: 14, gap: 13 }}>
            <AllocationChart
              amounts={filled.map((a) => a.amount)}
              colors={filled.map((a) => kindColor[a.kind])}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {Array.from(new Set(filled.map((a) => a.kind))).map((kind) => (
                <View
                  key={kind}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      backgroundColor: kindColor[kind],
                    }}
                  />
                  <Txt size={10} color={C.muted}>
                    {kind === "pretax"
                      ? "Pre-tax"
                      : kind === "hsa"
                        ? "HSA"
                        : kind === "roth"
                          ? "Roth"
                          : kind === "review"
                            ? "IRA review"
                            : "Brokerage"}
                  </Txt>
                </View>
              ))}
            </View>
            <Txt size={9} color="#697669">
              Cumulative allocation by account priority · not investment
              performance
            </Txt>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              paddingTop: 10,
            }}
          >
            <Button
              onPress={() => {
                if (s.sample) {
                  store.start(s);
                  router.push("/plans/builder");
                } else router.push("/plans/ladder");
              }}
              icon="arrow"
            >
              {s.sample ? "Build my own plan" : "View my plan"}
            </Button>
            <Button secondary onPress={() => router.push("/plans/compare")}>
              Compare scenarios
            </Button>
          </View>
        </View>
        <Card
          style={{
            flex: wide ? 1 : undefined,
            backgroundColor: "#151C10",
            borderColor: "#34432A",
            padding: 25,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Badge>YOUR NEXT MOVE</Badge>
            <Icon name="up" color={C.green} size={22} />
          </View>
          <View style={{ gap: 8, paddingTop: 11 }}>
            <Txt size={25} weight="500" style={{ letterSpacing: -0.7 }}>
              {next ? next.title : "Every dollar has\na destination."}
            </Txt>
            <Txt size={12} color="#AFBAA5">
              {next
                ? `${money(next.capacity - next.amount)} of capacity remains in this step. Your next available dollar can start here.`
                : "Your budget is allocated across your priorities. Review each step before making contributions."}
            </Txt>
          </View>
          <View
            style={{ height: 1, backgroundColor: "#34432A", marginVertical: 4 }}
          />
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Icon name="shield" color={C.green} size={18} />
            <Txt size={11} color="#AFBAA5" style={{ flex: 1 }}>
              The order matters. Your tax bracket helps shape it.
            </Txt>
          </View>
          <Button
            secondary
            onPress={() => router.push("/plans/ladder")}
            icon="arrow"
            small
          >
            See the reasoning
          </Button>
        </Card>
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 13 }}>
        {[
          {
            label: "Estimated federal tax reduction",
            value: money(r.savings),
            sub: "Compared with no new allocations",
            color: C.green,
            icon: "chart",
          },
          {
            label: "Your marginal tax bracket",
            value: `${Math.round(r.bracketBefore * 100)}% → ${Math.round(r.bracketAfter * 100)}%`,
            sub: "Before and after your plan",
            color: C.text,
            icon: "layers",
          },
          {
            label: "Roth + HSA contributions",
            value: money(r.rothHsa),
            sub: "Planned dollars with tax advantages",
            color: C.text,
            icon: "shield",
          },
        ].map((item) => (
          <Card key={item.label} style={{ flex: 1, padding: 20, gap: 12 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt size={11} color={C.muted}>
                {item.label}
              </Txt>
              <Icon name={item.icon} size={16} />
            </View>
            <Txt
              size={28}
              weight="400"
              color={item.color}
              style={{ letterSpacing: -0.7 }}
            >
              {item.value}
            </Txt>
            <Txt size={10} color={C.muted}>
              {item.sub}
            </Txt>
          </Card>
        ))}
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 30 }}>
        <View style={{ flex: 1.8, gap: 10 }}>
          <SectionTitle
            title="Your investing order"
            subtitle="One step at a time. Every account has a reason."
            action={
              <Link href="/plans/ladder">
                <Txt size={11} color={C.green}>
                  View full plan ↗
                </Txt>
              </Link>
            }
          />
          <Ladder
            result={{
              ...r,
              allocations: r.allocations.slice(0, 4),
              flexible: 0,
            }}
          />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 20 }}>
          <Card style={{ gap: 16 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt size={15} weight="500">
                The plan behind the numbers
              </Txt>
              <Icon name="plans" size={19} />
            </View>
            {[
              {
                label: "Household",
                value:
                  s.filing === "single"
                    ? "Single filer"
                    : "Married filing jointly",
              },
              {
                label: "Annual income",
                value: money(
                  s.people.reduce((sum, p) => sum + p.wages, 0) + s.otherIncome,
                ),
              },
              {
                label: "Retirement tax outlook",
                value:
                  s.preference === "lower"
                    ? "Lower than today"
                    : s.preference === "same"
                      ? "Same or higher"
                      : "Uncertain",
              },
              {
                label: "Saving mode",
                value: store.local ? "On this device" : "This session",
              },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Txt size={11} color={C.muted}>
                  {item.label}
                </Txt>
                <Txt size={11}>{item.value}</Txt>
              </View>
            ))}
            <Pressable
              onPress={() => {
                store.start(s);
                router.push("/plans/builder");
              }}
              style={{ paddingTop: 10, borderTopWidth: 1, borderColor: C.line }}
            >
              <Txt size={11} color={C.green}>
                Adjust your inputs →
              </Txt>
            </Pressable>
          </Card>
          <Notice>
            These are planning estimates, not executed contributions. Check
            eligibility, payroll timing and your full tax picture before acting.
          </Notice>
        </View>
      </View>
    </Shell>
  );
}
