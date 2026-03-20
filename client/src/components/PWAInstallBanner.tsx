// client/src/components/PWAInstallBanner.tsx
// FIXED: beforeinstallprompt fires VERY early on mobile (often before React renders).
// We capture it globally in a module-level variable so it's never lost.

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Global capture — runs as soon as this module is imported (before any
// component mounts). This is the ONLY reliable way to catch the event
// on Android Chrome, Samsung Browser, etc.
// ─────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _promptListeners: Array<() => void> = [];

function notifyListeners() {
  _promptListeners.forEach((fn) => fn());
}

// Attach immediately at module load time
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    console.log("[PWA] beforeinstallprompt captured ✓");
    notifyListeners();
  });
}

// ─────────────────────────────────────────────────────────────────────
// Detect platform
// ─────────────────────────────────────────────────────────────────────
function getOS(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// ─────────────────────────────────────────────────────────────────────
// iOS manual install instructions
// ─────────────────────────────────────────────────────────────────────
function IOSBanner({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 9999,
      background: "linear-gradient(135deg,#0a0f1e,#1a1030)",
      border: "1px solid rgba(255,77,109,0.4)", borderRadius: 20, padding: 20,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      animation: "pwaSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 12, right: 12,
        background: "rgba(255,255,255,0.1)", border: "none",
        borderRadius: 99, width: 28, height: 28, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      }}><X size={13} /></button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg,#FF4D6D,#cc3355)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
          </svg>
        </div>
        <div>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>Install FandomForge</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 }}>Add to your Home Screen</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { step: "1", text: "Tap the Share button at the bottom of Safari" },
          { step: "2", text: 'Scroll and tap "Add to Home Screen"' },
          { step: "3", text: 'Tap "Add" — opens like a real app' },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 99, flexShrink: 0,
              background: "rgba(255,77,109,0.25)", border: "1px solid rgba(255,77,109,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FF4D6D", fontSize: 11, fontWeight: 800,
            }}>{step}</div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5, marginTop: 3 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Android / Desktop install banner
// ─────────────────────────────────────────────────────────────────────
function InstallBanner({ onInstall, onClose }: { onInstall: () => void; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 9999,
      animation: "pwaSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#FF4D6D,#cc2255)",
        borderRadius: 20, padding: "14px 16px",
        boxShadow: "0 16px 48px rgba(255,77,109,0.40)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {/* App icon */}
        <div style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>
            Install FandomForge
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 3 }}>
            Add to Home Screen · works offline
          </p>
        </div>

        {/* Install CTA */}
        <button onClick={onInstall} style={{
          background: "#fff", border: "none", borderRadius: 12,
          padding: "9px 16px", cursor: "pointer",
          color: "#FF4D6D", fontWeight: 800, fontSize: 12, flexShrink: 0,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Download size={12} /> Install
        </button>

        {/* Dismiss */}
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.15)", border: "none",
          borderRadius: 99, width: 26, height: 26, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
        }}><X size={12} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────────────
export function PWAInstallBanner() {
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed or dismissed this session
    if (isStandalone()) return;
    if (sessionStorage.getItem("pwaBannerDismissed")) return;

    const os = getOS();

    // ── Android / Desktop: use captured prompt ──────────────────────
    const tryShowAndroid = () => {
      if (_deferredPrompt && !dismissed) {
        // Small delay so it doesn't flash instantly on page load
        setTimeout(() => setShowAndroid(true), 3000);
      }
    };

    // The prompt may already be captured (module loaded before component)
    tryShowAndroid();

    // Or register for future captures (rare but possible)
    const listener = () => tryShowAndroid();
    _promptListeners.push(listener);

    // ── iOS Safari: show manual instructions after 4s ───────────────
    if (os === "ios") {
      const t = setTimeout(() => {
        if (!sessionStorage.getItem("pwaBannerDismissed")) {
          setShowIOS(true);
        }
      }, 4000);
      return () => {
        clearTimeout(t);
        _promptListeners = _promptListeners.filter((fn) => fn !== listener);
      };
    }

    // ── appinstalled event ──────────────────────────────────────────
    const handleInstalled = () => {
      setShowAndroid(false);
      setShowIOS(false);
      _deferredPrompt = null;
    };
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      _promptListeners = _promptListeners.filter((fn) => fn !== listener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    setShowAndroid(false);
    setShowIOS(false);
    setDismissed(true);
    sessionStorage.setItem("pwaBannerDismissed", "1");
  };

  const handleInstall = async () => {
    if (!_deferredPrompt) return;
    try {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === "accepted") {
        _deferredPrompt = null;
        dismiss();
      }
    } catch (err) {
      console.error("[PWA] Install error:", err);
    }
  };

  if (dismissed || isStandalone()) return null;
  if (showIOS) return <IOSBanner onClose={dismiss} />;
  if (showAndroid && _deferredPrompt) return <InstallBanner onInstall={handleInstall} onClose={dismiss} />;
  return null;
}