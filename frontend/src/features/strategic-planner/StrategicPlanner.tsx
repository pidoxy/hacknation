import { useEffect, useMemo, useState } from "react";
import {
    Target,
    TrendingDown,
    Bed,
    Heart,
    Baby,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Building2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analysisApi } from "@/api/analysis";
import { facilitiesApi } from "@/api/facilities";
import { plansApi } from "@/api/plans";
import StatsCard from "@/components/StatsCard";

const CAPABILITY_COLORS: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    underserved: "bg-amber-100 text-amber-800",
    adequate: "bg-green-100 text-green-800",
};

const ASSETS = [
    { id: "mri_unit_04", name: "Mobile MRI Unit #04", status: "READY", detail: "Idle (Sector 1 Depot)", color: "green" },
    { id: "trauma_surgeon", name: "Dr. Sarah Chen (Trauma)", status: "READY", detail: "Available from Oct 1", color: "green" },
    { id: "cold_chain_truck", name: "Vaccine Cold Chain Truck", status: "HOLD", detail: "Requires Maintenance", color: "amber" },
];

const ACTIONS = [
    "Deploy mobile unit to priority district",
    "Coordinate referral routes and transport",
    "Schedule staffing rotation",
    "Procure missing equipment",
    "Establish local triage protocol",
];

