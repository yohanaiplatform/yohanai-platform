import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("rounded-2xl shadow-sm p-8", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-0">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  )
}