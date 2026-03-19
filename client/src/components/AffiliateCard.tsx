import { ExternalLink } from "lucide-react";

export interface AffiliateOffer {
  id: number;
  url: string;
  headline: string;
  subtext: string;
  cta: string;
}

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: 0,
    url: "https://track.deriv.com/_-1DpJjc-4Uhi-DaPcIu1xGNd7ZgqdRLk/1/",
    headline: "Trade forex, crypto & more",
    subtext: "Regulated since 1999 · Free demo · No hidden fees",
    cta: "Start trading",
  },
  {
    id: 1,
    url: "https://track.deriv.com/_-1DpJjc-4UgmbEDB3Xr5-mNd7ZgqdRLk/1/",
    headline: "Bitcoin, gold & silver — trade it all",
    subtext: "CFDs & options on 100+ assets · Open a free account",
    cta: "Open free account",
  },
  {
    id: 2,
    url: "https://track.deriv.com/_-1DpJjc-4UjRl-w_1a-yN2Nd7ZgqdRLk/1/",
    headline: "Earn from the markets you follow",
    subtext: "Forex, indices and crypto · Perfect for beginners",
    cta: "Try for free",
  },
  {
    id: 3,
    url: "https://track.deriv.com/_-1DpJjc-4UgaV8y6i5dK8WNd7ZgqdRLk/1/",
    headline: "No-deposit demo account",
    subtext: "Practice risk-free · Switch to real money anytime",
    cta: "Get demo account",
  },
  {
    id: 4,
    url: "https://track.deriv.com/_-1DpJjc-4UhlpmjG3vKHHGNd7ZgqdRLk/1/",
    headline: "Trade smarter with Deriv",
    subtext: "Advanced charts · 24/7 markets · Instant withdrawals",
    cta: "See the platform",
  },
  {
    id: 5,
    url: "https://track.deriv.com/_-1DpJjc-4UjT7xUfR9r0QGNd7ZgqdRLk/1/",
    headline: "Forex & CFDs — start with $5",
    subtext: "Lowest minimum deposit · Zero hidden fees",
    cta: "Start with $5",
  },
];

// All banners use the same pink-to-black diagonal gradient — matching the site theme exactly.
const STYLE = {
  card: "background:linear-gradient(135deg,hsl(340,90%,50%) 0%,#0a0a0a 100%); border:none;",
  badge: "background:rgba(255,255,255,0.15); color:#fff;",
  headline: "color:#ffffff;",
  subtext: "color:rgba(255,255,255,0.65);",
  cta: "background:rgba(255,255,255,0.15); color:#fff;",
  icon: "background:rgba(255,255,255,0.12); color:#fff;",
};

const STYLES = [STYLE, STYLE, STYLE, STYLE, STYLE, STYLE];

interface AffiliateCardProps {
  slotIndex: number;
  variant?: "strip" | "inline" | "sidebar" | "banner";
  className?: string;
}

export function AffiliateCard({
  slotIndex,
  variant = "banner",
  className = "",
}: AffiliateCardProps) {
  const offer = AFFILIATE_OFFERS[slotIndex % AFFILIATE_OFFERS.length];
  const s = STYLES[slotIndex % STYLES.length];

  if (variant === "sidebar") {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block rounded-2xl p-4 group transition-all hover:scale-[1.01] hover:shadow-lg ${className}`}
        style={{ textDecoration: "none", ...parseStyle(s.card) }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={parseStyle(s.badge)}>
            Sponsored · Deriv
          </span>
          <ExternalLink size={12} className="opacity-40 group-hover:opacity-80 transition-opacity"
            style={{ color: parseStyle(s.headline).color }} />
        </div>
        <p className="text-sm font-bold leading-snug mb-1" style={parseStyle(s.headline)}>
          {offer.headline}
        </p>
        <p className="text-xs leading-relaxed mb-3" style={parseStyle(s.subtext)}>
          {offer.subtext}
        </p>
        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-xl transition-opacity group-hover:opacity-90"
          style={parseStyle(s.cta)}>
          {offer.cta} →
        </span>
        <p className="text-[10px] mt-3 leading-tight opacity-30" style={parseStyle(s.headline)}>
          CFDs carry risk. Your capital is at risk.
        </p>
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`flex flex-col rounded-2xl p-4 group aspect-video justify-between transition-all hover:scale-[1.02] hover:shadow-lg ${className}`}
        style={{ textDecoration: "none", ...parseStyle(s.card) }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={parseStyle(s.badge)}>
            Sponsored
          </span>
          <ExternalLink size={12} className="opacity-40 group-hover:opacity-80 transition-opacity"
            style={{ color: parseStyle(s.headline).color }} />
        </div>
        <div>
          <p className="text-sm font-bold leading-snug mb-1" style={parseStyle(s.headline)}>
            {offer.headline}
          </p>
          <p className="text-xs leading-relaxed" style={parseStyle(s.subtext)}>
            {offer.subtext}
          </p>
        </div>
        <span className="inline-block self-start text-xs font-bold px-3 py-1.5 rounded-xl"
          style={parseStyle(s.cta)}>
          {offer.cta} →
        </span>
      </a>
    );
  }

  if (variant === "strip") {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 group shrink-0 w-72 transition-all hover:scale-[1.01] hover:shadow-md ${className}`}
        style={{ textDecoration: "none", ...parseStyle(s.card) }}
      >
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
          style={parseStyle(s.icon)}>
          <ExternalLink size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={parseStyle(s.headline)}>
            {offer.headline}
          </p>
          <p className="text-xs truncate" style={parseStyle(s.subtext)}>
            {offer.subtext}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 whitespace-nowrap"
          style={parseStyle(s.cta)}>
          {offer.cta}
        </span>
      </a>
    );
  }

  // Default: banner (full-width)
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`flex items-center gap-4 rounded-2xl px-5 py-4 group w-full transition-all hover:scale-[1.005] hover:shadow-lg ${className}`}
      style={{ textDecoration: "none", ...parseStyle(s.card) }}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
        style={parseStyle(s.icon)}>
        <ExternalLink size={18} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-bold" style={parseStyle(s.headline)}>
            {offer.headline}
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full hidden sm:inline"
            style={parseStyle(s.badge)}>
            Sponsored · Deriv
          </span>
        </div>
        <p className="text-xs" style={parseStyle(s.subtext)}>{offer.subtext}</p>
      </div>

      {/* CTA */}
      <span className="text-sm font-bold shrink-0 px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-opacity group-hover:opacity-90"
        style={parseStyle(s.cta)}>
        {offer.cta}
        <ExternalLink size={13} />
      </span>
    </a>
  );
}

// Helper — converts inline CSS string to React style object
function parseStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  css.split(";").forEach((rule) => {
    const [prop, ...vals] = rule.split(":");
    if (prop && vals.length) {
      const key = prop.trim().replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      style[key] = vals.join(":").trim();
    }
  });
  return style as React.CSSProperties;
}

// Scrollable strip of all 6 offers — used on Home page slot 1
export function AffiliateStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {AFFILIATE_OFFERS.map((_, i) => (
          <AffiliateCard key={i} slotIndex={i} variant="strip" />
        ))}
      </div>
    </div>
  );
}