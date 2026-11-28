import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Scenario } from "@/domain/allocation/types";
import {
  cloneScenario,
  freshScenario,
  presets,
} from "@/domain/scenarios/presets";
import { parsePlanData, type PlanData } from "@/lib/plan-data";
import { supabase } from "@/lib/supabase";
const KEY = "investing-order:v1";
let storageQueue: Promise<unknown> = Promise.resolve();
function storageTask<T>(task: () => Promise<T>): Promise<T> {
  const next = storageQueue.then(task, task);
  storageQueue = next.catch(() => undefined);
  return next;
}
type Data = PlanData;
type Store = Data & {
  loading: boolean;
  error: string;
  status: string;
  local: boolean;
  session: Session | null;
  recoverySession: boolean;
  active: Scenario;
  cloud: boolean;
  setLocal: (v: boolean) => Promise<void>;
  setCloud: (v: boolean) => Promise<void>;
  restoreCloud: () => Promise<void>;
  save: (s: Scenario) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
  start: (s?: Scenario) => void;
  updateDraft: (s: Scenario) => void;
  clearDraft: () => void;
  toggle: (id: string) => void;
  clear: () => Promise<void>;
  retry: () => void;
};
const Context = createContext<Store | null>(null);
export function PlanProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>({
    ownerId: null,
    plans: [],
    activeId: presets[0].id,
    draft: null,
    checks: {},
  });
  const [loading, setLoading] = useState(true),
    [local, setLocalState] = useState(false),
    [cloud, setCloudState] = useState(false);
  const [error, setError] = useState(""),
    [status, setStatus] = useState("Session only"),
    [session, setSession] = useState<Session | null>(null);
  const cloudRevision = useRef(0),
    accountId = useRef<string | null>(null);
  const [recoverySession, setRecoverySession] = useState(false);
  async function restore() {
    try {
      const raw = await storageTask(() => AsyncStorage.getItem(KEY));
      if (raw) {
        const parsed = parsePlanData(JSON.parse(raw));
        setData({ ...parsed, ownerId: parsed.ownerId ?? null });
        accountId.current = parsed.ownerId ?? null;
        setLocalState(true);
        setStatus("Saved on this device");
      }
    } catch {
      setError(
        "Your saved plans could not be loaded. Retry before creating changes.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void Promise.resolve().then(restore);
    const listener = supabase?.auth.onAuthStateChange((_e, next) => {
      setSession(next);
      if (_e === "PASSWORD_RECOVERY") setRecoverySession(true);
      if (!next) setRecoverySession(false);
      if (
        accountId.current &&
        (next ? accountId.current !== next.user.id : _e === "SIGNED_OUT")
      ) {
        setData({
          ownerId: null,
          plans: [],
          activeId: presets[0].id,
          draft: null,
          checks: {},
        });
        setLocalState(false);
        void storageTask(() => AsyncStorage.removeItem(KEY)).catch(() =>
          setError(
            "Previous device data could not be removed. Clear device data before continuing.",
          ),
        );
      }
      if (next) setData((d) => ({ ...d, ownerId: next.user.id }));
      if (next || _e === "SIGNED_OUT")
        accountId.current = next?.user.id ?? null;
      if (!next) {
        setCloudState(false);
        cloudRevision.current++;
      }
    });
    return () => listener?.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || Platform.OS === "web") return;
    const auth = supabase.auth;
    if (AppState.currentState === "active") void auth.startAutoRefresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void auth.startAutoRefresh();
      else auth.stopAutoRefresh();
    });
    return () => {
      subscription.remove();
      auth.stopAutoRefresh();
    };
  }, []);
  useEffect(() => {
    if (loading || !local) return;
    let disposed = false;
    storageTask(() => AsyncStorage.setItem(KEY, JSON.stringify(data)))
      .then(() => {
        if (!disposed) setStatus("Saved on this device");
      })
      .catch(() => {
        if (!disposed) {
          setStatus("Save failed");
          setError(
            "Device saving failed. Your changes remain in this session. Retry saving in Settings.",
          );
        }
      });
    return () => {
      disposed = true;
    };
  }, [data, loading, local]);
  // Cloud writes are explicit snapshots, never an effect of typing financial values.
  async function setCloud(value: boolean) {
    if (!value) {
      cloudRevision.current++;
      setCloudState(false);
      setStatus(local ? "Saved on this device" : "Session only");
      return;
    }
    if (!supabase || !session) {
      setError(
        "Sign in to a configured Supabase project before uploading a snapshot.",
      );
      return;
    }
    const revision = ++cloudRevision.current;
    setStatus("Uploading snapshot…");
    setError("");
    const { error: failure } = await supabase.from("scenario_snapshots").upsert(
      {
        owner_id: session.user.id,
        payload: { ...data, ownerId: session.user.id },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    );
    if (revision !== cloudRevision.current) return;
    if (failure) {
      setError(
        "Cloud save failed. Your local plan is still available. Retry the snapshot upload.",
      );
      setStatus("Cloud save failed");
    } else {
      setCloudState(true);
      setStatus("Cloud snapshot saved");
    }
  }
  const value: Store = {
    ...data,
    loading,
    local,
    cloud,
    error,
    status,
    session,
    recoverySession,
    active:
      data.plans.find((p) => p.id === data.activeId) ??
      presets.find((p) => p.id === data.activeId) ??
      presets[0],
    setLocal: async (v) => {
      try {
        if (v)
          await storageTask(() =>
            AsyncStorage.setItem(KEY, JSON.stringify(data)),
          );
        else await storageTask(() => AsyncStorage.removeItem(KEY));
        setLocalState(v);
        setError("");
        setStatus(v ? "Saved on this device" : "Session only");
      } catch {
        setError("Could not update device storage. Retry.");
      }
    },
    setCloud,
    restoreCloud: async () => {
      if (!supabase || !session) {
        setError("Sign in before restoring a cloud snapshot.");
        return;
      }
      const revision = ++cloudRevision.current;
      setStatus("Loading cloud snapshot…");
      setError("");
      try {
        const { data: row, error: failure } = await supabase
          .from("scenario_snapshots")
          .select("payload")
          .eq("owner_id", session.user.id)
          .maybeSingle();
        if (revision !== cloudRevision.current) return;
        if (failure) throw failure;
        if (!row) {
          setStatus("No cloud snapshot");
          setError(
            "No snapshot has been uploaded for this account. Your current plans were kept.",
          );
          return;
        }
        const restored = parsePlanData(row.payload);
        if (restored.ownerId !== session.user.id)
          throw Error("Snapshot ownership does not match.");
        setData(restored);
        setCloudState(true);
        setStatus("Cloud snapshot restored");
      } catch {
        if (revision === cloudRevision.current) {
          setError(
            "Cloud restore failed or the snapshot is incompatible. Your current plans were kept. Retry when connected.",
          );
          setStatus("Restore failed");
        }
      }
    },
    save: (s) => {
      const updated = { ...s, updatedAt: new Date().toISOString() };
      setData((d) => ({
        ...d,
        plans: [...d.plans.filter((p) => p.id !== s.id), updated],
        activeId: s.id,
        draft: null,
        checks: Object.fromEntries(
          Object.entries(d.checks).filter(([k]) => !k.startsWith(`${s.id}:`)),
        ),
      }));
    },
    remove: (id) =>
      setData((d) => ({
        ...d,
        plans: d.plans.filter((p) => p.id !== id),
        activeId: d.activeId === id ? presets[0].id : d.activeId,
        checks: Object.fromEntries(
          Object.entries(d.checks).filter(([k]) => !k.startsWith(`${id}:`)),
        ),
      })),
    select: (id) => setData((d) => ({ ...d, activeId: id })),
    start: (s) =>
      setData((d) => ({
        ...d,
        draft: s
          ? {
              ...cloneScenario(s),
              id: s.sample ? freshScenario().id : s.id,
              sample: false,
              name: s.sample ? `${s.name} · my plan` : s.name,
            }
          : freshScenario(),
      })),
    updateDraft: (s) => setData((d) => ({ ...d, draft: s })),
    clearDraft: () => setData((d) => ({ ...d, draft: null })),
    toggle: (id) =>
      setData((d) => ({ ...d, checks: { ...d.checks, [id]: !d.checks[id] } })),
    clear: async () => {
      try {
        await storageTask(() => AsyncStorage.removeItem(KEY));
        setLocalState(false);
        setCloudState(false);
        cloudRevision.current++;
        setData({
          ownerId: null,
          plans: [],
          activeId: presets[0].id,
          draft: null,
          checks: {},
        });
        setStatus("Session only");
        setError("");
      } catch {
        setError("Device data could not be cleared. Retry.");
      }
    },
    retry: () => {
      setLoading(true);
      setError("");
      void restore();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePlans() {
  const store = useContext(Context);
  if (!store) throw Error("Missing PlanProvider");
  return store;
}
