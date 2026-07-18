import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex-1 space-y-4 p-4 md:p-8 overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}