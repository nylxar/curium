import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  HistoryItem,
  loadHistory,
  deleteFromHistory,
  clearHistory,
} from "@/services/history";

interface HistoryCtx {
  entries: HistoryItem[];
  reload: () => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const HistoryContext = createContext<HistoryCtx>({
  entries: [],
  reload: async () => {},
  removeEntry: async () => {},
  clearAll: async () => {},
});

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryItem[]>([]);

  const reload = useCallback(async () => {
    const data = await loadHistory();
    setEntries(data);
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    const updated = await deleteFromHistory(id);
    setEntries(updated);
  }, []);

  const clearAll = useCallback(async () => {
    await clearHistory();
    setEntries([]);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <HistoryContext.Provider value={{ entries, reload, removeEntry, clearAll }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryCtx {
  return useContext(HistoryContext);
}
