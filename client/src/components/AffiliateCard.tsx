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
    subtext: "Lowest minimum deposit in the industry · Zero hidden fees",
    cta: "Start with $5",
  },
];

const GRADIENTS = [
  "linear-gradient(135deg, hsl(262,80%,52%), hsl(220,80%,58%))",
  "linear-gradient(135deg, hsl(28,90%,48%), hsl(38,95%,52%))",
  "linear-gradient(135deg, hsl(172,60%,36%), hsl(195,70%,42%))",
  "linear-gradient(135deg, hsl(340,70%,48%), hsl(310,65%,52%))",
  "linear-gradient(135deg, hsl(220,75%,48%), hsl(240,80%,55%))",
  "linear-gradient(135deg, hsl(145,55%,36%), hsl(165,60%,40%))",
];

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
  const gradient = GRADIENTS[slotIndex % GRADIENTS.length];

  if (variant === "sidebar") {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block rounded-2xl p-4 group transition-opacity hover:opacity-90 ${className}`}
        style={{ background: gradient, textDecoration: "none" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
            Sponsored · Deriv
          </span>
          <ExternalLink size={12} className="text-white/60 group-hover:text-white transition-colors" />
        </div>
        <p className="text-sm font-bold text-white leading-snug mb-1">
          {offer.headline}
        </p>
        <p className="text-xs text-white/75 leading-relaxed mb-3">
          {offer.subtext}
        </p>
        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 text-white group-hover:bg-white/30 transition-colors">
          {offer.cta} →
        </span>
        <p className="text-[10px] text-white/40 mt-3 leading-tight">
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
        className={`flex flex-col rounded-2xl p-4 group aspect-video justify-between transition-opacity hover:opacity-90 ${className}`}
        style={{ background: gradient, textDecoration: "none" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
            Sponsored
          </span>
          <ExternalLink size={12} className="text-white/60 group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-snug mb-1">
            {offer.headline}
          </p>
          <p className="text-xs text-white/75 leading-relaxed">
            {offer.subtext}
          </p>
        </div>
        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 text-white self-start group-hover:bg-white/30 transition-colors">
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
        className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 group shrink-0 w-72 transition-opacity hover:opacity-90 ${className}`}
        style={{ background: gradient, textDecoration: "none" }}
      >
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-white/20">
          <ExternalLink size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {offer.headline}
          </p>
          <p className="text-xs text-white/70 truncate">
            {offer.subtext}
          </p>
        </div>
        <span className="text-xs font-bold text-white shrink-0 px-3 py-1.5 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors whitespace-nowrap">
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
      className={`flex items-center gap-4 rounded-2xl px-5 py-4 group w-full transition-opacity hover:opacity-90 ${className}`}
      style={{ background: gradient, textDecoration: "none" }}
    >
      {/* Icon blob */}
      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-white/20">
        <ExternalLink size={18} className="text-white" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-white">{offer.headline}</p>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline">
            Sponsored · Deriv
          </span>
        </div>
        <p className="text-xs text-white/75">{offer.subtext}</p>
      </div>

      {/* CTA button */}
      <span className="text-sm font-bold shrink-0 px-4 py-2 rounded-xl bg-white/20 text-white group-hover:bg-white/30 transition-colors whitespace-nowrap flex items-center gap-1.5">
        {offer.cta}
        <ExternalLink size={13} />
      </span>
    </a>
  );
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