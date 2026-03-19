// =====================================================================
// client/src/components/AppDownloadSection.tsx
// Full download section for HomeUpdated.tsx + popup banner component
// =====================================================================

import { useState, useEffect, useRef } from "react";
import { X, Download, Smartphone, Monitor, Apple, Chrome, ExternalLink, QrCode, Zap, Shield, Star } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Detect OS / platform
// ─────────────────────────────────────────────────────────────────────
function detectPlatform(): "ios" | "android" | "mac" | "windows" | "linux" | "unknown" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac os x/.test(ua) && !/iphone|ipad/.test(ua)) return "mac";
  if (/win/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────
// Download entries — replace hrefs with real links when ready
// ─────────────────────────────────────────────────────────────────────
const DOWNLOADS = [
  {
    id: "ios",
    label: "App Store",
    sublabel: "Download on the",
    icon: "apple",
    badge: "iOS 14+",
    href: "#",            // ← replace with real App Store URL
    color: "#000000",
    gradient: "linear-gradient(135deg,#1a1a1a,#3a3a3a)",
  },
  {
    id: "android",
    label: "Google Play",
    sublabel: "Get it on",
    icon: "google",
    badge: "Android 8+",
    href: "#",            // ← replace with real Play Store URL
    color: "#01875f",
    gradient: "linear-gradient(135deg,#01875f,#34a853)",
  },
  {
    id: "mac",
    label: "Mac",
    sublabel: "Download for",
    icon: "monitor",
    badge: "macOS 12+",
    href: "#",            // ← replace with .dmg download URL
    color: "hsl(195 100% 38%)",
    gradient: "linear-gradient(135deg,hsl(195,100%,38%),hsl(210,90%,50%))",
  },
  {
    id: "windows",
    label: "Windows",
    sublabel: "Download for",
    icon: "monitor",
    badge: "Win 10 / 11",
    href: "#",            // ← replace with .exe download URL
    color: "hsl(210 100% 56%)",
    gradient: "linear-gradient(135deg,hsl(210,100%,56%),hsl(230,90%,65%))",
  },
  {
    id: "linux",
    label: "Linux",
    sublabel: "Download for",
    icon: "monitor",
    badge: ".AppImage / .deb",
    href: "#",            // ← replace with Linux download URL
    color: "hsl(350 100% 65%)",
    gradient: "linear-gradient(135deg,hsl(350,100%,65%),hsl(320,80%,58%))",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Icon renderer
// ─────────────────────────────────────────────────────────────────────
function PlatformIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type === "apple") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    );
  }
  if (type === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-2.61-2.61L3.18 23.76zM.54 1.32C.2 1.7 0 2.28 0 3.04v17.92c0 .76.2 1.34.55 1.72l.09.09 10.04-10.04v-.24L.63 1.23l-.09.09zM20.12 10.53l-2.85-1.62-2.84 2.84 2.84 2.84 2.86-1.63c.82-.46.82-1.22-.01-1.43zM4.17.25l11.88 11.88-2.61 2.61L3.18.21c.35-.04.69.01.99.04z"/>
      </svg>
    );
  }
  return <Monitor size={size} />;
}

