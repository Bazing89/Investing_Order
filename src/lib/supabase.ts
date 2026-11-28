import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { authStorage } from "./auth-storage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Authentication persistence is separate from optional financial-data storage.
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          storage: authStorage,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;
