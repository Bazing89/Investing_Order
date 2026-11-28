import { Link, usePathname, router } from "expo-router";
import { type ReactNode } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Txt, Icon, Button, Notice, useWide } from "./ui";
import { usePlans } from "@/features/plan-store";
const nav = [
  { label: "Overview", mobile: "Home", href: "/", icon: "home" },
  { label: "My plans", mobile: "Plans", href: "/plans", icon: "plans" },
  { label: "Learn", mobile: "Learn", href: "/learn", icon: "learn" },
  {
    label: "Settings",
    mobile: "Settings",
    href: "/settings",
    icon: "settings",
  },
] as const;
export function Shell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const wide = useWide(),
    pathname = usePathname(),
    insets = useSafeAreaInsets(),
    store = usePlans();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        flexDirection: "row",
        paddingTop: insets.top,
      }}
    >
      {wide && (
        <View
          style={{
            width: 232,
            borderRightWidth: 1,
            borderColor: C.line,
            padding: 28,
            paddingTop: 39,
            gap: 48,
          }}
        >
          <Link href="/" accessibilityLabel="Investing Order home">
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <View style={{ transform: [{ rotate: "-15deg" }] }}>
                <Icon name="layers" color={C.green} size={31} />
              </View>
              <View>
                <Txt weight="600" size={19} style={{ letterSpacing: -0.8 }}>
                  investing order<Txt color={C.green}>.</Txt>
                </Txt>
                <Txt size={9} color={C.muted} style={{ letterSpacing: 1.3 }}>
                  BY RAO’S RENDEZVOUS
                </Txt>
              </View>
            </View>
          </Link>
          <View style={{ gap: 9 }}>
            {nav.map((item) => {
              const selected =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} asChild>
                  <Pressable
                    style={({ hovered }) => ({
                      padding: 14,
                      gap: 13,
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 8,
                      backgroundColor: selected
                        ? "#1B2514"
                        : hovered
                          ? C.surface
                          : "transparent",
                    })}
                  >
                    <Icon
                      name={item.icon}
                      color={selected ? C.green : C.muted}
                    />
                    <Txt
                      size={13}
                      weight={selected ? "600" : "400"}
                      color={selected ? C.green : C.muted}
                    >
                      {item.label}
                    </Txt>
                  </Pressable>
                </Link>
              );
            })}
          </View>
          <View
            style={{
              gap: 15,
              padding: 17,
              backgroundColor: C.surface,
              borderRadius: 10,
            }}
          >
            <Icon name="chart" color={C.green} />
            <Txt weight="500">A plan for every dollar.</Txt>
            <Txt size={11} color={C.muted}>
              Your tax bracket is a starting point. Your next move is personal.
            </Txt>
            <Link href="/learn">
              <Txt size={11} color={C.green}>
                Meet the methodology ↗
              </Txt>
            </Link>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ gap: 12, paddingBottom: 20 }}>
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <Icon name="shield" size={15} color={C.muted} />
              <Txt size={10} color={C.muted}>
                {store.status}
              </Txt>
            </View>
            <View style={{ height: 1, backgroundColor: C.line }} />
            <Pressable
              onPress={() => router.push("/settings")}
              style={{ flexDirection: "row", gap: 11, alignItems: "center" }}
            >
              <View
                style={{
                  width: 33,
                  height: 33,
                  backgroundColor: "#283222",
                  borderRadius: 30,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Txt color={C.green} size={12}>
                  IO
                </Txt>
              </View>
              <View>
                <Txt size={12}>
                  {store.session ? "Your account" : "Your workspace"}
                </Txt>
                <Txt size={10} color={C.muted}>
                  {store.session ? "Signed in" : "Local preview"}
                </Txt>
              </View>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: wide ? 43 : 21,
            paddingTop: wide ? 37 : 22,
            paddingBottom: wide ? 30 : 104,
            gap: 29,
            maxWidth: 1450,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {!wide && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Icon name="layers" color={C.green} size={23} />
              <Txt size={16} weight="600">
                investing order<Txt color={C.green}>.</Txt>
              </Txt>
              <View style={{ flex: 1 }} />
              <Txt size={10} color={C.muted}>
                2026 · PREVIEW
              </Txt>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 5, flex: 1 }}>
              <Txt
                size={wide ? 28 : 25}
                weight="500"
                style={{ letterSpacing: -0.9 }}
              >
                {title}
              </Txt>
              {!!subtitle && (
                <Txt size={12} color={C.muted}>
                  {subtitle}
                </Txt>
              )}
            </View>
            {action ??
              (wide && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.line,
                    borderRadius: 7,
                    padding: 11,
                  }}
                >
                  <Icon name="clock" size={14} />
                  <Txt size={11}>Tax year 2026</Txt>
                  <Icon name="down" size={12} />
                </View>
              ))}
          </View>
          {!!store.error && (
            <View style={{ gap: 10 }}>
              <Notice error>{store.error}</Notice>
              <Button secondary small onPress={store.retry}>
                Retry loading
              </Button>
            </View>
          )}
          {store.loading ? (
            <ActivityIndicator
              color={C.green}
              accessibilityLabel="Loading saved plans"
            />
          ) : (
            children
          )}
          <View
            style={{
              borderTopWidth: 1,
              borderColor: C.line,
              paddingTop: 18,
              gap: 5,
            }}
          >
            <Txt size={10} color={C.muted}>
              Built for clarity. Designed for your next move.
            </Txt>
            <Txt size={10} color={C.muted}>
              Educational planning only · Federal ordinary income model · Rules
              2026.1-preview · Independent tax review pending
            </Txt>
          </View>
        </ScrollView>
        {!wide && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: C.bg,
              borderTopWidth: 1,
              borderColor: C.line,
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 12,
              flexDirection: "row",
            }}
          >
            {nav.map((item) => {
              const selected =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} asChild>
                  <Pressable
                    accessibilityLabel={item.mobile}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 5,
                      minHeight: 42,
                    }}
                  >
                    <Icon
                      name={item.icon}
                      color={selected ? C.green : C.muted}
                    />
                    <Txt size={10} color={selected ? C.green : C.muted}>
                      {item.mobile}
                    </Txt>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
