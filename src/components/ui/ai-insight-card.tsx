import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface AIInsightCardProps {
  title: string
  insight: string
  priority?: "high" | "medium" | "low"
  action?: React.ReactNode
  className?: string
}

export function AIInsightCard({
  title,
  insight,
  priority,
  action,
  className,
}: AIInsightCardProps) {
  const priorityVariant =
    priority === "high"
      ? "destructive"
      : priority === "medium"
      ? "secondary"
      : "outline"

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
          {priority && (
            <Badge variant={priorityVariant} className="capitalize">
              {priority}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {insight}
        </p>
        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}