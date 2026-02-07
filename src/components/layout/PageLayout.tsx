import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function PageLayout({ children, header, sidebar, fullWidth, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {header}
      <main className={cn(
        "flex-1",
        !fullWidth && "max-w-5xl mx-auto w-full px-4 sm:px-6 py-6",
        className
      )}>
        {sidebar ? (
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 min-w-0">{children}</div>
            <aside className="w-full xl:w-80 xl:shrink-0 xl:sticky xl:top-20 xl:self-start">
              {sidebar}
            </aside>
          </div>
        ) : children}
      </main>
    </div>
  );
}
