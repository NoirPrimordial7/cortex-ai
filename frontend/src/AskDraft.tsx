import {
  createContext,
  use,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { localPolicyDate } from "./components";

type Draft = {
  query: string;
  date: string;
  population: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setDate: Dispatch<SetStateAction<string>>;
  setPopulation: Dispatch<SetStateAction<string>>;
};
const DraftContext = createContext<Draft | null>(null);

// The authenticated App owns this provider. Navigation retains unfinished input;
// logout or an account change unmounts it. Answers/sources are never retained.
export function AskDraftProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(localPolicyDate);
  const [population, setPopulation] = useState("india_full_time");
  const value = useMemo(
    () => ({ query, date, population, setQuery, setDate, setPopulation }),
    [query, date, population],
  );
  return <DraftContext value={value}>{children}</DraftContext>;
}

export function useAskDraft() {
  const draft = use(DraftContext);
  if (!draft)
    throw new Error("Ask Cortex requires its session draft provider.");
  return draft;
}
