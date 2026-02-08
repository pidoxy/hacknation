import { useState } from "react";
import {
    Target,
    TrendingDown,
    Bed,
    Heart,
    Baby,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Truck,
    User,
    Snowflake,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/api/analysis";
import { facilitiesApi } from "@/api/facilities";
import StatsCard from "@/components/StatsCard";

const CAPABILITY_COLORS: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    underserved: "bg-amber-100 text-amber-800",
    adequate: "bg-green-100 text-green-800",
};

export default function StrategicPlanner() {
    const [selectedCell, setSelectedCell] = useState<{ region: string; capability: string } | null>(null);
    const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y">("6M");

    const { data: desertData } = useQuery({
        queryKey: ["medicalDeserts"],
        queryFn: async () => {
            const res = await analysisApi.medicalDeserts();
            return res.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ["facilityStats"],
        queryFn: async () => {
            const res = await facilitiesApi.stats();
            return res.data;
        },
    });

    const { data: regionStats } = useQuery({
        queryKey: ["regionStats"],
        queryFn: async () => {
            const res = await analysisApi.regionStats();
            return res.data;
        },
    });

    // Build matrix data
    const capabilities = desertData?.capabilities || [];
    const regions = desertData?.regions || [];
    const matrix = desertData?.matrix || [];

    const getCell = (region: string, capability: string) => {
        return matrix.find(
            (m: any) => m.region === region && m.capability === capability
        );
    };

    // Compute overview stats
    const totalCritical = matrix.filter((m: any) => m.status === "critical").length;
    const totalUnderserved = matrix.filter((m: any) => m.status === "underserved").length;

    // Get surgical deficit
    const surgicalRegions = matrix.filter((m: any) => m.capability === "Surgery");
    const surgicalDeficit = surgicalRegions.filter((m: any) => m.status === "critical").length;

    // Get maternal gap
    const maternalRegions = matrix.filter((m: any) => m.capability === "Maternal/Obstetric");
    const maternalGap = maternalRegions.filter((m: any) => m.status === "critical" || m.status === "underserved").length;

    return (
        <div className="h-screen overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Strategic Resource Planner
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            BETA v2.4
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500">
                        Sub-Saharan Region (Q3 2024) - Gap Analysis & AI Allocation
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                        Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        Run Simulation
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <StatsCard
                        title="Surgical Capacity Deficit"
                        value={`-${Math.round((surgicalDeficit / Math.max(regions.length, 1)) * 100)}%`}
                        subtitle="Regions without surgical services"
                        variant="critical"
                        icon={TrendingDown}
                        trend={{ value: `${surgicalDeficit} regions`, positive: false }}
                    />
                    <StatsCard
                        title="ICU Bed Shortage"
                        value={`${totalCritical}`}
                        subtitle="Critical capability gaps"
                        variant="warning"
                        icon={Bed}
                        trend={{ value: "Critical gaps", positive: false }}
                    />
                    <StatsCard
                        title="Maternal Health Gap"
                        value={`-${Math.round((maternalGap / Math.max(regions.length, 1)) * 100)}%`}
                        subtitle="Regions with inadequate maternal care"
                        variant="warning"
                        icon={Heart}
                    />
                    <StatsCard
                        title="Pediatric Care Coverage"
                        value={`${Math.round(((regions.length - (matrix.filter((m: any) => m.capability === "Pediatrics" && m.status !== "adequate").length)) / Math.max(regions.length, 1)) * 100)}%`}
                        subtitle="Regions with pediatric services"
                        variant="success"
                        icon={Baby}
                        trend={{ value: "Adequate", positive: true }}
                    />
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Desert Matrix - Left */}
                    <div className="col-span-7 bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">
                                Medical Desert Matrix
                            </h3>
                            <span className="text-xs text-gray-400">
                                Region x Capability | {totalCritical} critical,{" "}
                                {totalUnderserved} underserved
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 pr-4 font-medium text-gray-500 w-32">
                                            Region
                                        </th>
                                        {capabilities.map((cap: string) => (
                                            <th
                                                key={cap}
                                                className="text-center px-1 py-2 font-medium text-gray-500"
                                                style={{ writingMode: "vertical-lr", maxWidth: "30px" }}
                                            >
                                                {cap}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {regions.map((region: string) => (
                                        <tr key={region} className="border-b border-gray-50">
                                            <td className="py-1.5 pr-2 font-medium text-gray-700 text-xs">
                                                {region}
                                            </td>
                                            {capabilities.map((cap: string) => {
                                                const cell = getCell(region, cap);
                                                return (
                                                    <td key={cap} className="text-center px-0.5 py-1">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedCell({ region, capability: cap })
                                                            }
                                                            className={`w-8 h-6 rounded text-xs font-medium ${
                                                                CAPABILITY_COLORS[cell?.status || "critical"]
                                                            } hover:opacity-80 transition-opacity`}
                                                        >
                                                            {cell?.facilityCount ?? 0}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded bg-red-100"></span> Critical (0)
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded bg-amber-100"></span> Underserved (1-2)
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded bg-green-100"></span> Adequate (3+)
                            </span>
                        </div>
                    </div>

                    {/* AI Recommendations - Right */}
                    <div className="col-span-5 space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">
                                    AI Recommendations
                                </h3>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                    High Confidence
                                </span>
                            </div>

                            <div className="space-y-3">
                                {desertData?.recommendations?.slice(0, 5).map((rec: any) => (
                                    <div
                                        key={rec.id}
                                        className={`border rounded-lg p-3 ${
                                            rec.severity === "CRITICAL"
                                                ? "border-red-200 bg-red-50/50"
                                                : "border-amber-200 bg-amber-50/50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-xs font-bold ${
                                                    rec.severity === "CRITICAL"
                                                        ? "text-red-600"
                                                        : "text-amber-600"
                                                }`}
                                            >
                                                {rec.severity} PRIORITY
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {rec.region}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Deploy {rec.gap} services
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Population affected: {rec.populationAffected?.toLocaleString()}
                                            {rec.nearestRegionWithCapability && (
                                                <span>
                                                    {" "}| Nearest: {rec.nearestRegionWithCapability}
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">
                                                Modify
                                            </button>
                                            <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Projected Impact */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Projected Impact Analysis
                            </h3>
                            <p className="text-2xl font-bold text-gray-900">
                                30% Wait Time Reduction
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    -4.5 Hrs Avg Wait
                                </span>
                                <span className="text-xs text-blue-600">
                                    +12k Patients Served
                                </span>
                            </div>
                            <div className="flex gap-1 mt-3">
                                {(["3M", "6M", "1Y"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeRange(t)}
                                        className={`text-xs px-3 py-1 rounded ${
                                            timeRange === t
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Available Assets */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Available Assets</h3>
                                <button className="text-xs text-blue-600">View All</button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { icon: Truck, name: "Mobile MRI Unit #04", status: "READY", detail: "Idle (Sector 1 Depot)", color: "green" },
                                    { icon: User, name: "Dr. Sarah Chen (Trauma)", status: "READY", detail: "Available from Oct 1", color: "green" },
                                    { icon: Snowflake, name: "Vaccine Cold Chain Truck", status: "HOLD", detail: "Requires Maintenance", color: "amber" },
                                ].map((asset) => (
                                    <div key={asset.name} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                        <asset.icon className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{asset.name}</p>
                                            <p className="text-xs text-gray-500">{asset.detail}</p>
                                        </div>
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                asset.color === "green"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}
                                        >
                                            {asset.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
