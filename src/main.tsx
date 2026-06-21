import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import './index.css'
import { toast } from 'sonner'

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    // updateSW(true) triggers skipWaiting on the new SW then reloads —
    // unlike location.reload() which reloads with the OLD SW still active
    const updateSW = registerSW({
      onNeedRefresh() {
        toast("Versi baru tersedia", {
          description: "Kemas kini untuk mendapatkan versi terkini.",
          action: {
            label: "Kemas Kini",
            onClick: () => updateSW(true),
          },
          duration: Infinity,
        });
      },
      onOfflineReady() {
        console.log("App ready for offline use");
      },
    });
  }).catch(() => {
    // PWA registration not available (dev mode)
  });
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
