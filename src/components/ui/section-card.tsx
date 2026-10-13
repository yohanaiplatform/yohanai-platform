import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SectionCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("rounded-2xl print:[--card-spacing:--spacing(3)] print:shadow-none", className)}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4 print:pb-1">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </CardHeader>
      <div className="section-divider mx-6 border-t border-border" />
      <CardContent className="pt-4 print:pt-1">
        {children}
      </CardContent>
    </Card>
  )
}