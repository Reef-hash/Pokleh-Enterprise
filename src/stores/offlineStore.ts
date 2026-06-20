import { create } from "zustand";
import { offlineDetector } from "@/services/offline";

interface OfflineState {
  isOnline: boolean;
  subscribe: () => () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: offlineDetector.isOnline,

  subscribe: () => {
    return offlineDetector.subscribe((online) => set({ isOnline: online }));
  },
}));
