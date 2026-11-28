import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import {
  C,
  Txt,
  Card,
  Button,
  Toggle,
  Notice,
  Badge,
  Field,
} from "@/components/investing/ui";
import { usePlans } from "@/features/plan-store";
import { supabase } from "@/lib/supabase";
export default function Settings() {
  const store = usePlans(),
    [confirm, setConfirm] = useState(false),
    [cloudPreview, setCloudPreview] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [deleteText, setDeleteText] = useState("");
  async function deleteCloud() {
    if (!supabase || !store.session) return;
    setBusy(true);
    const result = await supabase
      .from("scenario_snapshots")
      .delete()
      .eq("owner_id", store.session.user.id);
    if (result.error)
      setError("Cloud snapshot deletion failed. Retry when connected.");
    else {
      setError("");
      await store.setCloud(false);
      setCloudPreview(false);
    }
    setBusy(false);
  }
  return (
    <Shell
      title="Your workspace. Your preferences."
      subtitle="Choose what stays on this device and what you take with you."
    >
      <Card>
        <Badge>ACCOUNT</Badge>
        <Txt size={22}>
          {store.session?.user.email ?? "Make yourself at home."}
        </Txt>
        <Txt size={12} color={C.muted}>
          {supabase
            ? store.session
              ? "Signed in. Account authentication is saved separately from your financial-data saving preference."
              : "Sign in to use your account. Financial data is not uploaded during sign-in."
            : "You’re using the local app preview. Connect Supabase to enable registration, email verification and cloud snapshots."}
        </Txt>
        {store.session ? (
          <Button
            secondary
            onPress={async () => {
              await supabase?.auth.signOut();
              await store.clear();
              router.replace("/");
            }}
          >
            Sign out & clear this device
          </Button>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button onPress={() => router.push("/auth/register")}>
              Create account
            </Button>
            <Button secondary onPress={() => router.push("/auth/sign-in")}>
              Sign in
            </Button>
          </View>
        )}
      </Card>
      <Card>
        <Txt size={21}>Data & saving</Txt>
        <Toggle
          label="Save on this device"
          value={store.local}
          onChange={(v) => {
            void store.setLocal(v);
          }}
          hint="Keeps plans, drafts and checklist progress after the app closes. Storage is not encrypted by the app."
        />
        <Txt size={12} color={C.green}>
          {store.status}
        </Txt>
        <Notice>
          With device saving off, personal values stay in this session.
          Calculations run on your device. No financial values are put into URLs
          or analytics.
        </Notice>
        <Button
          secondary
          disabled={!store.session || !supabase}
          onPress={() => setCloudPreview(!cloudPreview)}
        >
          Review cloud upload
        </Button>
        {cloudPreview && (
          <View style={{ gap: 14 }}>
            <Notice>
              Upload a snapshot containing {store.plans.length} plan(s), the
              current draft, household ages, wages, account balances, budgets
              and checklist progress. This is an explicit upload of financial
              information, separate from authentication.
            </Notice>
            <Txt size={12} color={C.muted}>
              Cloud snapshots are manual backups in this preview. New edits stay
              local until you upload again. Stopping uploads does not delete an
              existing snapshot.
            </Txt>
            <Button
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                await store.setCloud(true);
                setBusy(false);
              }}
            >
              Upload this snapshot
            </Button>
            <Button
              secondary
              onPress={() => {
                void store.setCloud(false);
                setCloudPreview(false);
              }}
            >
              Stop uploads
            </Button>
            <Notice>
              Restoring replaces the plans and draft in this workspace with your
              last uploaded snapshot. Export current plans first. Uploading
              replaces your previous cloud snapshot.
            </Notice>
            <Button
              secondary
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                await store.restoreCloud();
                setBusy(false);
              }}
            >
              Replace workspace from cloud snapshot
            </Button>
            <Field
              label="Type DELETE CLOUD to remove your cloud snapshot"
              value={deleteText}
              onChange={setDeleteText}
            />
            <Button
              secondary
              disabled={deleteText !== "DELETE CLOUD" || busy}
              onPress={() => {
                void deleteCloud();
              }}
            >
              Delete cloud snapshot
            </Button>
          </View>
        )}
      </Card>
      <Card>
        <Txt size={21}>Clear this device</Txt>
        <Txt size={12} color={C.muted}>
          Remove saved plans, drafts and review checkmarks from this device.
          This does not delete your account or a cloud snapshot.
        </Txt>
        {confirm ? (
          <>
            <Notice>
              This clears all personal inputs from the current session and this
              device. Export anything you need first.
            </Notice>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button secondary onPress={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                onPress={async () => {
                  await store.clear();
                  setConfirm(false);
                }}
              >
                Clear device data
              </Button>
            </View>
          </>
        ) : (
          <Button secondary onPress={() => setConfirm(true)}>
            Review clear device data
          </Button>
        )}
      </Card>
      {store.session && (
        <Card>
          <Txt size={21}>Account security</Txt>
          <Button
            secondary
            onPress={() => router.push("/auth/forgot-password")}
          >
            Request a password reset
          </Button>
          <Notice>
            Account deletion requires a protected server operation and recent
            authentication. It is not enabled in this local preview; deleting a
            snapshot or clearing this device does not delete the account.
          </Notice>
        </Card>
      )}
      {!!error && <Notice error>{error}</Notice>}
      <Card>
        <Txt size={20}>About Investing Order</Txt>
        <Txt size={12} color={C.muted}>
          By Rao’s Rendezvous · Version 1.0 preview
        </Txt>
        <Txt size={12} color={C.muted}>
          Built for education and annual planning. No banking connections,
          trading, account funding or automatic payroll changes.
        </Txt>
        <Button secondary onPress={() => router.push("/learn")}>
          Methodology, limitations & sources
        </Button>
      </Card>
    </Shell>
  );
}
