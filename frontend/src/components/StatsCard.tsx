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
        default: "bg-white border-gray-200",
        warning: "bg-amber-50 border-amber-200",
        critical: "bg-red-50 border-red-200",
        success: "bg-green-50 border-green-200",
    };

    return (
        <div className={cn("border rounded-xl p-4", variants[variant], className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">{title}</span>
                {Icon && <Icon className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {trend && (
                    <span
                        className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded",
                            trend.positive
                                ? "text-green-700 bg-green-100"
                                : "text-red-700 bg-red-100"
                        )}
                    >
                        {trend.value}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}
