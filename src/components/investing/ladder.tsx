import { useState } from "react";
import { Pressable, View } from "react-native";
import { money } from "@/domain/allocation/engine";
import type { Allocation, Result } from "@/domain/allocation/types";
import { C, Txt, Icon, kindColor, Badge, Notice } from "./ui";
const treatment = {
  roth: "ROTH · AFTER TAX",
  pretax: "PRE-TAX",
  hsa: "HSA · TAX ADVANTAGED",
  brokerage: "TAXABLE",
  education: "529 · EDUCATION",
  review: "CONDITIONAL · RESERVED",
};
export function LadderRow({
  row,
  index,
  next,
}: {
  row: Allocation;
  index: number;
  next: boolean;
}) {
  const [open, setOpen] = useState(false),
    color = kindColor[row.kind],
    funded = row.amount >= row.capacity;
  return (
    <View style={{ borderBottomWidth: 1, borderColor: C.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.title}, ${money(row.amount)}. Why this step?`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={({ hovered }) => ({
          flexDirection: "row",
          paddingVertical: 21,
          gap: 15,
          alignItems: "center",
          backgroundColor: hovered ? C.surface : "transparent",
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderWidth: 1,
            borderColor: `${color}60`,
            borderRadius: 50,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt size={12} color={color}>
            {String(index + 1).padStart(2, "0")}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt size={14} weight="500">
            {row.title}
          </Txt>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Txt size={10} color={C.muted}>
              {row.owner}
            </Txt>
            <Txt size={9} color={color}>
              {treatment[row.kind]}
            </Txt>
            {next && <Badge>Next dollar</Badge>}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Txt size={18} weight="500" style={{ fontVariant: ["tabular-nums"] }}>
            {money(row.amount)}
          </Txt>
          <Txt size={9} color={funded ? C.muted : C.green}>
            {row.kind === "review"
              ? "Review needed"
              : funded
                ? "Target allocated"
                : `${money(row.capacity - row.amount)} left`}
          </Txt>
        </View>
        <Icon name={open ? "down" : "chevron"} size={15} />
      </Pressable>
      {open && (
        <View style={{ gap: 12, paddingLeft: 51, paddingBottom: 22 }}>
          <Txt size={12} color={C.muted}>
            {row.reason}
          </Txt>
          <View style={{ height: 4, backgroundColor: C.line, borderRadius: 4 }}>
            <View
              style={{
                width: `${Math.min(100, row.capacity ? (row.amount / row.capacity) * 100 : 0)}%`,
                height: 4,
                backgroundColor: color,
                borderRadius: 4,
              }}
            />
          </View>
          <Txt size={11} color={C.muted}>
            This step: {money(row.amount)} of {money(row.capacity)} remaining
            capacity · Previously used: {money(row.existing)}
          </Txt>
          {row.employer > 0 && (
            <Txt size={11} color={C.green}>
              Additional employer match: {money(row.employer)} · outside your
              budget
            </Txt>
          )}
          <Txt size={11} color={C.muted}>
            Modeled tax: {money(row.taxBefore, 2)} → {money(row.taxAfter, 2)} ·
            Reduction: {money(row.taxBefore - row.taxAfter, 2)}
          </Txt>
        </View>
      )}
    </View>
  );
}
export function Ladder({ result }: { result: Result }) {
  return (
    <View>
      {result.errors.map((e) => (
        <Notice key={e} error>
          {e}
        </Notice>
      ))}
      {result.allocations.map((row, i) => (
        <LadderRow
          key={row.id}
          row={row}
          index={i}
          next={row.id === result.next?.id}
        />
      ))}
      {result.flexible > 0 && (
        <View style={{ paddingVertical: 20 }}>
          <Notice>
            {money(result.flexible)} remains flexible and unallocated after your
            targets.
          </Notice>
        </View>
      )}
    </View>
  );
}
