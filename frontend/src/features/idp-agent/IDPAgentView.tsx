import { useState } from "react";
import {
    Brain,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Clock,
    FileText,
    Code2,
    Eye,
    Download,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { idpApi } from "@/api/idp";

export default function IDPAgentView() {
    const [selectedFacilityId, setSelectedFacilityId] = useState<string>();
    const [activeTab, setActiveTab] = useState<"extracted" | "trace" | "schema">("extracted");
    const [showSchema, setShowSchema] = useState(false);

    // Get demo facilities
    const { data: demoFacilities } = useQuery({
        queryKey: ["demoFacilities"],
        queryFn: async () => {
            const res = await idpApi.demoFacilities();
            return res.data;
        },
    });

    // Get schema
    const { data: schemaData } = useQuery({
        queryKey: ["idpSchema"],
        queryFn: async () => {
            const res = await idpApi.schema();
            return res.data;
        },
    });

    // Extract mutation
    const extractMutation = useMutation({
        mutationFn: async (facilityId: string) => {
            const res = await idpApi.extract(facilityId);
            return res.data;
        },
    });

    const handleExtract = (facilityId: string) => {
        setSelectedFacilityId(facilityId);
        extractMutation.mutate(facilityId);
    };

    const result = extractMutation.data;

    const handleExportJSON = () => {
        const exportData = result || { schema: schemaData, message: "No extraction performed yet" };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `idp-extraction-${selectedFacilityId || "schema"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="px-6 py-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-600" />
                                IDP Agents
                            </h2>
                            <p className="text-sm text-slate-500">
                                Structured extraction from raw facility records
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSchema(!showSchema)}
                                className={`px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 ${showSchema ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200"}`}
                            >
                                <Code2 className="w-3.5 h-3.5 inline mr-1" />
                                {showSchema ? "Hide Schema" : "View Schema"}
                            </button>
                            <button
                                onClick={handleExportJSON}
                                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export JSON
                            </button>
                        </div>
                    </div>

                    {/* Facility Selector */}
                    <div className="mt-3 flex items-center gap-2">
                        <select
                            value={selectedFacilityId || ""}
                            onChange={(e) => e.target.value && handleExtract(e.target.value)}
                            className="flex-1 max-w-lg text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                        >
                            <option value="">Select a facility for IDP extraction...</option>
                            {demoFacilities?.facilities?.map((f: any) => (
                                <option key={f.uniqueId} value={f.uniqueId}>
                                    {f.name} ({f.facilityType}) - {f.capabilitiesCount} caps,{" "}
                                    {f.proceduresCount} procs, {f.equipmentCount} equip
                                </option>
                            ))}
                        </select>
                        {extractMutation.isPending && (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />
                                Extracting...
                            </span>
                        )}
                        {result && (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Structured
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {showSchema && schemaData && (
                <div className="px-6 pb-2">
                    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-auto max-h-64">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-[10px] uppercase">Facility Pydantic Schema</span>
                            <button onClick={() => setShowSchema(false)} className="text-gray-500 hover:text-white text-xs">Close</button>
                        </div>
                        <pre>{JSON.stringify(schemaData, null, 2)}</pre>
                    </div>
                </div>
            )}

            {!result && !extractMutation.isPending && (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Select a facility above to run IDP extraction</p>
                        <p className="text-xs mt-1">The system will parse free-form text into structured data</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="flex-1 flex overflow-hidden px-6 pb-6">
                    {/* Left: Raw Data */}
                    <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-slate-50 rounded-l-2xl">
                        <div className="p-3 border-b border-slate-200 bg-white sticky top-0 rounded-tl-2xl">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Raw CSV Data
                            </h3>
                            <p className="text-xs text-gray-400">Original facility record</p>
                        </div>
                        <div className="p-4">
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                {Object.entries(result.original || {}).map(([key, value]: [string, any]) => {
                                    const isUnstructured = ["capabilities", "procedures", "equipment", "description"].includes(key);
                                    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                                    return (
                                        <div
                                            key={key}
                                            className={`flex border-b border-gray-100 last:border-0 ${
                                                isUnstructured ? "bg-amber-50" : ""
                                            }`}
                                        >
                                            <span className="w-40 text-xs font-mono text-gray-500 p-2 border-r border-gray-100 flex-shrink-0">
                                                {key}
                                            </span>
                                            <span
                                                className={`text-xs p-2 flex-1 break-all ${
                                                    isEmpty ? "text-gray-300 italic" : "text-gray-700"
                                                } ${isUnstructured ? "font-medium text-amber-800" : ""}`}
                                            >
                                                {isEmpty
                                                    ? "empty"
                                                    : Array.isArray(value)
                                                    ? JSON.stringify(value)
                                                    : String(value)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Extracted Data */}
                    <div className="w-1/2 overflow-y-auto bg-white">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-4 sticky top-0 bg-white z-10">
                            <div className="flex gap-4">
                                {[
                                    { id: "extracted", label: "Extracted Data", icon: Eye },
                                    { id: "trace", label: "Agent Trace", icon: Brain },
                                    { id: "schema", label: "Schema", icon: Code2 },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-1 py-3 text-sm border-b-2 transition-colors ${
                                            activeTab === tab.id
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4">
                            {activeTab === "extracted" && (
                                <div className="space-y-4">
                                    {/* Agent Reasoning Trace summary */}
                                    <div className="bg-gray-900 text-white rounded-lg p-3">
                                        <p className="text-xs font-semibold mb-2">AGENT REASONING TRACE</p>
                                        {result.agentTrace?.map((step: any) => (
                                            <div key={step.stepNumber} className="flex items-center gap-2 text-xs py-0.5">
                                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                <span className="text-gray-300">{step.outputSummary}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Confidence Scores */}
                                    <div className="space-y-3">
                                        {Object.entries(result.confidenceScores || {}).map(
                                            ([field, score]: [string, any]) => {
                                                if (field === "overall") return null;
                                                const pct = Math.round(score * 100);
                                                const color =
                                                    pct >= 80 ? "green" : pct >= 50 ? "amber" : "red";
                                                return (
                                                    <div key={field} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium capitalize text-gray-800">
                                                                {field.replace(/_/g, " ")}
                                                            </span>
                                                            <span
                                                                className={`text-xs font-medium px-2 py-0.5 rounded bg-${color}-100 text-${color}-700`}
                                                            >
                                                                {pct}% Confidence
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    pct >= 80
                                                                        ? "bg-green-500"
                                                                        : pct >= 50
                                                                        ? "bg-amber-500"
                                                                        : "bg-red-500"
                                                                }`}
                                                                style={{ width: `${pct}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    {/* Extracted capabilities */}
                                    {result.extracted?.extractedCapabilities && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                                Extracted Capabilities
                                            </h4>
                                            <div className="space-y-2">
                                                {Object.entries(result.extracted.extractedCapabilities).map(
                                                    ([cap, data]: [string, any]) => (
                                                        <div
                                                            key={cap}
                                                            className={`flex items-center justify-between p-2 rounded border ${
                                                                data.available
                                                                    ? "border-green-200 bg-green-50"
                                                                    : "border-gray-200 bg-gray-50"
                                                            }`}
                                                        >
                                                            <span className="text-sm text-gray-700 capitalize">
                                                                {cap.replace(/_/g, " ")}
                                                            </span>
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded ${
                                                                    data.available
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-gray-100 text-gray-500"
                                                                }`}
                                                            >
                                                                {data.available ? "Available" : "N/A"}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evidence from source text */}
                                    {(result.extracted?.extractedEquipment?.length > 0 ||
                                        result.extracted?.extractedProcedures?.length > 0) && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                                Source Evidence
                                            </h4>
                                            <div className="space-y-2">
                                                {result.extracted.extractedEquipment?.slice(0, 4).map((item: any, i: number) => (
                                                    <div key={`eq-${i}`} className="text-xs border rounded-md p-2 bg-white">
                                                        <span className="text-[10px] uppercase text-slate-400">Equipment</span>
                                                        <div className="font-medium text-slate-700">{item.name}</div>
                                                        {item.sourceText && (
                                                            <div className="text-slate-500 mt-1">{item.sourceText}</div>
                                                        )}
                                                    </div>
                                                ))}
                                                {result.extracted.extractedProcedures?.slice(0, 4).map((item: any, i: number) => (
                                                    <div key={`proc-${i}`} className="text-xs border rounded-md p-2 bg-white">
                                                        <span className="text-[10px] uppercase text-slate-400">Procedure</span>
                                                        <div className="font-medium text-slate-700">{item.name}</div>
                                                        {item.sourceText && (
                                                            <div className="text-slate-500 mt-1">{item.sourceText}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Anomalies */}
                                    {result.extracted?.anomaliesDetected?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                Anomalies Detected
                                            </h4>
                                            {result.extracted.anomaliesDetected.map((a: any, i: number) => (
                                                <div key={i} className="bg-red-50 border border-red-200 rounded p-2 mb-1 text-xs text-red-700">
                                                    <span className="font-medium">[{a.severity}]</span> {a.description}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "trace" && (
                                <div className="space-y-3">
                                    {result.agentTrace?.map((step: any) => (
                                        <div key={step.stepNumber} className="border rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-blue-100 text-blue-700 text-xs font-mono px-1.5 py-0.5 rounded">
                                                    Step {step.stepNumber}
                                                </span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {step.agentName}
                                                </span>
                                                {step.durationMs && (
                                                    <span className="text-xs text-gray-400 ml-auto">
                                                        {step.durationMs}ms
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                <span className="font-medium">Action:</span> {step.action}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                <span className="font-medium">Input:</span> {step.inputSummary}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                <span className="font-medium">Output:</span> {step.outputSummary}
                                            </p>
                                            {step.dataSources?.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {step.dataSources.map((src: string) => (
                                                        <span key={src} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                            {src}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {step.citations?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {step.citations.slice(0, 6).map((c: any, idx: number) => (
                                                        <span
                                                            key={`${c.type}-${c.id || c.label}-${idx}`}
                                                            className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md"
                                                        >
                                                            {c.label || c.id || c.type}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "schema" && (
                                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-auto">
                                    <pre>{JSON.stringify(result.pydanticSchema, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
