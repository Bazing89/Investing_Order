import { useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Icon,
  Card,
  Button,
  Notice,
  Badge,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { calculate, money } from "@/domain/allocation/engine";
import { exportCsv, exportPdf } from "@/lib/export";
export default function Checklist() {
  const store = usePlans(),
    s = store.active,
    r = calculate(s),
    rows = r.allocations.filter((a) => a.amount > 0);
  const [preview, setPreview] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const completed = rows.filter((a) => store.checks[`${s.id}:${a.id}`]).length;
  async function send(format: "csv" | "pdf") {
    setError("");
    setBusy(true);
    try {
      await (format === "csv" ? exportCsv(s) : exportPdf(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Turn your plan into next steps."
      subtitle="A checklist for review and execution. Nothing is contributed automatically."
      action={
        <Button small secondary onPress={() => router.push("/plans/ladder")}>
          Back to ladder
        </Button>
      }
    >
      <Card>
        <Badge>{s.sample ? "FICTIONAL EXAMPLE" : s.name.toUpperCase()}</Badge>
        <Txt size={28}>
          {completed} of {rows.length} steps reviewed
        </Txt>
        <View style={{ height: 5, borderRadius: 8, backgroundColor: C.line }}>
          <View
            style={{
              height: 5,
              width: `${rows.length ? (completed / rows.length) * 100 : 0}%`,
              backgroundColor: C.green,
              borderRadius: 8,
            }}
          />
        </View>
        <Txt size={11} color={C.muted}>
          Checking a step records your review in this app. Confirm actual
          contributions with your provider.
        </Txt>
      </Card>
      {rows.map((a) => {
        const key = `${s.id}:${a.id}`,
          checked = !!store.checks[key];
        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={`Reviewed ${a.title} for ${a.owner}`}
            key={a.id}
            onPress={() => store.toggle(key)}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 15,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: checked ? C.green : C.muted,
                  backgroundColor: checked ? C.green : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checked && <Icon name="check" color={C.bg} size={18} />}
              </View>
              <View style={{ flex: 1, gap: 7 }}>
                <Txt size={17}>{a.title}</Txt>
                <Txt size={12} color={C.green}>
                  {a.owner} · {money(a.amount)}
                </Txt>
                <Txt size={12} color={C.muted}>
                  {a.reason}
                </Txt>
              </View>
            </Card>
          </Pressable>
        );
      })}
      {!rows.length && (
        <Notice>
          No contributions are allocated with this budget. View the ladder for
          the next available target.
        </Notice>
      )}
      <Card>
        <Txt size={22}>Take the plan with you.</Txt>
        <Txt size={12} color={C.muted}>
          Your export includes amounts, assumptions, conditional steps and
          sources. Files contain financial information.
        </Txt>
        <Button secondary onPress={() => setPreview(!preview)}>
          {preview ? "Close export preview" : "Preview export"}
        </Button>
        {preview && (
          <View style={{ gap: 13 }}>
            <Txt size={16}>{s.name} · 2026</Txt>
            {rows.map((a) => (
              <Txt size={12} key={a.id}>
                □ {a.owner} · {a.title}: {money(a.amount)}
              </Txt>
            ))}
            <Txt size={12}>
              Total: {money(r.budget - r.flexible)} · Flexible:{" "}
              {money(r.flexible)}
            </Txt>
            <Notice>
              Rules 2026.1-preview · Educational use · Independent tax review
              pending. Export works from your current session even if cloud
              saving fails.
            </Notice>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Button
                disabled={busy}
                icon="download"
                onPress={() => {
                  void send("csv");
                }}
              >
                Download CSV
              </Button>
              <Button
                disabled={busy}
                secondary
                onPress={() => {
                  void send("pdf");
                }}
              >
                Print / Save PDF
              </Button>
            </View>
          </View>
        )}
        {!!error && <Notice error>{error}</Notice>}
      </Card>
    </Shell>
  );
}
