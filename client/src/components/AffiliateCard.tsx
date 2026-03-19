import { ExternalLink } from "lucide-react";

export interface AffiliateOffer {
  id: number;
  url: string;
  headline: string;
  subtext: string;
  cta: string;
  accentColor: string;
}

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: 0,
    url: "https://track.deriv.com/_-1DpJjc-4Uhi-DaPcIu1xGNd7ZgqdRLk/1/",
    headline: "Trade forex, crypto & more",
    subtext: "Deriv — regulated trading platform active since 1999. Free demo account, no hidden fees.",
    cta: "Start trading",
    accentColor: "hsl(262 80% 58%)",
  },
  {
    id: 1,
    url: "https://track.deriv.com/_-1DpJjc-4UgmbEDB3Xr5-mNd7ZgqdRLk/1/",
    headline: "Bitcoin, gold & silver — trade it all",
    subtext: "Deriv offers CFDs and options on 100+ assets. Open a free account in minutes.",
    cta: "Open free account",
    accentColor: "hsl(38 90% 48%)",
  },
  {
    id: 2,
    url: "https://track.deriv.com/_-1DpJjc-4UjRl-w_1a-yN2Nd7ZgqdRLk/1/",
    headline: "Earn from the markets you follow",
    subtext: "Deriv lets you trade forex, indices and crypto — even as a complete beginner.",
    cta: "Try for free",
    accentColor: "hsl(220 70% 52%)",
  },
  {
    id: 3,
    url: "https://track.deriv.com/_-1DpJjc-4UgaV8y6i5dK8WNd7ZgqdRLk/1/",
    headline: "No-deposit demo account",
    subtext: "Practice trading risk-free on Deriv. Switch to real money when you're ready.",
    cta: "Get demo account",
    accentColor: "hsl(172 60% 40%)",
  },
  {
    id: 4,
    url: "https://track.deriv.com/_-1DpJjc-4UhlpmjG3vKHHGNd7ZgqdRLk/1/",
    headline: "Trade smarter with Deriv",
    subtext: "Advanced charts, 24/7 synthetic markets, and instant withdrawals. Trusted by millions.",
    cta: "See the platform",
    accentColor: "hsl(340 65% 52%)",
  },
  {
    id: 5,
    url: "https://track.deriv.com/_-1DpJjc-4UjT7xUfR9r0QGNd7ZgqdRLk/1/",
    headline: "Forex & CFDs — start with $5",
    subtext: "Deriv has one of the lowest minimum deposits in the industry. Zero hidden fees.",
    cta: "Start with $5",
    accentColor: "hsl(145 55% 40%)",
  },
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
  const trackingUrl = offer.url;

  if (variant === "sidebar") {
    return (
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors group ${className}`}
        style={{ textDecoration: "none" }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${offer.accentColor}18`,
              color: offer.accentColor,
            }}
          >
            Sponsored
          </span>
          <ExternalLink
            size={12}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
          />
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug mb-1">
          {offer.headline}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          {offer.subtext}
        </p>
        <span
          className="text-xs font-medium"
          style={{ color: offer.accentColor }}
        >
          {offer.cta} →
        </span>
        <p className="text-[10px] text-muted-foreground/50 mt-2 leading-tight">
          CFDs carry risk. Your capital is at risk.
        </p>
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`flex flex-col rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors group aspect-video justify-between ${className}`}
        style={{ textDecoration: "none" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${offer.accentColor}18`,
              color: offer.accentColor,
            }}
          >
            Sponsored
          </span>
          <ExternalLink
            size={12}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-snug mb-1">
            {offer.headline}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {offer.subtext}
          </p>
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: offer.accentColor }}
        >
          {offer.cta} →
        </span>
      </a>
    );
  }

  if (variant === "strip") {
    return (
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`flex items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-3 hover:border-border transition-colors group shrink-0 w-72 ${className}`}
        style={{ textDecoration: "none" }}
      >
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: `${offer.accentColor}20` }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: offer.accentColor }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {offer.headline}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {offer.subtext}
          </p>
        </div>
        <span
          className="text-xs font-medium shrink-0"
          style={{ color: offer.accentColor }}
        >
          {offer.cta} →
        </span>
      </a>
    );
  }

  // Default: banner (full-width)
  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`flex items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-4 hover:border-border transition-colors group w-full ${className}`}
      style={{ textDecoration: "none" }}
    >
      <div
        className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: `${offer.accentColor}18` }}
      >
        <div
          className="w-4 h-4 rounded"
          style={{ background: offer.accentColor }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground">
            {offer.headline}
          </p>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${offer.accentColor}15`,
              color: offer.accentColor,
            }}
          >
            Sponsored
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{offer.subtext}</p>
      </div>
      <span
        className="text-sm font-medium shrink-0 flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
        style={{ color: offer.accentColor }}
      >
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