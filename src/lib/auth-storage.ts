import * as SecureStore from "expo-secure-store";
// Only authentication tokens and PKCE verifiers use this adapter, never scenarios.
export const authStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
