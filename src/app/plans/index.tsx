import { useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Button,
  Badge,
  SectionTitle,
  Icon,
  useWide,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { presets } from "@/domain/scenarios/presets";
import { calculate, money } from "@/domain/allocation/engine";
export default function Plans() {
  const store = usePlans(),
    wide = useWide();
  const [discard, setDiscard] = useState(false);
  return (
    <Shell
      title="Room for your next chapter."
      subtitle="Build, revisit and compare your annual investing plans."
      action={
        <Button
          small
          icon="plus"
          onPress={() => {
            store.start();
            router.push("/plans/builder");
          }}
        >
          New plan
        </Button>
      }
    >
      {store.draft && (
        <Card>
          <Badge>DRAFT IN PROGRESS</Badge>
          <Txt size={20}>{store.draft.name}</Txt>
          <Txt color={C.muted} size={12}>
            Your inputs are kept while you explore. Pick up where you left off.
          </Txt>
          <Button
            secondary
            onPress={() => router.push("/plans/builder")}
            icon="arrow"
          >
            Resume draft
          </Button>
          <Button secondary onPress={() => setDiscard(!discard)}>
            Discard draft
          </Button>
          {discard && (
            <>
              <Txt size={12} color={C.muted}>
                Discard the current draft? Saved completed plans stay available.
              </Txt>
              <Button
                secondary
                onPress={() => {
                  store.clearDraft();
                  setDiscard(false);
                }}
              >
                Confirm discard
              </Button>
            </>
          )}
        </Card>
      )}
      <SectionTitle
        title="My plans"
        subtitle={`${store.plans.length} personal ${store.plans.length === 1 ? "plan" : "plans"} · Tax year 2026`}
      />
      {!store.plans.length ? (
        <Card style={{ padding: 35, alignItems: "center" }}>
          <Icon name="plans" size={34} color={C.green} />
          <Txt size={21}>A clear next move starts here.</Txt>
          <Txt color={C.muted} size={12}>
            Answer a few questions. Give your next dollar a direction.
          </Txt>
          <Button
            onPress={() => {
              store.start();
              router.push("/plans/builder");
            }}
          >
            Create my first plan
          </Button>
        </Card>
      ) : (
        store.plans.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => {
              store.select(s.id);
              router.push("/plans/ladder");
            }}
          >
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Badge>2026 · PERSONAL PLAN</Badge>
                <Icon name="arrow" />
              </View>
              <Txt size={24}>{s.name}</Txt>
              <View style={{ flexDirection: "row", gap: 30 }}>
                <View>
                  <Txt size={11} color={C.muted}>
                    Annual budget
                  </Txt>
                  <Txt size={22}>{money(s.budget)}</Txt>
                </View>
                <View>
                  <Txt size={11} color={C.muted}>
                    Modeled tax reduction
                  </Txt>
                  <Txt size={22} color={C.green}>
                    {money(calculate(s).savings)}
                  </Txt>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
      <SectionTitle
        title="A little inspiration"
        subtitle="Explore fictional households. Your own plan starts with your own inputs."
      />
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {presets.map((s, i) => (
          <Pressable
            key={s.id}
            onPress={() => {
              store.select(s.id);
              router.push("/plans/ladder");
            }}
            style={{
              flex: wide ? 1 : undefined,
              minWidth: wide ? 200 : undefined,
            }}
          >
            <Card style={{ height: "100%" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Txt size={12} color={C.green}>
                  0{i + 1}
                </Txt>
                <Icon name="up" size={19} />
              </View>
              <Txt size={19} weight="500">
                {s.name}
              </Txt>
              <Txt color={C.muted} size={12}>
                {s.filing === "joint"
                  ? "A household"
                  : `Age ${s.people[0].age}`}{" "}
                · {money(s.people.reduce((a, p) => a + p.wages, 0))} income
              </Txt>
              <Txt size={25}>{money(s.budget)}</Txt>
              <Txt size={10} color={C.muted}>
                Annual budget · fictional sample
              </Txt>
            </Card>
          </Pressable>
        ))}
      </View>
    </Shell>
  );
}
