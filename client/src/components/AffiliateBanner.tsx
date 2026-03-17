import { useEffect, useRef } from "react";

// All 6 affiliate banner scripts
export const AFFILIATE_BANNERS = [
  {
    id: "banner-3089",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UgvJxWBfogBImNd7ZgqdRLk&media=3089&campaign=1",
  },
  {
    id: "banner-3080",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3080&campaign=1",
  },
  {
    id: "banner-3009",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3009&campaign=1",
  },
  {
    id: "banner-3003",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=3003&campaign=1",
  },
  {
    id: "banner-2996",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjVShowrXl8BGNd7ZgqdRLk&media=2996&campaign=1",
  },
  {
    id: "banner-2914",
    src: "https://js.partnershipsprogram.com/javascript.php?prefix=-1DpJjc-4UjzqbYFgbz_omNd7ZgqdRLk&media=2914&campaign=1",
  },
];

/**
 * Build a self-contained HTML document that runs the affiliate script.
 * We inject this via srcdoc so the script runs inside its own document
 * context — this completely avoids the "document.write on async script" error.
 */
function buildIframeHtml(scriptSrc: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body>
<script type="text/javascript" src="${scriptSrc}"><\/script>
</body>
</html>`;
}

interface AffiliateBannerProps {
  /** Which banner index (0–5) to show */
  index: number;
  /** Visual height variant */
  size?: "sm" | "md" | "lg";
  /** Extra classes on the wrapper div */
  className?: string;
}

const heightMap = { sm: 90, md: 110, lg: 150 };

export function AffiliateBanner({
  index,
  size = "md",
  className = "",
}: AffiliateBannerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const banner = AFFILIATE_BANNERS[index % AFFILIATE_BANNERS.length];
  const height = heightMap[size];

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Setting srcdoc gives the iframe its own document context.
    // The affiliate script can safely call document.write() inside it.
    iframe.srcdoc = buildIframeHtml(banner.src);
  }, [banner.src]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/20 ${className}`}
      style={{ minHeight: height }}
      aria-label="Sponsored content"
    >
      {/* Subtle sponsored label */}
      <span
        className="absolute top-1.5 right-2 z-10 pointer-events-none select-none"
        style={{
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground) / 0.40)",
        }}
      >
        Sponsored
      </span>

      <iframe
        ref={iframeRef}
        title={`ad-${banner.id}`}
        scrolling="no"
        frameBorder="0"
        style={{
          width: "100%",
          height,
          border: "none",
          display: "block",
          background: "transparent",
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}

/** All 6 banners in a responsive grid */
export function AffiliateBannerGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {AFFILIATE_BANNERS.map((_, i) => (
        <AffiliateBanner key={i} index={i} size="md" />
      ))}
    </div>
  );
}

/** Horizontal scrollable strip for between-section placement */
export function AffiliateBannerStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 overflow-x-auto pb-1 ${className}`}
      style={{ msOverflowStyle: "none", scrollbarWidth: "none" } as React.CSSProperties}
    >
      {AFFILIATE_BANNERS.map((_, i) => (
        <div key={i} style={{ flexShrink: 0, width: 300 }}>
          <AffiliateBanner index={i} size="sm" />
        </div>
      ))}
    </div>
  );
}