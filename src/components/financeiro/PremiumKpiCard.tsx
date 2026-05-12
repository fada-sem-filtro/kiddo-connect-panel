import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "muted";
  trend?: { delta: number; label?: string };
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  primary: "from-primary/15 to-primary/5 text-primary",
  success: "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  warning: "from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-400",
  danger: "from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-400",
  muted: "from-muted to-muted/40 text-foreground",
};

export function PremiumKpiCard({ title, value, hint, icon, tone = "primary", trend }: Props) {
  const t = TONE[tone];
  return (
    <Card className="rounded-2xl border bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className={cn("p-4 bg-gradient-to-br", t)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide font-semibold opacity-80">{title}</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-foreground tabular-nums truncate">{value}</p>
            {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
            {trend && (
              <p className={cn(
                "text-[11px] mt-1 font-medium",
                trend.delta >= 0 ? "text-emerald-600" : "text-rose-600",
              )}>
                {trend.delta >= 0 ? "▲" : "▼"} {Math.abs(trend.delta).toFixed(1)}% {trend.label || "vs período anterior"}
              </p>
            )}
          </div>
          {icon && (
            <div className="rounded-xl bg-background/60 p-2 shadow-sm shrink-0">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
