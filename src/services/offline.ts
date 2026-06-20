type OfflineListener = (online: boolean) => void;

class OfflineDetector {
  private listeners: Set<OfflineListener> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private _isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener("online", () => this.setOnline(true));
    window.addEventListener("offline", () => this.setOnline(false));
    this.startHeartbeat();
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private setOnline(online: boolean): void {
    if (this._isOnline === online) return;
    this._isOnline = online;
    this.listeners.forEach((fn) => fn(online));
  }

  private async startHeartbeat(): Promise<void> {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const resp = await fetch(
          "https://gsieirprrkuyfzxqcizb.supabase.co/rest/v1/",
          { method: "HEAD", signal: AbortSignal.timeout(5000) }
        );
        this.setOnline(resp.ok);
      } catch {
        this.setOnline(false);
      }
    }, 30000);
  }

  subscribe(listener: OfflineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.listeners.clear();
  }
}

export const offlineDetector = new OfflineDetector();
