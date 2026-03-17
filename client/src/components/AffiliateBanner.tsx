import { useEffect, useRef } from "react";

// All 6 affiliate banner scripts
export const AFFILIATE_BANNERS = [
  {
    id: "banner-3089",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UgvJxWBfogBImNd7ZgqdRLk&media=3089&campaign=1",
    label: "Sponsor A",
  },
  {
    id: "banner-3080",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3080&campaign=1",
    label: "Sponsor B",
  },
  {
    id: "banner-3009",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3009&campaign=1",
    label: "Sponsor C",
  },
  {
    id: "banner-3003",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3003&campaign=1",
    label: "Sponsor D",
  },
  {
    id: "banner-2996",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=2996&campaign=1",
    label: "Sponsor E",
  },
  {
    id: "banner-2914",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjzqbYFgbz_omNd7ZgqdRLk&media=2914&campaign=1",
    label: "Sponsor F",
  },
];

interface AffiliateBannerProps {
  /** Which banner index (0–5) to show */
  index: number;
  /** Visual size variant */
  size?: "sm" | "md" | "lg";
  /** Extra Tailwind classes */
  className?: string;
}

export function AffiliateBanner({ index, size = "md", className = "" }: AffiliateBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const banner = AFFILIATE_BANNERS[index % AFFILIATE_BANNERS.length];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear old content
    container.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = banner.src;
    script.async = true;

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [banner.src]);

  const sizeClasses = {
    sm: "min-h-[80px]",
    md: "min-h-[100px]",
    lg: "min-h-[140px]",
  }[size];

  return (
    <div
      className={`affiliate-banner-wrap relative w-full overflow-hidden rounded-2xl ${sizeClasses} ${className}`}
      aria-label={`Sponsored by ${banner.label}`}
    >
      {/* Subtle sponsor label */}
      <span className="absolute top-1.5 right-2 text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest z-10 pointer-events-none select-none">
        Sponsored
      </span>
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
    </div>
  );
}

/** Renders ALL 6 banners in a responsive grid — use in footer / sidebar */
export function AffiliateBannerGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {AFFILIATE_BANNERS.map((_, i) => (
        <AffiliateBanner key={i} index={i} size="md" />
      ))}
    </div>
  );
}

/** Horizontal scrollable strip — great for mobile between-section ads */
export function AffiliateBannerStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {AFFILIATE_BANNERS.map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px]">
          <AffiliateBanner index={i} size="sm" />
        </div>
      ))}
    </div>
  );
}