import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import './index.css'
import { toast } from 'sonner'

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        toast("A new version is available", {
          description: "Refresh to get the latest updates.",
          action: {
            label: "Refresh",
            onClick: () => window.location.reload(),
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
