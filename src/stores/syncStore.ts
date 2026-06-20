import { create } from "zustand";
import { syncEngine } from "@/services/sync";
import type { SyncQueueItem } from "@/lib/db";

interface SyncState {
  status: "idle" | "syncing" | "error";
  lastError?: string;
  subscribe: () => () => void;
  enqueue: (item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">) => Promise<void>;
  processNow: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",

  subscribe: () => {
    return syncEngine.subscribe((status, error) =>
      set({ status, lastError: error })
    );
  },

  enqueue: async (item) => {
    await syncEngine.enqueue(item);
  },

  processNow: async () => {
    await syncEngine.processQueue();
  },
}));
