import { useState } from "react";
import { router, useLocalSearchParams, Link } from "expo-router";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Field,
  Button,
  Toggle,
  Notice,
  Badge,
} from "@/components/investing/ui";
import { supabase } from "@/lib/supabase";
import { usePlans } from "@/features/plan-store";
export default function Auth() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  return <AuthForm key={mode} mode={mode} />;
}
function AuthForm({ mode }: { mode: string }) {
  const store = usePlans();
  const register = mode === "register",
    recovery = mode === "forgot-password",
    reset = mode === "reset-password",
    verify = mode === "verify";
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false),
    [accepted, setAccepted] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [sentAt, setSentAt] = useState(0);
  async function submit() {
    setError("");
    setMessage("");
    if (!supabase) {
      setError(
        "Account service is not configured. Add the Supabase project URL and public key to enable authentication.",
      );
      return;
    }
    if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (
      !recovery &&
      !verify &&
      password.length < (register || reset ? 12 : 1)
    ) {
      setError(
        register || reset
          ? "Use at least 12 characters for your password."
          : "Enter your password.",
      );
      return;
    }
    if ((register || reset) && password !== confirm) {
      setError("Passwords must match.");
      return;
    }
    if (register && !accepted) {
      setError("Review and accept the educational scope and privacy terms.");
      return;
    }
    if ((recovery || verify) && Date.now() - sentAt < 60000) {
      setError("Please wait 60 seconds before requesting another email.");
      return;
    }
    setBusy(true);
    try {
      const redirectTo = Linking.createURL("/auth/callback");
      if (recovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${redirectTo}?type=recovery`,
        });
        if (error) throw error;
        setSentAt(Date.now());
        setMessage(
          "If the address can receive a reset email, a link is on its way. Check your inbox and spam folder.",
        );
      } else if (verify) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setSentAt(Date.now());
        setMessage(
          "If verification is available for that address, a fresh link is on its way.",
        );
      } else if (reset) {
        if (!store.session || !store.recoverySession)
          throw Error("Open a valid recovery link first.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setPassword("");
        setConfirm("");
        setMessage("Password updated. Sign in with your new password.");
      } else if (register) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setPassword("");
        setConfirm("");
        setMessage(
          data.session
            ? "Account created and signed in."
            : `Check ${email} for a confirmation link. Verification is complete only after opening a valid link.`,
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error)
          throw Error(
            "Unable to sign in. Check your details, verify your email, or reset your password.",
          );
        setPassword("");
        router.replace(store.draft ? "/plans/builder" : "/");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The request failed. Check your connection and retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const title = register
    ? "A little clarity starts here."
    : recovery
      ? "Let’s get you back in."
      : reset
        ? "A fresh start for your password."
        : verify
          ? "Your inbox is the next step."
          : "Welcome back.";
  if (
    ![
      "register",
      "sign-in",
      "forgot-password",
      "reset-password",
      "verify",
    ].includes(mode)
  )
    return (
      <Shell title="Page not found">
        <Button onPress={() => router.replace("/")}>Go home</Button>
      </Shell>
    );
  return (
    <Shell title={title} subtitle="Your finances deserve a thoughtful plan.">
      <View style={{ maxWidth: 500, width: "100%", alignSelf: "center" }}>
        <Card style={{ padding: 30 }}>
          <Badge>
            {register
              ? "CREATE YOUR ACCOUNT"
              : recovery
                ? "PASSWORD RECOVERY"
                : verify
                  ? "VERIFY EMAIL"
                  : "YOUR ACCOUNT"}
          </Badge>
          {!supabase && (
            <Notice>
              Account and cloud services are not connected in this preview. You
              can explore examples or build a session-only local plan.
            </Notice>
          )}
          {!reset && (
            <Field
              label="Email address"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          )}
          {!recovery && !verify && (
            <>
              <Field
                label={reset ? "New password" : "Password"}
                value={password}
                onChange={setPassword}
                secure={!show}
                autoComplete={
                  register || reset ? "new-password" : "current-password"
                }
                hint={
                  register || reset ? "Use at least 12 characters." : undefined
                }
              />
              {(register || reset) && (
                <Field
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  secure={!show}
                  autoComplete="new-password"
                />
              )}
              <Toggle label="Show password" value={show} onChange={setShow} />
            </>
          )}
          {register && (
            <>
              <Toggle
                label="I accept the educational scope and privacy terms"
                value={accepted}
                onChange={setAccepted}
              />
              <Link href="/privacy">
                <Txt color={C.green} size={12}>
                  Read scope & privacy terms ↗
                </Txt>
              </Link>
            </>
          )}
          {!!error && <Notice error>{error}</Notice>}
          {!!message && <Notice>{message}</Notice>}
          <Button
            disabled={busy}
            onPress={() => {
              void submit();
            }}
          >
            {busy
              ? "Working…"
              : recovery
                ? "Send reset link"
                : verify
                  ? "Resend verification email"
                  : reset
                    ? "Update password"
                    : register
                      ? "Create account"
                      : "Sign in"}
          </Button>
          <View style={{ gap: 12 }}>
            {register ? (
              <Link href="/auth/sign-in">
                <Txt size={12} color={C.green}>
                  Already have an account? Sign in →
                </Txt>
              </Link>
            ) : (
              <Link href="/auth/register">
                <Txt size={12} color={C.green}>
                  Create an account →
                </Txt>
              </Link>
            )}
            <Link href="/auth/forgot-password">
              <Txt size={12} color={C.muted}>
                Forgot password?
              </Txt>
            </Link>
            <Link href="/auth/verify">
              <Txt size={12} color={C.muted}>
                Need a fresh verification link?
              </Txt>
            </Link>
            <Link href="/plans">
              <Txt size={12} color={C.muted}>
                Explore a fictional example ↗
              </Txt>
            </Link>
          </View>
        </Card>
      </View>
    </Shell>
  );
}
