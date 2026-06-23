import { BRANDING } from "@/lib/branding";

/**
 * Branded splash screen — shown during app bootstrap.
 * Uses the official Pokleh Enterprise logo against a dark, exclusive background.
 * Features pulsing rings, animated dots, and a subtle progress bar.
 * Admins get a personalized "Hi Boss, [name]" greeting.
 *
 * @param status - Current boot phase message (e.g. "Restoring session…")
 * @param userName - Authenticated user's display name
 * @param isAdmin - Whether the user has the admin role
 */
export const SplashScreen = ({
  status = "Loading…",
  userName,
  isAdmin,
}: {
  status?: string;
  userName?: string;
  isAdmin?: boolean;
}) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center splash-safe"
    style={{
      background: "linear-gradient(160deg, #0a0812 0%, #120d24 30%, #0f0b1e 60%, #0a0815 100%)",
    }}
  >
    {/* Subtle dark glow overlay */}
    <div
      className="absolute inset-0 opacity-[0.12]"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #4f46e5 0%, transparent 60%), radial-gradient(ellipse at 50% 70%, #7c3aed 0%, transparent 50%)",
      }}
    />

    <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm w-full">
      {/* Logo with pulse rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulse ring 1 */}
        <div
          className="absolute rounded-full bg-white/[0.06] animate-pulse-ring"
          style={{ width: 140, height: 140 }}
        />
        {/* Pulse ring 2 (delayed) */}
        <div
          className="absolute rounded-full bg-white/[0.04] animate-pulse-ring"
          style={{
            width: 140,
            height: 140,
            animationDelay: "0.8s",
          }}
        />

        {/* Official logo */}
        <img
          src={BRANDING.assets.logoPng}
          alt={BRANDING.appName}
          className="relative w-[100px] h-[100px] object-contain animate-breath drop-shadow-[0_0_40px_rgba(124,58,237,0.35)]"
        />
      </div>

      {/* App name */}
      <div className="text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-white/95 drop-shadow-md">
          {BRANDING.appName}
        </h1>
        <p className="text-sm text-white/50 mt-1 font-medium tracking-wide">
          {BRANDING.tagline}
        </p>
      </div>

      {/* Admin greeting or status with animated dots */}
      {isAdmin && userName ? (
        <div className="text-center mt-2">
          <p className="text-white/90 text-base font-semibold tracking-wide">
            Hi Boss, {userName} 👑
          </p>
          <p className="text-white/40 text-xs mt-1">{status}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-white/60 text-sm font-medium mt-2">
          <span>{status}</span>
          <span className="inline-flex gap-[3px] ml-0.5">
            <span className="w-[4px] h-[4px] rounded-full bg-white/60 dot-bounce" />
            <span className="w-[4px] h-[4px] rounded-full bg-white/60 dot-bounce" />
            <span className="w-[4px] h-[4px] rounded-full bg-white/60 dot-bounce" />
          </span>
        </div>
      )}

      {/* Subtle progress bar */}
      <div className="w-full max-w-[200px] h-[2px] rounded-full bg-white/[0.08] mt-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-white/30 w-[40%] animate-progress-slide"
        />
      </div>
    </div>
  </div>
);

export default SplashScreen;

// Re-export SkeletonDashboard for convenience
export { SkeletonDashboard } from "./skeleton";

// ─── Lightweight inline spinner (per-page loading states) ───

import { Loader2 } from "lucide-react";

export const PageLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">Loading…</p>
    </div>
  </div>
);
