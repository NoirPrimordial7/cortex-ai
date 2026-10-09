import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, setCsrf } from "./api";
import type { User } from "./types";
import { SessionContext as Context } from "./session-context";
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false);
  const evidenceRevision = useRef<string | null>(null);
  async function refresh(requireSession = false) {
    try {
      const s = await api<{
        user: User;
        csrf_token: string;
        policy_revision: number;
        knowledge_revision: number;
      }>("/auth/session");
      const revision = JSON.stringify([
        s.user.id,
        s.policy_revision,
        s.knowledge_revision,
        s.user.roles,
        s.user.actions,
      ]);
      if (
        evidenceRevision.current !== null &&
        evidenceRevision.current !== revision
      ) {
        window.dispatchEvent(new Event("cortex:evidence-changed"));
      }
      evidenceRevision.current = revision;
      setCsrf(s.csrf_token);
      setUser(s.user);
    } catch (error) {
      setUser(null);
      setCsrf("");
      evidenceRevision.current = null;
      window.dispatchEvent(new Event("cortex:evidence-changed"));
      if (requireSession)
        throw new Error(
          "Sign-in could not establish a session. Please retry. " +
            (error instanceof Error ? error.message : ""),
        );
    } finally {
      setReady(true);
    }
  }
  async function signOut() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setCsrf("");
    window.dispatchEvent(new Event("cortex:evidence-changed"));
  }
  useEffect(() => {
    void refresh();
    const expired = () => {
      setUser(null);
      setCsrf("");
    };
    window.addEventListener("cortex:session-expired", expired);
    return () => window.removeEventListener("cortex:session-expired", expired);
  }, []);
  useEffect(() => {
    if (!user) return;
    const check = () => void refresh();
    const timer = setInterval(check, 15000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [user?.id]);
  return (
    <Context.Provider value={{ user, ready, refresh, signOut }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Session provider missing");
  return value;
}
