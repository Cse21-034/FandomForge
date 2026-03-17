import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
  color?: "primary" | "accent" | "green" | "gold";
}

const colorMap = {
  primary: {
    bg: "hsl(var(--primary) / 0.10)",
    icon: "hsl(var(--primary))",
    glow: "hsl(var(--primary) / 0.15)",
  },
  accent: {
    bg: "hsl(195 100% 50% / 0.10)",
    icon: "hsl(195 100% 42%)",
    glow: "hsl(195 100% 50% / 0.15)",
  },
  green: {
    bg: "hsl(150 60% 42% / 0.10)",
    icon: "hsl(150 60% 38%)",
    glow: "hsl(150 60% 42% / 0.15)",
  },
  gold: {
    bg: "hsl(43 100% 55% / 0.10)",
    icon: "hsl(43 100% 45%)",
    glow: "hsl(43 100% 55% / 0.15)",
  },
};

export function StatCard({ title, value, icon: Icon, description, trend, color = "primary" }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className="stat-card-glow bg-card border border-card-border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-none">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{ background: colors.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: colors.icon }} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}