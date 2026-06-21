import { create } from "zustand";
import { syncEngine } from "@/services/sync";
import type { SyncQueueItem } from "@/lib/db";

interface SyncState {
  status: "idle" | "syncing" | "error";
  lastError?: string;
  refreshTick: number;
  subscribe: () => () => void;
  enqueue: (item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">) => Promise<void>;
  processNow: () => Promise<void>;
  triggerRefresh: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  refreshTick: 0,

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

  triggerRefresh: async () => {
    await syncEngine.processQueue();
    set((s) => ({ refreshTick: s.refreshTick + 1 }));
  },
}));
