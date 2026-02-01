import { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
    title: string;
    subtitle?: string | React.ReactNode;
    icon?: Icon;
    iconColor?: string; // Optional override for icon color class default is text-primary
    titleClassName?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    id?: string;
}

export function DashboardSection({
    title,
    subtitle,
    icon: IconComponent,
    iconColor = "text-primary",
    titleClassName,
    action,
    children,
    className,
    id
}: DashboardSectionProps) {
    return (
        <section id={id} className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500 w-full", className)}>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        {IconComponent && (
                            <div className={cn("w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", iconColor)}>
                                <IconComponent size={20} weight="fill" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <h2 className={cn("text-xl md:text-2xl font-semibold tracking-tight text-foreground", titleClassName)}>
                                {title}
                            </h2>
                            {subtitle && (typeof subtitle === 'string' ? (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {subtitle}
                                </p>
                            ) : subtitle)}
                        </div>
                    </div>

                    {action && (
                        <div className="shrink-0 pt-1">
                            {action}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="w-full">
                    {children}
                </div>
            </div>
        </section>
    );
}
