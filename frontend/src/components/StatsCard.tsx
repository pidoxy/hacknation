import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: { value: string; positive: boolean };
    variant?: "default" | "warning" | "critical" | "success";
    className?: string;
}

export default function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
    className,
}: StatsCardProps) {
    const variants = {
        default: {
            card: "bg-white border-slate-200",
            iconWrap: "bg-slate-100 text-slate-600",
            trend: "bg-slate-100 text-slate-600",
        },
        warning: {
            card: "bg-white border-amber-200",
            iconWrap: "bg-amber-100 text-amber-600",
            trend: "bg-amber-100 text-amber-700",
        },
        critical: {
            card: "bg-white border-red-200",
            iconWrap: "bg-red-100 text-red-600",
            trend: "bg-red-100 text-red-700",
        },
        success: {
            card: "bg-white border-emerald-200",
            iconWrap: "bg-emerald-100 text-emerald-600",
            trend: "bg-emerald-100 text-emerald-700",
        },
    };

    return (
        <div
            className={cn(
                "rounded-md border p-4 shadow-sm",
                variants[variant].card,
                className
            )}
        >
            <div className="flex items-start justify-between">
                {Icon && (
                    <div
                        className={cn(
                            "h-9 w-9 rounded-md flex items-center justify-center",
                            variants[variant].iconWrap
                        )}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                {trend && (
                    <span
                        className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            trend.positive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        )}
                    >
                        {trend.value}
                    </span>
                )}
            </div>
            <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    {title}
                </p>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {value}
                </div>
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
