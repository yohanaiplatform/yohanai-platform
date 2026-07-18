import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
export interface StatCardProps {
title: string
value: string | number
description?: string
icon?: React.ReactNode
trend?: {
value: string
direction: "up" | "down" | "neutral"
}
className?: string
}
export function StatCard({
title,
value,
description,
icon,
trend,
className,
}: StatCardProps) {
const TrendIcon =
trend?.direction === "up"
? TrendingUp
: trend?.direction === "down"
? TrendingDown
: Minus
const trendColor =
trend?.direction === "up"
? "text-emerald-500 dark:text-emerald-400"
: trend?.direction === "down"
? "text-red-500 dark:text-red-400"
: "text-muted-foreground"
return (
<Card className={cn("rounded-2xl p-6 shadow-sm", className)}>
<CardContent className="p-0 space-y-4">
<div className="flex items-start justify-between">
<span className="text-sm text-muted-foreground">
{title}
</span>
{icon && (
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
{icon}
</div>
)}
</div>
    <div className="text-2xl md:text-3xl font-bold tracking-tight">
      {value}
    </div>

    {(description || trend) && (
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        {description && (
          <span className="text-sm text-muted-foreground">
            {description}
          </span>
        )}
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
            <TrendIcon className="h-4 w-4" aria-label={`Trend ${trend.direction}`} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    )}
  </CardContent>
</Card>
)
}