// ─────────────────────────────────────────────────────────────────────
// Download Button
// ─────────────────────────────────────────────────────────────────────
function DownloadBtn({
  platform,
  highlighted = false,
  size = "normal",
}: {
  platform: typeof DOWNLOADS[0];
  highlighted?: boolean;
  size?: "normal" | "large";
}) {
  return (
    <a
      href={platform.href}
      target={platform.href !== "#" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-2xl transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] ${
        size === "large" ? "px-5 py-3.5" : "px-4 py-3"
      }`}
      style={{
        background: highlighted ? platform.gradient : "rgba(255,255,255,0.10)",
        border: highlighted ? "none" : "1px solid rgba(255,255,255,0.20)",
        backdropFilter: "blur(10px)",
        textDecoration: "none",
        color: "#fff",
        boxShadow: highlighted ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
      }}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.15)" }}>
        <PlatformIcon type={platform.icon} size={18} />
      </div>
      <div>
        <p style={{ fontSize: 10, opacity: 0.75, lineHeight: 1, marginBottom: 2 }}>
          {platform.sublabel}
        </p>
        <p style={{ fontSize: size === "large" ? 15 : 13, fontWeight: 700, lineHeight: 1 }}>
          {platform.label}
        </p>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────
// QR CODE PLACEHOLDER — replace src with your real QR image
// ─────────────────────────────────────────────────────────────────────
function QRPlaceholder({ size = 120 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        background: "#fff",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        flexShrink: 0,
      }}
    >
      {/* Replace this img with your real QR code image */}
      {/* <img src="/qr-code.png" alt="QR Code" style={{ width:"100%", height:"100%", objectFit:"contain" }} /> */}

      {/* Placeholder grid that looks like a QR code */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, width: "100%" }}>
        {Array.from({ length: 49 }).map((_, i) => {
          const isCorner =
            (i < 7 && (i < 3 || i > 3)) ||
            (i >= 42 && (i < 46 || i > 46)) ||
            ((i === 0 || i === 6 || i === 7 || i === 13 || i === 14 || i === 20) && i < 21) ||
            (i % 7 === 0 && i >= 0 && i <= 42) || (i % 7 === 6 && i >= 0 && i <= 42);
          const filled = isCorner || Math.random() > 0.5;
          return (
            <div
              key={i}
              style={{
                width: "100%",
                paddingBottom: "100%",
                background: filled ? "#1a1a1a" : "transparent",
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
      <p style={{ fontSize: 8, color: "#666", fontWeight: 600, letterSpacing: 0.5 }}>SCAN TO DOWNLOAD</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN: AppDownloadSection  — add to HomeUpdated.tsx
// ═════════════════════════════════════════════════════════════════════
export function AppDownloadSection() {
  const platform = detectPlatform();

  // Sort buttons so the user's detected platform appears first
  const sorted = [...DOWNLOADS].sort((a, b) => {
    if (a.id === platform) return -1;
    if (b.id === platform) return 1;
    return 0;
  });

  const highlighted = sorted[0]; // auto-detected platform shown prominently

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,hsl(350,100%,60%) 0%,hsl(320,80%,52%) 40%,hsl(280,70%,48%) 100%)",
        padding: "64px 0",
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position:"absolute", top:-60, right:-60, width:300, height:300,
        borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none",
      }} />
      <div style={{
        position:"absolute", bottom:-80, left:-40, width:240, height:240,
        borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none",
      }} />
      <div style={{
        position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:500, height:500, borderRadius:"50%",
        background:"rgba(255,255,255,0.03)", pointerEvents:"none",
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: Phone mockup ─────────────────────────────────── */}
          <div className="relative flex items-center justify-center order-2 lg:order-1">
            {/* speech-bubble style shape behind phone */}
            <div style={{
              position:"absolute",
              width:"80%", height:"90%",
              background:"rgba(255,255,255,0.08)",
              borderRadius:"60% 40% 50% 50% / 50% 50% 40% 60%",
              backdropFilter:"blur(2px)",
            }} />

            {/* Phone frame */}
            <div style={{
              position:"relative", zIndex:2,
              width:200, height:380,
              background:"#0a0a0a",
              borderRadius:32,
              border:"3px solid rgba(255,255,255,0.15)",
              boxShadow:"0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              display:"flex", flexDirection:"column", overflow:"hidden",
            }}>
              {/* notch */}
              <div style={{
                width:80, height:20, background:"#0a0a0a",
                borderRadius:"0 0 14px 14px",
                margin:"0 auto", flexShrink:0,
                position:"relative", zIndex:3,
              }} />
              {/* screen */}
              <div style={{
                flex:1, margin:"0 4px 4px",
                background:"linear-gradient(160deg,hsl(350,100%,62%) 0%,hsl(320,80%,52%) 100%)",
                borderRadius:"0 0 28px 28px",
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                gap:12, padding:16,
              }}>
                <div style={{
                  width:56, height:56, borderRadius:16,
                  background:"rgba(255,255,255,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="white">
                    <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
                  </svg>
                </div>
                <p style={{ color:"#fff", fontSize:14, fontWeight:800, letterSpacing:"-0.5px" }}>
                  FandomForge
                </p>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:10, textAlign:"center" }}>
                  Content · Creators · Community
                </p>
                {/* fake app UI bars */}
                {[85,65,75,50].map((w,i) => (
                  <div key={i} style={{
                    width:`${w}%`, height:6,
                    background:"rgba(255,255,255,0.2)",
                    borderRadius:3,
                  }} />
                ))}
              </div>
            </div>

            {/* floating badges */}
            <div style={{
              position:"absolute", top:20, right:"8%", zIndex:3,
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(10px)",
              borderRadius:14, padding:"6px 12px",
              border:"1px solid rgba(255,255,255,0.25)",
              display:"flex", alignItems:"center", gap:6,
            }}>
              <Star size={12} fill="#FFD700" color="#FFD700" />
              <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>4.9 · 10K+ reviews</span>
            </div>
            <div style={{
              position:"absolute", bottom:40, left:"5%", zIndex:3,
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(10px)",
              borderRadius:14, padding:"6px 12px",
              border:"1px solid rgba(255,255,255,0.25)",
              display:"flex", alignItems:"center", gap:6,
            }}>
              <Zap size={12} color="#FFD700" fill="#FFD700" />
              <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>Free to download</span>
            </div>
          </div>

          {/* ── Right: Text + download buttons ─────────────────────── */}
          <div className="order-1 lg:order-2">
            {/* eyebrow */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(10px)",
              borderRadius:99, padding:"6px 14px",
              marginBottom:20,
              border:"1px solid rgba(255,255,255,0.25)",
            }}>
              <Download size={13} color="#fff" />
             
            </div>

            <h2 style={{
              fontSize:"clamp(28px,5vw,48px)",
              fontWeight:900,
              color:"#fff",
              fontFamily:"var(--font-display)",
              letterSpacing:"-0.03em",
              lineHeight:1.05,
              marginBottom:16,
            }}>
              DOWNLOAD<br />
              <span style={{ opacity:0.85 }}>OUR APP</span>
            </h2>

            <p style={{
              color:"rgba(255,255,255,0.75)",
              fontSize:15,
              lineHeight:1.65,
              marginBottom:32,
              maxWidth:420,
            }}>
              Watch exclusive content, support your favourite creators, and earn
              rewards — all from your phone, tablet, or desktop. One account,
              every device.
            </p>

           

            {/* Mobile (iOS + Android) */}
            <div style={{ marginBottom:24 }}>
              <p style={{
                color:"rgba(255,255,255,0.55)",
                fontSize:10, fontWeight:700,
                letterSpacing:"0.1em", textTransform:"uppercase",
                marginBottom:10,
              }}>
                📱 Mobile
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {DOWNLOADS.filter(d => d.id === "ios" || d.id === "android").map(d => (
                  <DownloadBtn
                    key={d.id}
                    platform={d}
                    highlighted={d.id === platform}
                    size="large"
                  />
                ))}
              </div>
            </div>

            {/* Desktop (Mac, Windows, Linux) */}
            <div style={{ marginBottom:32 }}>
              <p style={{
                color:"rgba(255,255,255,0.55)",
                fontSize:10, fontWeight:700,
                letterSpacing:"0.1em", textTransform:"uppercase",
                marginBottom:10,
              }}>
                🖥️ Desktop
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {DOWNLOADS.filter(d => ["mac","windows","linux"].includes(d.id)).map(d => (
                  <DownloadBtn
                    key={d.id}
                    platform={d}
                    highlighted={d.id === platform}
                  />
                ))}
              </div>
            </div>

            {/* QR code + scan text */}
            <div style={{
              display:"flex", alignItems:"center", gap:16,
              background:"rgba(255,255,255,0.10)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.20)",
              borderRadius:20, padding:16,
              width:"fit-content",
            }}>
              <QRPlaceholder size={96} />
              <div>
                <p style={{ color:"#fff", fontWeight:700, fontSize:14, marginBottom:4 }}>
                  Scan to download
                </p>
                <p style={{ color:"rgba(255,255,255,0.65)", fontSize:12, lineHeight:1.5 }}>
                  Point your camera at the QR<br />
                  code to install instantly
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:8 }}>
                  <Shield size={11} color="rgba(255,255,255,0.6)" />
                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:10 }}>
                    Safe &amp; verified download
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DOWNLOAD POPUP BANNER — smart, detects platform automatically
// Add <DownloadPopupBanner /> anywhere in your app (e.g. App.tsx or HomeUpdated.tsx)
// ═════════════════════════════════════════════════════════════════════
export function DownloadPopupBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const platform = detectPlatform();

  // Only show on mobile devices, after 4 seconds, once per session
  useEffect(() => {
    if (sessionStorage.getItem("downloadBannerDismissed")) return;
    if (!["ios", "android"].includes(platform)) return; // only mobile gets banner
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [platform]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("downloadBannerDismissed", "1");
  };

  const p = DOWNLOADS.find(d => d.id === platform) ?? DOWNLOADS[0];

  if (!visible || dismissed) return null;

  return (
    <div style={{
      position:"fixed",
      bottom: 80, // above mobile nav bar
      left:"50%", transform:"translateX(-50%)",
      width:"calc(100vw - 32px)", maxWidth:420,
      zIndex:150,
      animation:"fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
    }}>
      <div style={{
        background: p.gradient,
        borderRadius:20,
        padding:"14px 16px",
        boxShadow:"0 16px 48px rgba(0,0,0,0.35)",
        display:"flex", alignItems:"center", gap:12,
        border:"1px solid rgba(255,255,255,0.20)",
      }}>
        {/* App icon */}
        <div style={{
          width:48, height:48, borderRadius:14,
          background:"rgba(255,255,255,0.20)",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
        }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:"#fff", fontWeight:800, fontSize:13, lineHeight:1 }}>
            FandomForge App
          </p>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:11, marginTop:3 }}>
            {platform === "ios" ? "Download on the App Store" : "Get it on Google Play"}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:4 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#FFD700" color="#FFD700" />)}
            <span style={{ color:"rgba(255,255,255,0.65)", fontSize:9, marginLeft:2 }}>4.9</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href={p.href}
          target={p.href !== "#" ? "_blank" : undefined}
          rel="noopener noreferrer"
          style={{
            background:"rgba(255,255,255,0.22)",
            border:"1px solid rgba(255,255,255,0.35)",
            borderRadius:12, padding:"8px 14px",
            color:"#fff", fontWeight:800, fontSize:12,
            textDecoration:"none", flexShrink:0,
            display:"flex", alignItems:"center", gap:6,
          }}
        >
          <Download size={12} />
          Get App
        </a>

        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            background:"rgba(255,255,255,0.15)",
            border:"none", borderRadius:99,
            width:24, height:24, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0, color:"#fff",
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DESKTOP STICKY DOWNLOAD BANNER — shown at top for desktop users
// who haven't downloaded yet. Dismissable.
// ═════════════════════════════════════════════════════════════════════
export function DesktopDownloadBanner() {
  const [visible, setVisible] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    if (sessionStorage.getItem("desktopBannerDismissed")) return;
    if (["ios","android"].includes(platform)) return; // desktop only
    const t = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(t);
  }, [platform]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("desktopBannerDismissed", "1");
  };

  const p = DOWNLOADS.find(d => d.id === platform) ?? DOWNLOADS[2]; // default mac

  if (!visible) return null;

  return (
    <div style={{
      position:"fixed",
      top:16, left:"50%", transform:"translateX(-50%)",
      zIndex:150,
      width:"calc(100vw - 32px)", maxWidth:560,
      animation:"fadeDown 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
    }}>
      <div style={{
        background:"hsl(var(--card))",
        border:"1px solid hsl(var(--card-border))",
        borderRadius:20,
        padding:"12px 16px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
        display:"flex", alignItems:"center", gap:12,
      }}>
        {/* gradient icon */}
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background: p.gradient,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Download size={18} color="#fff" />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"hsl(var(--foreground))" }}>
            Download FandomForge for {p.label}
          </p>
          <p style={{ fontSize:11, color:"hsl(var(--muted-foreground))", marginTop:1 }}>
            Faster, offline-capable, and notification support — {p.badge}
          </p>
        </div>

        <a
          href={p.href}
          target={p.href !== "#" ? "_blank" : undefined}
          rel="noopener noreferrer"
          style={{
            background: p.gradient,
            border:"none", borderRadius:12,
            padding:"8px 16px",
            color:"#fff", fontWeight:700, fontSize:12,
            textDecoration:"none", flexShrink:0,
            display:"flex", alignItems:"center", gap:6,
            whiteSpace:"nowrap",
          }}
        >
          <Download size={12} />
          Download
        </a>

        <button
          onClick={dismiss}
          style={{
            background:"transparent",
            border:"1px solid hsl(var(--border))",
            borderRadius:99, width:28, height:28,
            cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center",
            flexShrink:0, color:"hsl(var(--muted-foreground))",
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}