// Centralized branding configuration
// Replace asset paths with client-provided files when available

export const BRANDING = {
  appName: "Pokleh Enterprise",
  shortName: "Pokleh",
  tagline: "Ice Distribution Management System",
  themeColor: "#1e40af",
  backgroundColor: "#ffffff",

  // Asset paths — replace these files in public/ to update branding
  assets: {
    favicon: "/favicon.ico",
    icon192: "/icons/icon-192.png",
    icon512: "/icons/icon-512.png",
    iconMaskable: "/icons/icon-512-maskable.png",
    appleTouchIcon: "/icons/icon-512.png",
    logoSvg: "/logo.svg",
    logoPng: "/logo.png",
  },

  // Derived
  appleStatusBarStyle: "black-translucent" as const,
} as const;

export type LogoVariant = "icon" | "full" | "splash";

export const LOGO_SIZES: Record<LogoVariant, { width: number; height: number }> = {
  icon: { width: 32, height: 32 },
  full: { width: 140, height: 32 },
  splash: { width: 192, height: 192 },
};
