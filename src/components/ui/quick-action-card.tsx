import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface QuickActionCardProps {
  title: string
  description?: string
  icon: ReactNode
  className?: string
}

export function QuickActionCard({
  title,
  description,
  icon,
  className,
}: QuickActionCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer hover:border-primary hover:bg-muted/40",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}