export default function StrategicPlanner() {
    const [selectedCell, setSelectedCell] = useState<{ region: string; capability: string } | null>(null);
    const [planTitle, setPlanTitle] = useState("Regional Deployment Plan");
    const [planRegion, setPlanRegion] = useState<string>("");
    const [planCapability, setPlanCapability] = useState<string>("");
    const [planPriority, setPlanPriority] = useState<"High" | "Medium" | "Low">("High");
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [planNotes, setPlanNotes] = useState("");
    const [planOutput, setPlanOutput] = useState<any>(null);
    const [planStep, setPlanStep] = useState(0);

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

    const { data: plansData, refetch: refetchPlans } = useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const res = await plansApi.list();
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

    useEffect(() => {
        if (selectedCell) {
            setPlanRegion(selectedCell.region);
            setPlanCapability(selectedCell.capability);
            setPlanPriority("High");
        }
    }, [selectedCell]);

    useEffect(() => {
        if (!planRegion && regions.length > 0) {
            setPlanRegion(regions[0]);
        }
        if (!planCapability && capabilities.length > 0) {
            setPlanCapability(capabilities[0]);
        }
    }, [planRegion, planCapability, regions, capabilities]);

    const toggleSelection = (value: string, list: string[], setter: (v: string[]) => void) => {
        if (list.includes(value)) {
            setter(list.filter((v) => v !== value));
        } else {
            setter([...list, value]);
        }
    };

    const generatePlan = async () => {
        const plan = {
            title: planTitle,
            region: planRegion,
            capability_gap: planCapability,
            priority: planPriority,
            assets: selectedAssets,
            actions: selectedActions,
            notes: planNotes,
            created_at: new Date().toISOString(),
        };
        try {
            const res = await plansApi.create(plan);
            setPlanOutput(res.data);
            refetchPlans();
            return res.data;
        } catch {
            setPlanOutput(plan);
            return plan;
        }
    };

    const exportPlan = async () => {
        const plan = planOutput || (await generatePlan());
        const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deployment-plan-${(plan.region || "region").toLowerCase().replace(/\\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const steps = ["Scope", "Assets", "Actions", "Review"];
    const canNext =
        (planStep === 0 && planTitle.trim() && planRegion && planCapability) ||
        planStep === 1 ||
        planStep === 2 ||
        planStep === 3;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="px-6 py-4 space-y-4">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Strategic Resource Planner
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                BETA v2.4
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500">
                            Dataset: {stats?.total || 0} Facilities Analyzed · Gap Matrix & Allocation
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const exportData = {
                                    matrix,
                                    capabilities,
                                    regions,
                                    recommendations: desertData?.recommendations,
                                    totalCritical,
                                    totalUnderserved,
                                    generatedAt: new Date().toISOString(),
                                };
                                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "ghana-medical-desert-analysis.json";
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                        >
                            Export Dataset
                        </button>
                        <button
                            onClick={async () => {
                                if (!planRegion || !planCapability) return;
                                await generatePlan();
                                setPlanStep(3);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            Quick Deploy Plan
                        </button>
                    </div>
                </div>
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
                        title="Critical Capability Gaps"
                        value={`${totalCritical}`}
                        subtitle="Region-capability pairs at zero"
                        variant="warning"
                        icon={Bed}
                        trend={{ value: `${regions.length} regions analyzed`, positive: false }}
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
                        {/* Plan Builder */}
                        <div className="bg-white rounded-md border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Deployment Plan Builder</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                        Step {planStep + 1} of {steps.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Stepper */}
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {steps.map((s, i) => (
                                        <div key={s} className="flex items-center gap-2">
                                            <span
                                                className={`w-5 h-5 flex items-center justify-center rounded-md border ${
                                                    i <= planStep
                                                        ? "border-blue-300 bg-blue-50 text-blue-700"
                                                        : "border-slate-200 text-slate-400"
                                                }`}
                                            >
                                                {i + 1}
                                            </span>
                                            <span className={i === planStep ? "text-slate-700" : "text-slate-400"}>
                                                {s}
                                            </span>
                                            {i < steps.length - 1 && <span className="text-slate-300">/</span>}
                                        </div>
                                    ))}
                                </div>

                                {planStep === 0 && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Plan Title</p>
                                            <input
                                                value={planTitle}
                                                onChange={(e) => setPlanTitle(e.target.value)}
                                                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Region</p>
                                                <select
                                                    value={planRegion}
                                                    onChange={(e) => setPlanRegion(e.target.value)}
                                                    className="w-full text-sm border border-slate-200 rounded-md px-2 py-2"
                                                >
                                                    {regions.map((r: string) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Gap Focus</p>
                                                <select
                                                    value={planCapability}
                                                    onChange={(e) => setPlanCapability(e.target.value)}
                                                    className="w-full text-sm border border-slate-200 rounded-md px-2 py-2"
                                                >
                                                    {capabilities.map((c: string) => (
                                                        <option key={c} value={c}>
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Priority</p>
                                            <div className="flex gap-2">
                                                {(["High", "Medium", "Low"] as const).map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPlanPriority(p)}
                                                        className={`text-xs px-3 py-1 rounded-md border ${
                                                            planPriority === p
                                                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                                                : "border-slate-200 text-slate-600"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {planStep === 1 && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Select Assets</p>
                                        <div className="space-y-2">
                                            {ASSETS.map((asset) => (
                                                <label
                                                    key={asset.id}
                                                    className="flex items-center justify-between text-xs text-slate-700 border border-slate-200 rounded-md px-2 py-2"
                                                >
                                                    <span>{asset.name}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssets.includes(asset.name)}
                                                        onChange={() => toggleSelection(asset.name, selectedAssets, setSelectedAssets)}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {planStep === 2 && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Select Actions</p>
                                            <div className="space-y-2">
                                                {ACTIONS.map((action) => (
                                                    <label
                                                        key={action}
                                                        className="flex items-center justify-between text-xs text-slate-700 border border-slate-200 rounded-md px-2 py-2"
                                                    >
                                                        <span>{action}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedActions.includes(action)}
                                                            onChange={() => toggleSelection(action, selectedActions, setSelectedActions)}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Notes</p>
                                            <textarea
                                                value={planNotes}
                                                onChange={(e) => setPlanNotes(e.target.value)}
                                                rows={3}
                                                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2"
                                                placeholder="Add operational considerations, dependencies, or partners."
                                            />
                                        </div>
                                    </div>
                                )}

                                {planStep === 3 && (
                                    <div className="space-y-3">
                                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2">
                                            <p className="font-semibold text-slate-700">Plan Summary</p>
                                            <p>Title: {planTitle}</p>
                                            <p>Region: {planRegion}</p>
                                            <p>Gap: {planCapability}</p>
                                            <p>Priority: {planPriority}</p>
                                            <p>Assets: {selectedAssets.length}</p>
                                            <p>Actions: {selectedActions.length}</p>
                                        </div>
                                        {planOutput && (
                                            <pre className="text-[11px] bg-white border border-slate-200 rounded-md p-2 overflow-auto">
                                                {JSON.stringify(planOutput, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <button
                                        onClick={() => setPlanStep(Math.max(0, planStep - 1))}
                                        disabled={planStep === 0}
                                        className="text-xs px-3 py-2 border border-slate-200 rounded-md disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-3 h-3 inline mr-1" />
                                        Back
                                    </button>
                                    <div className="flex gap-2">
                                        {planStep === steps.length - 1 ? (
                                            <>
                                                <button
                                                    onClick={generatePlan}
                                                    className="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Generate Plan
                                                </button>
                                                <button
                                                    onClick={exportPlan}
                                                    className="text-xs px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50"
                                                >
                                                    Export Plan
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => canNext && setPlanStep(Math.min(steps.length - 1, planStep + 1))}
                                                className="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                disabled={!canNext}
                                            >
                                                Next
                                                <ChevronRight className="w-3 h-3 inline ml-1" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plan History */}
                        <div className="bg-white rounded-md border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Plan History</h3>
                                <span className="text-xs text-slate-400">
                                    {plansData?.plans?.length || 0} plans
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(plansData?.plans || []).slice(0, 6).map((p: any) => (
                                    <div key={p.id} className="border border-slate-200 rounded-md p-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-700">{p.title}</span>
                                            <span className="text-slate-400">{p.priority}</span>
                                        </div>
                                        <div className="text-slate-500">
                                            {p.region} · {p.capability_gap}
                                        </div>
                                        <div className="text-slate-400">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {(!plansData || plansData.plans?.length === 0) && (
                                    <div className="text-xs text-slate-400">No saved plans yet.</div>
                                )}
                            </div>
                        </div>

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
                                            <button
                                                onClick={() => {
                                                    setPlanRegion(rec.region);
                                                    setPlanCapability(rec.gap);
                                                    setPlanPriority(rec.severity === "CRITICAL" ? "High" : "Medium");
                                                    setPlanStep(0);
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                                className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50"
                                            >
                                                Edit Plan
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const plan = {
                                                        title: `Deploy ${rec.gap} - ${rec.region}`,
                                                        region: rec.region,
                                                        capability_gap: rec.gap,
                                                        priority: rec.severity === "CRITICAL" ? "High" : "Medium",
                                                        assets: [],
                                                        actions: [`Deploy ${rec.gap.toLowerCase()} services to ${rec.region}`],
                                                        notes: rec.recommendation || "",
                                                        created_at: new Date().toISOString(),
                                                        status: "approved",
                                                    };
                                                    try {
                                                        await plansApi.create(plan);
                                                        refetchPlans();
                                                    } catch {}
                                                }}
                                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gap Resolution Impact */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Gap Resolution Summary
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mt-2">
                                <div className="bg-red-50 rounded-lg p-2 text-center">
                                    <p className="text-xl font-bold text-red-700">{totalCritical}</p>
                                    <p className="text-[11px] text-red-500">Critical Gaps</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-2 text-center">
                                    <p className="text-xl font-bold text-amber-700">{totalUnderserved}</p>
                                    <p className="text-[11px] text-amber-500">Underserved</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2 text-center">
                                    <p className="text-xl font-bold text-green-700">
                                        {matrix.length - totalCritical - totalUnderserved}
                                    </p>
                                    <p className="text-[11px] text-green-500">Adequate</p>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-slate-500">
                                <p>
                                    Addressing critical gaps would impact an estimated{" "}
                                    <span className="font-semibold text-slate-700">
                                        {desertData?.recommendations
                                            ? (desertData.recommendations.reduce((sum: number, r: any) => sum + (r.populationAffected || 0), 0) / 1_000_000).toFixed(1)
                                            : "0"}M
                                    </span>{" "}
                                    people across{" "}
                                    <span className="font-semibold text-slate-700">
                                        {desertData?.critical_regions?.length || 0}
                                    </span>{" "}
                                    regions.
                                </p>
                            </div>
                        </div>

                        {/* Top Resourced Regions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Top Resourced Regions</h3>
                                <span className="text-xs text-slate-400">By facility count</span>
                            </div>
                            <div className="space-y-2">
                                {regionStats && Object.entries(regionStats)
                                    .sort(([, a]: any, [, b]: any) => b.totalFacilities - a.totalFacilities)
                                    .slice(0, 5)
                                    .map(([region, data]: [string, any]) => (
                                        <div key={region} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{region}</p>
                                                <p className="text-xs text-gray-500">{data.totalFacilities} facilities · {data.specialtiesAvailable?.length || 0} specialties</p>
                                            </div>
                                            <span
                                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                    data.isMedicalDesert
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                }`}
                                            >
                                                {data.isMedicalDesert ? "GAPS" : "OK"}
                                            </span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
