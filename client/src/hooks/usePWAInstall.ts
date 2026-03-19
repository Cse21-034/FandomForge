// client/src/hooks/usePWAInstall.ts
// Properly captures beforeinstallprompt and exposes install()
import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setInstalled] = useState(false);
  const [isInstalling, setInstalling] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as standalone PWA?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Listen for the browser's install prompt
    const handlePrompt = (e: Event) => {
      e.preventDefault(); // Prevent auto-showing
      const installEvent = e as BeforeInstallPromptEvent;
      promptRef.current = installEvent;
      setPrompt(installEvent);
      console.log("[PWA] beforeinstallprompt captured ✓");
    };

    const handleInstalled = () => {
      console.log("[PWA] appinstalled event fired ✓");
      setInstalled(true);
      setPrompt(null);
      promptRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    // Check if already installed via display-mode change
    const mq = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };
    mq.addEventListener("change", handleDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mq.removeEventListener("change", handleDisplayChange);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const p = promptRef.current;
    if (!p) {
      console.warn("[PWA] No install prompt available");
      return false;
    }

    setInstalling(true);
    try {
      await p.prompt();
      const { outcome } = await p.userChoice;
      console.log("[PWA] User choice:", outcome);

      if (outcome === "accepted") {
        setInstalled(true);
        setPrompt(null);
        promptRef.current = null;
        return true;
      }
      return false;
    } catch (err) {
      console.error("[PWA] Install error:", err);
      return false;
    } finally {
      setInstalling(false);
    }
  };

  return {
    canInstall: !!prompt && !isInstalled,
    isInstalled,
    isInstalling,
    install,
  };
}