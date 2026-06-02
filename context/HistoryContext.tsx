import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  loadHistory,
  deleteFromHistory,
  clearHistory,
  HistoryItem,
} from "@/services/history";

interface HistoryCtx {
  entries: HistoryItem[];
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

const HistoryContext = createContext<HistoryCtx>({
  entries: [],
  removeEntry: () => {},
  clearAll: () => {},
});

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory().then(setEntries);
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    const updated = await deleteFromHistory(id);
    setEntries(updated);
  }, []);

  const clearAll = useCallback(async () => {
    await clearHistory();
    setEntries([]);
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, removeEntry, clearAll }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
