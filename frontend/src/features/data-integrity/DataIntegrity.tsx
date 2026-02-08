import { useState } from "react";
import {
    ShieldCheck,
    Database,
    GitMerge,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/api/analysis";
import StatsCard from "@/components/StatsCard";

export default function DataIntegrity() {
    const { data: quality } = useQuery({
        queryKey: ["dataQuality"],
        queryFn: async () => {
            const res = await analysisApi.dataQuality();
            return res.data;
        },
    });

    const { data: anomalies } = useQuery({
        queryKey: ["anomalies"],
        queryFn: async () => {
            const res = await analysisApi.anomalies();
            return res.data;
        },
    });

    if (!quality) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-400">
                Loading data quality metrics...
            </div>
        );
    }

    const fieldCompleteness = quality.completenessByField || {};
    const regionCompleteness = quality.completenessByRegion || {};

    // Sort fields by completeness
    const sortedFields = Object.entries(fieldCompleteness)
        .sort(([, a]: any, [, b]: any) => b - a);

    const sortedRegions = Object.entries(regionCompleteness)
        .sort(([, a]: any, [, b]: any) => b - a);

    return (
        <div className="h-screen overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Data Integrity & Agent Impact
                </h2>
                <p className="text-sm text-gray-500">
                    Data quality assessment and IDP agent enrichment metrics
                </p>
            </div>

            <div className="p-4 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Facilities"
                        value={quality.totalFacilities}
                        subtitle="Raw CSV records"
                        icon={Database}
                    />
                    <StatsCard
                        title="Unique Facilities"
                        value={quality.uniqueFacilities}
                        subtitle={`${quality.duplicatesFound} duplicates resolved`}
                        icon={GitMerge}
                        variant="success"
                    />
                    <StatsCard
                        title="Avg Completeness"
                        value={`${quality.avgCompleteness}%`}
                        subtitle="Across all fields"
                        icon={BarChart3}
                        variant={quality.avgCompleteness > 60 ? "default" : "warning"}
                    />
                    <StatsCard
                        title="Anomalies Found"
                        value={anomalies?.totalAnomalyCount || 0}
                        subtitle={`In ${anomalies?.totalFacilitiesWithAnomalies || 0} facilities`}
                        icon={AlertTriangle}
                        variant="warning"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Field Completeness */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Field Completeness
                        </h3>
                        <div className="space-y-2">
                            {sortedFields.map(([field, pct]: [string, any]) => (
                                <div key={field} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-36 truncate font-mono">
                                        {field}
                                    </span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                pct > 75
                                                    ? "bg-green-500"
                                                    : pct > 40
                                                    ? "bg-amber-500"
                                                    : "bg-red-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                    <span
                                        className={`text-xs font-medium w-12 text-right ${
                                            pct > 75
                                                ? "text-green-600"
                                                : pct > 40
                                                ? "text-amber-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {pct}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Region Completeness */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Region Data Completeness
                        </h3>
                        <div className="space-y-2">
                            {sortedRegions.map(([region, pct]: [string, any]) => (
                                <div key={region} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-32 truncate">
                                        {region}
                                    </span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                pct > 75
                                                    ? "bg-blue-500"
                                                    : pct > 40
                                                    ? "bg-amber-500"
                                                    : "bg-red-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium w-12 text-right text-gray-600">
                                        {pct}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Region Normalization */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        Region Name Normalization
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        Agent automatically resolved {quality.regionVariantsFixed || "multiple"} variant
                        region names into Ghana's 16 official regions
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 text-xs text-gray-500">Raw Value (Before)</th>
                                    <th className="text-center py-2 text-xs text-gray-500"></th>
                                    <th className="text-left py-2 text-xs text-gray-500">Normalized (After)</th>
                                    <th className="text-left py-2 text-xs text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { before: "ASHANTI", after: "Ashanti", status: "fixed" },
                                    { before: "Ashanti Region", after: "Ashanti", status: "fixed" },
                                    { before: "ashanti", after: "Ashanti", status: "fixed" },
                                    { before: "Greater Accra Region", after: "Greater Accra", status: "fixed" },
                                    { before: "greater accra", after: "Greater Accra", status: "fixed" },
                                    { before: "brong ahafo", after: "Bono", status: "fixed" },
                                    { before: "Brong-Ahafo", after: "Bono", status: "fixed" },
                                    { before: "(empty)", after: "Inferred from city", status: "enriched" },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td className="py-2">
                                            <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                                                {row.before}
                                            </code>
                                        </td>
                                        <td className="text-center text-gray-400">→</td>
                                        <td className="py-2">
                                            <code className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                                {row.after}
                                            </code>
                                        </td>
                                        <td className="py-2">
                                            <span
                                                className={`flex items-center gap-1 text-xs ${
                                                    row.status === "fixed"
                                                        ? "text-green-600"
                                                        : "text-blue-600"
                                                }`}
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                {row.status === "fixed" ? "Normalized" : "Enriched"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Anomaly Log */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Detected Anomalies
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {anomalies?.anomalies?.map((a: any, i: number) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/50"
                            >
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                        {a.facilityName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {a.facilityType} | {a.region}
                                    </p>
                                    <ul className="mt-1 space-y-0.5">
                                        {a.anomalies?.map((anomaly: string, j: number) => (
                                            <li key={j} className="text-xs text-amber-700">
                                                {anomaly}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
