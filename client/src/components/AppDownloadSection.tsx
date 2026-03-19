// =====================================================================
// client/src/components/AppDownloadSection.tsx
// =====================================================================

import { useState, useEffect } from "react";
import { X, Download, Zap, Shield, Star } from "lucide-react";

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
// Download entries
// ─────────────────────────────────────────────────────────────────────
const DOWNLOADS = [
  {
    id: "ios",
    label: "App Store",
    sublabel: "Download on the",
    icon: "apple",
    badge: "iOS 14+",
    href: "#",
    gradient: "linear-gradient(135deg,#1a1a1a,#3a3a3a)",
  },
  {
    id: "android",
    label: "Google Play",
    sublabel: "Get it on",
    icon: "google",
    badge: "Android 8+",
    href: "#",
    gradient: "linear-gradient(135deg,#01875f,#34a853)",
  },
  {
    id: "mac",
    label: "Mac",
    sublabel: "Download for",
    icon: "monitor",
    badge: "macOS 12+",
    href: "#",
    gradient: "linear-gradient(135deg,hsl(195,100%,38%),hsl(210,90%,50%))",
  },
  {
    id: "windows",
    label: "Windows",
    sublabel: "Download for",
    icon: "monitor",
    badge: "Win 10 / 11",
    href: "#",
    gradient: "linear-gradient(135deg,hsl(210,100%,56%),hsl(230,90%,65%))",
  },
  {
    id: "linux",
    label: "Linux",
    sublabel: "Download for",
    icon: "monitor",
    badge: ".AppImage / .deb",
    href: "#",
    gradient: "linear-gradient(135deg,hsl(350,100%,65%),hsl(320,80%,58%))",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Platform icons
// ─────────────────────────────────────────────────────────────────────
function PlatformIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type === "apple") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  }
  if (type === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-2.61-2.61L3.18 23.76zM.54 1.32C.2 1.7 0 2.28 0 3.04v17.92c0 .76.2 1.34.55 1.72l.09.09 10.04-10.04v-.24L.63 1.23l-.09.09zM20.12 10.53l-2.85-1.62-2.84 2.84 2.84 2.84 2.86-1.63c.82-.46.82-1.22-.01-1.43zM4.17.25l11.88 11.88-2.61 2.61L3.18.21c.35-.04.69.01.99.04z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Download Button
// ─────────────────────────────────────────────────────────────────────
function DownloadBtn({
  platform,
  highlighted = false,
  size = "normal",
}: {
  platform: (typeof DOWNLOADS)[0];
  highlighted?: boolean;
  size?: "normal" | "large";
}) {
  return (
    <a
      href={platform.href}
      target={platform.href !== "#" ? "_blank" : undefined}
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: size === "large" ? "12px 18px" : "10px 14px",
        borderRadius: 14,
        background: highlighted ? platform.gradient : "rgba(255,255,255,0.12)",
        border: highlighted ? "none" : "1px solid rgba(255,255,255,0.22)",
        textDecoration: "none",
        color: "#fff",
        boxShadow: highlighted ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "scale(1.04)";
        el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = highlighted ? "0 8px 24px rgba(0,0,0,0.25)" : "none";
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "rgba(255,255,255,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <PlatformIcon type={platform.icon} size={17} />
      </div>
      <div>
        <p style={{ fontSize: 10, opacity: 0.72, lineHeight: 1, marginBottom: 3, margin: 0 }}>
          {platform.sublabel}
        </p>
        <p style={{ fontSize: size === "large" ? 15 : 13, fontWeight: 700, lineHeight: 1, margin: 0 }}>
          {platform.label}
        </p>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────
// QR Code — large, solid white, NO glass or transparency anywhere
// ─────────────────────────────────────────────────────────────────────
function QRCodeImage() {
  const [imgError, setImgError] = useState(false);

  return (
    /*
      OUTER WRAPPER: solid white only — no backdropFilter, no rgba bg,
      no border that could let colour bleed through.
    */
    <div style={{
      background: "#ffffff",
      borderRadius: 18,
      padding: 14,
      boxShadow: "0 10px 40px rgba(0,0,0,0.32)",
      display: "inline-flex",
      flexShrink: 0,
      lineHeight: 0,
    }}>
      {!imgError ? (
        /*
          ── REPLACE src with your real QR image path ──────────────
          The image itself must be on a WHITE background (which it is
          by default when generated with qrcode npm package).
          Size 180×180 gives a clear, scannable code.
        */
        <img
          src="/qr-code.png"
          alt="Scan to install FandomForge"
          width={180}
          height={180}
          style={{
            display: "block",
            borderRadius: 8,
            imageRendering: "pixelated", // keeps QR dots crisp at any DPR
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Shown only if /public/qr-code.png is missing */
        <div style={{
          width: 180, height: 180,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 10, background: "#f8f8f8", borderRadius: 8,
        }}>
          <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth={1.2}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" />
            <rect x="19" y="14" width="2" height="2" />
            <rect x="14" y="19" width="2" height="2" />
            <rect x="18" y="19" width="3" height="2" />
          </svg>
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
            Copy qr-code.png<br />to /public/
          </p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN EXPORT: AppDownloadSection
// ═════════════════════════════════════════════════════════════════════
export function AppDownloadSection() {
  const platform = detectPlatform();

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg,hsl(350,100%,60%) 0%,hsl(320,80%,52%) 40%,hsl(280,70%,48%) 100%)",
      padding: "72px 0",
    }}>
      {/* Decorative circles — keep far from QR area */}
      <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-80, left:-60, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", position:"relative", zIndex:1 }}>
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",
          gap:48,
          alignItems:"center",
        }}>

          {/* ── LEFT: Phone mockup ─────────────────────────────────── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", position:"relative", minHeight:420 }}>
            <div style={{
              position:"absolute", inset:0,
              background:"rgba(255,255,255,0.07)",
              borderRadius:"60% 40% 50% 50% / 50% 50% 40% 60%",
            }} />

            {/* Phone frame */}
            <div style={{
              position:"relative", zIndex:2,
              width:204, height:394,
              background:"#0a0a0a",
              borderRadius:34,
              border:"3px solid rgba(255,255,255,0.15)",
              boxShadow:"0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
              display:"flex", flexDirection:"column", overflow:"hidden",
            }}>
              <div style={{ width:80, height:22, background:"#0a0a0a", borderRadius:"0 0 14px 14px", margin:"0 auto", flexShrink:0 }} />
              <div style={{
                flex:1, margin:"0 4px 4px",
                background:"linear-gradient(160deg,hsl(350,100%,62%),hsl(320,80%,52%))",
                borderRadius:"0 0 30px 30px",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:14, padding:18,
              }}>
                <div style={{ width:58, height:58, borderRadius:16, background:"rgba(255,255,255,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="white">
                    <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                  </svg>
                </div>
                <p style={{ color:"#fff", fontSize:14, fontWeight:800, letterSpacing:"-0.5px", margin:0 }}>FandomForge</p>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:10, textAlign:"center", margin:0 }}>Content · Creators · Community</p>
                {[85,65,75,50].map((w,i) => (
                  <div key={i} style={{ width:`${w}%`, height:6, background:"rgba(255,255,255,0.2)", borderRadius:3 }} />
                ))}
              </div>
            </div>

            {/* Floating badges — solid dark bg so they're legible */}
            <div style={{ position:"absolute", top:24, right:"4%", zIndex:3, background:"rgba(0,0,0,0.4)", borderRadius:14, padding:"6px 12px", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", gap:6 }}>
              <Star size={12} fill="#FFD700" color="#FFD700" />
              <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>4.9 · 10K+ reviews</span>
            </div>
            <div style={{ position:"absolute", bottom:44, left:"2%", zIndex:3, background:"rgba(0,0,0,0.4)", borderRadius:14, padding:"6px 12px", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", gap:6 }}>
              <Zap size={12} color="#FFD700" fill="#FFD700" />
              <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>Free to download</span>
            </div>
          </div>

          {/* ── RIGHT: Text + buttons + QR ────────────────────────── */}
          <div>
            <h2 style={{
              fontSize:"clamp(32px,5vw,52px)",
              fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", lineHeight:1.05,
              margin:"0 0 16px",
            }}>
              DOWNLOAD<br />
              <span style={{ opacity:0.85 }}>OUR APP</span>
            </h2>

            <p style={{
              color:"rgba(255,255,255,0.78)", fontSize:15,
              lineHeight:1.7, margin:"0 0 32px", maxWidth:440,
            }}>
              Watch exclusive content, support your favourite creators, and earn
              rewards — all from your phone, tablet, or desktop. One account, every device.
            </p>

            {/* Mobile (iOS + Android) */}
            {/*<div style={{ marginBottom:20 }}>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 10px" }}>
                📱 Mobile
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {DOWNLOADS.filter(d => d.id === "ios" || d.id === "android").map(d => (
                  <DownloadBtn key={d.id} platform={d} highlighted={d.id === platform} size="large" />
                ))}
              </div>
            </div>*/}

            {/* Desktop */}
            <div style={{ marginBottom:40 }}>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 10px" }}>
                {/*🖥️ Desktop*/}
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {DOWNLOADS.filter(d => ["mac","windows","linux"].includes(d.id)).map(d => (
                  <DownloadBtn key={d.id} platform={d} highlighted={d.id === platform} />
                ))}
              </div>
            </div>

            {/* ── QR Row ── completely free of glass / blur effects ── */}
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>

              {/* QR IMAGE — solid white box, nothing else */}
              <QRCodeImage />

              {/* Text beside QR */}
              <div>
                <p style={{ color:"#fff", fontWeight:800, fontSize:17, margin:"0 0 8px" }}>
                  Scan to install
                </p>
                <p style={{ color:"rgba(255,255,255,0.72)", fontSize:13, lineHeight:1.65, margin:"0 0 12px" }}>
                  Point your phone camera at the QR<br />
                  code — installs like a native app,<br />
                  no App Store required.
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Shield size={13} color="rgba(255,255,255,0.6)" />
                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>
                    Safe &amp; verified PWA install
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
// MOBILE POPUP BANNER
// ═════════════════════════════════════════════════════════════════════
export function DownloadPopupBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    if (sessionStorage.getItem("downloadBannerDismissed")) return;
    if (!["ios", "android"].includes(platform)) return;
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
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", width:"calc(100vw - 32px)", maxWidth:420, zIndex:150, animation:"fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards" }}>
      <div style={{ background:p.gradient, borderRadius:20, padding:"14px 16px", boxShadow:"0 16px 48px rgba(0,0,0,0.35)", display:"flex", alignItems:"center", gap:12, border:"1px solid rgba(255,255,255,0.2)" }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:"#fff", fontWeight:800, fontSize:13, lineHeight:1, margin:"0 0 4px" }}>FandomForge App</p>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:11, margin:"0 0 4px" }}>
            {platform === "ios" ? "Install from Safari — Add to Home Screen" : "Scan QR or tap to install"}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#FFD700" color="#FFD700" />)}
            <span style={{ color:"rgba(255,255,255,0.65)", fontSize:9, marginLeft:2 }}>4.9</span>
          </div>
        </div>
        <a href={p.href} target={p.href !== "#" ? "_blank" : undefined} rel="noopener noreferrer"
          style={{ background:"rgba(255,255,255,0.22)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:12, padding:"8px 14px", color:"#fff", fontWeight:800, fontSize:12, textDecoration:"none", flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
          <Download size={12}/> Install
        </a>
        <button onClick={dismiss} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:99, width:26, height:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#fff" }}>
          <X size={12}/>
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DESKTOP STICKY BANNER
// ═════════════════════════════════════════════════════════════════════
export function DesktopDownloadBanner() {
  const [visible, setVisible] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    if (sessionStorage.getItem("desktopBannerDismissed")) return;
    if (["ios","android"].includes(platform)) return;
    const t = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(t);
  }, [platform]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("desktopBannerDismissed", "1");
  };

  const p = DOWNLOADS.find(d => d.id === platform) ?? DOWNLOADS[2];
  if (!visible) return null;

  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:150, width:"calc(100vw - 32px)", maxWidth:560, animation:"fadeDown 0.4s cubic-bezier(0.22,1,0.36,1) forwards" }}>
      <div style={{ background:"hsl(var(--card,#1a1a2e))", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:"12px 16px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:p.gradient, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Download size={18} color="#fff"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"hsl(var(--foreground,#fff))", margin:"0 0 2px" }}>
            Download FandomForge for {p.label}
          </p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:0 }}>
            Offline-capable, faster, push notifications — {p.badge}
          </p>
        </div>
        <a href={p.href} target={p.href !== "#" ? "_blank" : undefined} rel="noopener noreferrer"
          style={{ background:p.gradient, border:"none", borderRadius:12, padding:"8px 16px", color:"#fff", fontWeight:700, fontSize:12, textDecoration:"none", flexShrink:0, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
          <Download size={12}/> Download
        </a>
        <button onClick={dismiss} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.2)", borderRadius:99, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"rgba(255,255,255,0.6)" }}>
          <X size={13}/>
        </button>
      </div>
    </div>
  );
}