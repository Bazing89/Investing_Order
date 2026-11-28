import { Host, Switch } from "@expo/ui";
import { type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  TextInput,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
export const C = {
  bg: "#090B0A",
  surface: "#111512",
  raised: "#191E1A",
  line: "#293029",
  text: "#F1F4EF",
  muted: "#929D93",
  green: "#C3F85C",
  teal: "#72D6BA",
  blue: "#9AB6E7",
  purple: "#C8AEF2",
  amber: "#ECC885",
};
export const kindColor = {
  roth: C.green,
  pretax: C.blue,
  hsa: C.teal,
  brokerage: "#A3AEA4",
  education: C.purple,
  review: C.amber,
};
export function Txt({
  children,
  size = 14,
  color = C.text,
  weight = "400",
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  weight?: TextStyle["fontWeight"];
  style?: TextStyle;
}) {
  return (
    <Text
      selectable
      style={{
        fontSize: size,
        lineHeight: size * 1.45,
        color,
        fontWeight: weight,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 21,
  color = C.muted,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const paths: Record<string, string> = {
    home: "M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10",
    plans: "M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5",
    learn: "M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15",
    settings: "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
    arrow: "M5 12h14M13 6l6 6-6 6",
    up: "M5 17 17 5M5 5h12v12",
    chevron: "m9 5 7 7-7 7",
    down: "m6 9 6 6 6-6",
    plus: "M12 5v14M5 12h14",
    check: "m5 12 4 4L19 6",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6zM8 12l3 3 5-6",
    external: "M14 3h7v7M21 3 10 14M10 3H3v18h18v-7",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    layers: "m3 7 9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4",
    chart: "M3 20h18M6 16v-5m6 5V7m6 9V3",
    clock: "M12 7v5l3 2",
    back: "M19 12H5m6-6-6 6 6 6",
    close: "m6 6 12 12M18 6 6 18",
    info: "M12 11v6M12 7v.1",
    mail: "M3 5h18v14H3zM3 5l9 8 9-8",
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {["clock", "info"].includes(name) && <Circle cx="12" cy="12" r="9" />}
      {name === "settings" && <Circle cx="12" cy="12" r="3" />}
      <Path d={paths[name] ?? paths.layers} />
    </Svg>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  icon,
  disabled = false,
  small = false,
}: {
  children: ReactNode;
  onPress: () => void;
  secondary?: boolean;
  icon?: string;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => ({
        minHeight: small ? 40 : 49,
        paddingHorizontal: small ? 16 : 23,
        paddingVertical: 11,
        borderRadius: 30,
        backgroundColor: secondary
          ? hovered
            ? C.raised
            : "transparent"
          : C.green,
        borderWidth: secondary ? 1 : 0,
        borderColor: C.line,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Txt size={13} weight="600" color={secondary ? C.text : C.bg}>
        {children}
      </Txt>
      {!!icon && (
        <Icon name={icon} size={17} color={secondary ? C.text : C.bg} />
      )}
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 16,
        padding: 23,
        gap: 16,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
export function Badge({
  children,
  color = C.green,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: `${color}12`,
        alignSelf: "flex-start",
      }}
    >
      <Txt size={10} color={color} weight="600">
        {children}
      </Txt>
    </View>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 5 }}>
        <Txt size={22} weight="500" style={{ letterSpacing: -0.6 }}>
          {title}
        </Txt>
        {!!subtitle && (
          <Txt size={12} color={C.muted}>
            {subtitle}
          </Txt>
        )}
      </View>
      {action}
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={{
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: error ? "#785344" : C.line,
        flexDirection: "row",
        gap: 10,
      }}
    >
      <Icon name="info" size={18} color={error ? C.amber : C.muted} />
      <View style={{ flex: 1 }}>
        <Txt size={12} color={error ? C.amber : C.muted}>
          {children}
        </Txt>
      </View>
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  hint,
  numeric = false,
  secure = false,
  prefix,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  numeric?: boolean;
  secure?: boolean;
  prefix?: string;
  autoComplete?: "email" | "current-password" | "new-password";
}) {
  return (
    <View style={{ gap: 8 }}>
      <Txt size={13} weight="500">
        {label}
      </Txt>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 15,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: C.line,
          backgroundColor: C.bg,
        }}
      >
        {!!prefix && <Txt color={C.muted}>{prefix}</Txt>}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          keyboardType={
            numeric
              ? "decimal-pad"
              : autoComplete === "email"
                ? "email-address"
                : "default"
          }
          autoCapitalize="none"
          autoComplete={autoComplete}
          secureTextEntry={secure}
          placeholderTextColor={C.muted}
          style={{
            flex: 1,
            color: C.text,
            padding: 14,
            fontSize: 16,
            minHeight: 49,
          }}
        />
      </View>
      {!!hint && (
        <Txt size={11} color={C.muted}>
          {hint}
        </Txt>
      )}
    </View>
  );
}
export function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Txt size={13} weight="500">
        {label}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 15,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: value === o.value ? "#26341B" : C.bg,
              borderWidth: 1,
              borderColor: value === o.value ? C.green : C.line,
            }}
          >
            <Txt size={12} color={value === o.value ? C.green : C.muted}>
              {o.label}
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Host
        colorScheme="dark"
        seedColor={C.green}
        matchContents={{ vertical: true }}
        style={{ width: "100%", minHeight: 44 }}
      >
        <Switch value={value} onValueChange={onChange} label={label} />
      </Host>
      {!!hint && (
        <Txt size={11} color={C.muted}>
          {hint}
        </Txt>
      )}
    </View>
  );
}
export function useWide() {
  return useWindowDimensions().width >= 1050;
}
export function AllocationChart({
  amounts,
  colors,
}: {
  amounts: number[];
  colors: string[];
}) {
  const total = amounts.reduce((a, b) => a + b, 0) || 1;
  const coords = amounts.map((a, i) => {
    const width = (a / total) * 600;
    const x =
      (amounts.slice(0, i).reduce((sum, value) => sum + value, 0) / total) *
      600;
    const point = {
      x,
      y: 140 - ((x + width) / 600) * 115,
      width,
      color: colors[i],
    };
    return point;
  });
  return (
    <Svg
      width="100%"
      height={150}
      viewBox="0 0 600 160"
      preserveAspectRatio="none"
      accessibilityLabel="Cumulative allocation across account priorities. This is an allocation diagram, not investment performance."
    >
      {[30, 70, 110, 150].map((y) => (
        <Line
          key={y}
          x1="0"
          x2="600"
          y1={y}
          y2={y}
          stroke={C.line}
          strokeDasharray="3 6"
        />
      ))}
      {coords.map((p, i) => (
        <Rect
          key={i}
          x={p.x + 2}
          y={p.y}
          width={Math.max(0, p.width - 4)}
          height={150 - p.y}
          fill={p.color}
          opacity={0.1}
        />
      ))}
      <Path
        d={`M0 150 ${coords.map((p) => `L${p.x} ${150 - ((p.x + p.width) / 600) * 125} L${p.x + p.width} ${150 - ((p.x + p.width) / 600) * 125}`).join(" ")}`}
        stroke={C.green}
        strokeWidth={2.5}
        fill="none"
      />
      {coords.length > 0 && <Circle cx="598" cy="25" r="4" fill={C.green} />}
    </Svg>
  );
}
