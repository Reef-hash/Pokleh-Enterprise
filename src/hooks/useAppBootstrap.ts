import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSyncStore } from "@/stores/syncStore";
import { customersRepo } from "@/repositories/customersRepo";
import { trucksRepo } from "@/repositories/trucksRepo";
import { db } from "@/lib/db";
import type { OfflineCustomer, OfflineTruck } from "@/lib/db";

export type BootPhase = "auth" | "syncing" | "ready";

/** Minimum visible splash time (ms) for that "exclusive" feel */
const MIN_SPLASH_MS = 2800;

const STATUS_MESSAGES: Record<BootPhase, string> = {
  auth: "Restoring session…",
  syncing: "Syncing your data…",
  ready: "Ready",
};

/**
 * Orchestrates the app boot sequence:
 * 1. Restore auth session (Supabase)
 * 2. Pre-fetch dashboard data (customers + trucks) → cache to Dexie
 * 3. Process offline sync queue
 *
 * Reports status via `bootPhase` for the splash screen.
 */
export const useAppBootstrap = () => {
  const [bootPhase, setBootPhase] = useState<BootPhase>("auth");
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES.auth);
  const initialized = useAuthStore((s) => s.initialized);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const user = useAuthStore((s) => s.user);
  const processNow = useSyncStore((s) => s.processNow);
  const hasRun = useRef(false);
  const bootStartRef = useRef(Date.now());
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Marks boot as ready, but enforces MIN_SPLASH_MS before transitioning */
  const setReadyWithDelay = useCallback(() => {
    const elapsed = Date.now() - bootStartRef.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    readyTimerRef.current = setTimeout(() => {
      setBootPhase("ready");
      setStatusMessage(STATUS_MESSAGES.ready);
    }, remaining);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    };
  }, []);

  // Step 1: Restore auth session
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!initialized) {
      restoreSession();
    }
  }, [initialized, restoreSession]);

  // Step 2: Once auth is resolved (user exists), pre-fetch data + sync
  const preFetch = useCallback(async () => {
    setBootPhase("syncing");
    setStatusMessage(STATUS_MESSAGES.syncing);

    // Pre-fetch in parallel — silently cache, don't throw
    const results = await Promise.allSettled([
      // Customers
      (async () => {
        const { data, error } = await customersRepo.fetchAll();
        if (error) throw error;
        const customers = (data || []) as unknown as OfflineCustomer[];
        if (customers.length > 0) {
          await db.customers.bulkPut(customers);
        }
        return customers.length;
      })(),
      // Trucks
      (async () => {
        const { data, error } = await trucksRepo.fetchAll();
        if (error) throw error;
        const trucks = (data || []) as unknown as OfflineTruck[];
        if (trucks.length > 0) {
          await db.trucks.bulkPut(trucks);
        }
        return trucks.length;
      })(),
      // Process offline sync queue
      (async () => {
        await processNow();
      })(),
    ]);

    // Log results for debugging (non-blocking)
    if (process.env.NODE_ENV === "development") {
      const [customers, trucks, sync] = results;
      console.log("[bootstrap]", {
        customers: customers.status === "fulfilled" ? customers.value : "failed",
        trucks: trucks.status === "fulfilled" ? trucks.value : "failed",
        sync: sync.status,
      });
    }

    setReadyWithDelay();
  }, [processNow, setReadyWithDelay]);

  useEffect(() => {
    if (initialized && user && bootPhase === "auth") {
      preFetch();
    } else if (initialized && !user && bootPhase === "auth") {
      // Not authenticated — skip sync, but still show splash for MIN_SPLASH_MS
      setReadyWithDelay();
    }
  }, [initialized, user, bootPhase, preFetch]);

  return {
    bootPhase,
    statusMessage,
    ready: bootPhase === "ready",
    loading: bootPhase !== "ready",
  };
};
