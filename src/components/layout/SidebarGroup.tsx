interface SidebarGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarGroup({ title, children }: SidebarGroupProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}