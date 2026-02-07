import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  sticky?: boolean;
}

export function PageHeader({ title, description, actions, children, sticky = true }: PageHeaderProps) {
  return (
    <div className={cn(
      "bg-background/80 backdrop-blur-xl shadow-[var(--shadow-sm)] z-50",
      sticky && "sticky top-0"
    )}>
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div>}
        </div>
        {children && <div className="pb-4">{children}</div>}
      </div>
    </div>
  );
}
