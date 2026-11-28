import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import { Card, Txt, Button, Notice } from "@/components/investing/ui";
import { supabase } from "@/lib/supabase";
export default function Callback() {
  const [status, setStatus] = useState("Checking the confirmation link…"),
    [failed, setFailed] = useState(false);
  const url = Linking.useLinkingURL();
  useEffect(() => {
    let active = true;
    async function process() {
      if (!supabase) {
        setStatus("Account services are not configured.");
        setFailed(true);
        return;
      }
      const initial = url ?? (await Linking.getInitialURL());
      if (!initial) {
        setStatus("No confirmation link was found. Request a fresh link.");
        setFailed(true);
        return;
      }
      const parsed = new URL(initial),
        query = parsed.searchParams,
        fragment = new URLSearchParams(parsed.hash.slice(1));
      const code = query.get("code");
      const recovery =
        query.get("type") === "recovery" || fragment.get("type") === "recovery";
      if (query.get("error") || fragment.get("error")) {
        setStatus("The link is invalid or has expired. Request a fresh link.");
        setFailed(true);
        return;
      }
      // Strip credentials immediately. Never render tokens or leave them in browser history.
      if (typeof window !== "undefined")
        window.history.replaceState({}, "", "/auth/callback");
      const response = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : fragment.get("access_token") && fragment.get("refresh_token")
          ? await supabase.auth.setSession({
              access_token: fragment.get("access_token")!,
              refresh_token: fragment.get("refresh_token")!,
            })
          : null;
      if (!active) return;
      if (!response || response.error) {
        setStatus(
          "This link could not be completed on this device. It may be expired, already used, or opened on a different device. Request a fresh link here.",
        );
        setFailed(true);
        return;
      }
      if (recovery) router.replace("/auth/reset-password");
      else {
        setStatus(
          "Your email link was confirmed. You can continue to your plan.",
        );
        router.replace("/settings");
      }
    }
    void process().catch(() => {
      if (active) {
        setStatus(
          "Could not validate this link. Check your connection and request a fresh link.",
        );
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <Shell title="One moment for your account.">
      <Card>
        <Txt>{status}</Txt>
        {failed && (
          <>
            <Notice>
              On another device? Restart the email flow on the device where you
              want to continue.
            </Notice>
            <Button onPress={() => router.replace("/auth/verify")}>
              Request a fresh verification link
            </Button>
            <Button
              secondary
              onPress={() => router.replace("/auth/forgot-password")}
            >
              Request password recovery
            </Button>
          </>
        )}
      </Card>
    </Shell>
  );
}
