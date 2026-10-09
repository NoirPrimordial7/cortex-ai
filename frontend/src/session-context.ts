import { createContext } from "react";
import type { User } from "./types";

export type Session = {
  user: User | null;
  ready: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
// Keep the context identity stable when the provider is hot-reloaded.
export const SessionContext = createContext<Session | null>(null);
