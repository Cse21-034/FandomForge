// client/src/hooks/usePWAInstall.ts
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [prompt, setPrompt]       = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setInstalled] = useState(false);
  const [isInstalling, setInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setInstalled(true); setPrompt(null); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return false;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") { setInstalled(true); setPrompt(null); return true; }
    } finally { setInstalling(false); }
    return false;
  };

  return { canInstall: !!prompt && !isInstalled, isInstalled, isInstalling, install };
}