import { useState, useMemo } from "react";
import {
    Search,
    Filter,
    AlertTriangle,
    MapPin,
    CheckCircle2,
    X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { facilitiesApi } from "@/api/facilities";
import GhanaMap from "@/components/GhanaMap";
import { analysisApi } from "@/api/analysis";
import { REGION_CENTROIDS } from "@/data/regionCentroids";
import type { DesertZone, RegionPolygon } from "@/types/facility";

const REGIONS = [
    "Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Northern",
    "Volta", "Bono", "Bono East", "Upper East", "Upper West", "Oti",
    "Ahafo", "Western North", "North East", "Savannah",
];

const FACILITY_TYPES = ["hospital", "clinic", "dentist", "farmacy", "doctor"];

export default function FacilityExplorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>();
    const [selectedType, setSelectedType] = useState<string>();
    const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedFacility, setSelectedFacility] = useState<any>(null);

    // Search results
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["facilitySearch", searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return null;
            const res = await facilitiesApi.search(searchQuery, 20);
            return res.data;
        },
        enabled: searchQuery.length > 2,
    });

    // Filtered list
    const { data: listData, isLoading: isListing } = useQuery({
        queryKey: ["facilityList", selectedRegion, selectedType, showAnomaliesOnly, page],
        queryFn: async () => {
            const res = await facilitiesApi.list({
                region: selectedRegion,
                facilityType: selectedType,
                hasAnomalies: showAnomaliesOnly || undefined,
                page,
                pageSize: 30,
            });
            return res.data;
        },
    });

    // Map data
    const { data: mapData } = useQuery({
        queryKey: ["mapData"],
        queryFn: async () => {
            const res = await facilitiesApi.mapData();
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

    // Facility detail
    const { data: facilityDetail } = useQuery({
        queryKey: ["facilityDetail", selectedFacility],
        queryFn: async () => {
            if (!selectedFacility) return null;
            const res = await facilitiesApi.get(selectedFacility);
            return res.data;
        },
        enabled: !!selectedFacility,
    });

    const displayFacilities = searchQuery.trim()
        ? searchResults?.results?.map((r: any) => r.facility) || []
        : listData?.facilities || [];

    const activeFilters = [
        selectedRegion && { label: `Region: ${selectedRegion}`, clear: () => setSelectedRegion(undefined) },
        selectedType && { label: `Type: ${selectedType}`, clear: () => setSelectedType(undefined) },
        showAnomaliesOnly && { label: "Anomalies Only", clear: () => setShowAnomaliesOnly(false) },
    ].filter(Boolean);

    const desertZones: DesertZone[] = useMemo(() => {
        if (!regionStats) return [];
        return Object.entries(regionStats)
            .filter(([, stats]: any) => stats.isMedicalDesert)
            .map(([region, stats]: any) => {
                const centroid = REGION_CENTROIDS[region];
                if (!centroid) return null;
                const severity = stats.totalFacilities === 0 ? "critical" : "high";
                const radiusKm = severity === "critical" ? 80 : 45;
                return {
                    region,
                    lat: centroid[0],
                    lng: centroid[1],
                    radiusKm,
                    severity,
                    gaps: stats.desertGaps || [],
                };
            })
            .filter(Boolean) as DesertZone[];
    }, [regionStats]);

    const regionPolygons: RegionPolygon[] = useMemo(() => {
        if (!regionStats || !mapData) return [];
        const byRegion: Record<string, { lats: number[]; lngs: number[] }> = {};
        (mapData || []).forEach((f: any) => {
            if (!f.region || f.lat == null || f.lng == null) return;
            if (!byRegion[f.region]) byRegion[f.region] = { lats: [], lngs: [] };
            byRegion[f.region].lats.push(f.lat);
            byRegion[f.region].lngs.push(f.lng);
        });
        return Object.entries(regionStats).map(([region, stats]: any) => {
            const bounds = byRegion[region];
            let minLat = 0, maxLat = 0, minLng = 0, maxLng = 0;
            if (bounds && bounds.lats.length > 1) {
                minLat = Math.min(...bounds.lats);
                maxLat = Math.max(...bounds.lats);
                minLng = Math.min(...bounds.lngs);
                maxLng = Math.max(...bounds.lngs);
            } else {
                const centroid = REGION_CENTROIDS[region] || [7.9, -1.0];
                minLat = centroid[0] - 0.4;
                maxLat = centroid[0] + 0.4;
                minLng = centroid[1] - 0.5;
                maxLng = centroid[1] + 0.5;
            }
            const padLat = 0.15;
            const padLng = 0.15;
            const coords: [number, number][] = [
                [minLat - padLat, minLng - padLng],
                [minLat - padLat, maxLng + padLng],
                [maxLat + padLat, maxLng + padLng],
                [maxLat + padLat, minLng - padLng],
            ];
            const severity = stats.isMedicalDesert
                ? stats.totalFacilities === 0
                    ? "critical"
                    : "high"
                : "normal";
            return { region, coords, severity };
        });
    }, [regionStats, mapData]);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="px-6 py-4">
                <div className="grid grid-cols-[260px_1fr] gap-4">
                    {/* Filter Sidebar */}
                    <aside className="rounded-md border border-slate-200 bg-white shadow-sm overflow-y-auto">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-2 tracking-wide">
                                    <Filter className="w-4 h-4" />
                                    FILTERS
                                </h3>
                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedRegion(undefined);
                                            setSelectedType(undefined);
                                            setShowAnomaliesOnly(false);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Reset All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Facility Type */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Facility Type</p>
                                {FACILITY_TYPES.map((type) => (
                                    <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="facilityType"
                                            checked={selectedType === type}
                                            onChange={() => setSelectedType(selectedType === type ? undefined : type)}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm text-slate-700 capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Region */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Region</p>
                                <select
                                    value={selectedRegion || ""}
                                    onChange={(e) => setSelectedRegion(e.target.value || undefined)}
                                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                                >
                                    <option value="">All Regions</option>
                                    {REGIONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Detected Gaps */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Detected Gaps</p>
                                <label className="flex items-center gap-2 py-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showAnomaliesOnly}
                                        onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm text-slate-700">Anomalies Only</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Find facilities & identify gaps
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Filter, compare, and review coverage anomalies across Ghana.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-md px-4 py-3 border border-slate-200">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Show clinics in Ghana with MRI but no verified backup power"
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                                <button
                                    onClick={() => {
                                        if (searchQuery.trim().length > 2) {
                                            // Force refetch by toggling search
                                            const q = searchQuery;
                                            setSearchQuery("");
                                            setTimeout(() => setSearchQuery(q), 0);
                                        }
                                    }}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Active filters */}
                            {activeFilters.length > 0 && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Interpreted</span>
                                    {activeFilters.map((f: any, i) => (
                                        <span
                                            key={i}
                                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                                        >
                                            {f.label}
                                            <button onClick={f.clear}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                    <p className="text-[11px] uppercase text-slate-400">Facilities Found</p>
                                    <p className="text-lg font-semibold text-slate-900">{listData?.total || 0}</p>
                                </div>
                                <div className="rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2">
                                    <p className="text-[11px] uppercase text-amber-700/70">Anomalies Detected</p>
                                    <p className="text-lg font-semibold text-amber-700">
                                        {displayFacilities.filter((f: any) => f.hasAnomalies).length}
                                    </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                    <p className="text-[11px] uppercase text-slate-400">Medical Deserts</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {(listData as any)?.medicalDeserts ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[420px_1fr] gap-4 h-[calc(100vh-270px)] min-h-[520px] items-stretch">
                            {/* Facility List */}
                            <div className="space-y-3 overflow-y-auto pr-1 h-full min-h-0">
                                {displayFacilities.map((f: any) => {
                                    const completeness = Math.round(f.dataCompleteness * 100);
                                    return (
                                        <div
                                            key={f.uniqueId}
                                            onClick={() => setSelectedFacility(f.uniqueId)}
                                            className={`relative rounded-md border p-4 cursor-pointer transition-all hover:shadow-md bg-white ${
                                                selectedFacility === f.uniqueId ? "border-blue-300" : "border-slate-200"
                                            }`}
                                        >
                                            <div
                                                className={`absolute left-0 top-0 h-full w-1.5 rounded-l-md ${
                                                    f.hasAnomalies ? "bg-amber-400" : "bg-emerald-500"
                                                }`}
                                            />
                                            <div className="flex items-start justify-between">
                                                <div className="pl-2">
                                                    <h4 className="font-semibold text-slate-900 text-sm">
                                                        {f.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3" />
                                                        {f.addressCity || "Unknown"}, {f.addressRegion || "Unknown"}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                                        f.hasAnomalies
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                                >
                                                    {f.hasAnomalies ? "Anomaly" : "Data Complete"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2 pl-2">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md capitalize">
                                                    {f.facilityType || "Unknown"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {f.capabilitiesCount} capabilities
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {completeness}% complete
                                                </span>
                                            </div>

                                            {f.specialties && f.specialties.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2 pl-2">
                                                    {f.specialties.slice(0, 4).map((s: string) => (
                                                        <span
                                                            key={s}
                                                            className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {f.specialties.length > 4 && (
                                                        <span className="text-xs text-slate-400">
                                                            +{f.specialties.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-3 flex items-center gap-2 pl-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFacility(f.uniqueId);
                                                    }}
                                                    className="text-xs px-3 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/idp?facility=${f.uniqueId}`, "_self");
                                                    }}
                                                    className="text-xs px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                >
                                                    Run IDP Extraction
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination */}
                                {listData && listData.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 py-4">
                                        <button
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-slate-500">
                                            Page {page} of {listData.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(Math.min(listData.totalPages, page + 1))}
                                            disabled={page === listData.totalPages}
                                            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Map */}
                            <div className="relative rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden h-full min-h-0">
                                <GhanaMap
                                    facilities={mapData || []}
                                    desertZones={desertZones}
                                    regionPolygons={regionPolygons}
                                    onFacilityClick={setSelectedFacility}
                                    height="100%"
                                />
                                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-md shadow-lg p-3 z-[500]">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">MAP LEGEND</p>
                                    <div className="space-y-1">
                                        {[
                                            { color: "#60a5fa", label: "Coverage Zone" },
                                            { color: "#22c55e", label: "Verified Facility" },
                                            { color: "#f59e0b", label: "Anomaly/Suspicious" },
                                            { color: "#94a3b8", label: "Unverified" },
                                            { color: "#ef4444", label: "Medical Desert Zone" },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                ></span>
                                                <span className="text-xs text-gray-600">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {facilityDetail && (
                                    <div className="absolute top-4 right-4 w-[320px] max-h-[calc(100%-2rem)] rounded-md border border-slate-200 bg-white shadow-xl z-[600] overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Facility Detail</h3>
                                            <button
                                                onClick={() => setSelectedFacility(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{facilityDetail.name}</h4>
                                                <p className="text-sm text-gray-500 capitalize">{facilityDetail.facilityType}</p>
                                                <p className="text-sm text-gray-500">
                                                    {facilityDetail.addressCity}, {facilityDetail.normalizedRegion}
                                                </p>
                                            </div>

                                            {facilityDetail.specialties?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Specialties</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {facilityDetail.specialties.map((s: string) => (
                                                            <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {facilityDetail.capabilities?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Capabilities</p>
                                                    <ul className="space-y-1">
                                                        {facilityDetail.capabilities.map((c: string, i: number) => (
                                                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                {c}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {(facilityDetail.procedures?.length > 0 ||
                                                facilityDetail.equipment?.length > 0) && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Row Evidence</p>
                                                    <div className="space-y-2">
                                                        {facilityDetail.procedures?.length > 0 && (
                                                            <div className="text-xs text-gray-600">
                                                                <span className="text-[10px] uppercase text-slate-400">
                                                                    Procedures
                                                                </span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {facilityDetail.procedures.slice(0, 4).map((p: string) => (
                                                                        <span
                                                                            key={p}
                                                                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                                                                        >
                                                                            {p}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {facilityDetail.equipment?.length > 0 && (
                                                            <div className="text-xs text-gray-600">
                                                                <span className="text-[10px] uppercase text-slate-400">
                                                                    Equipment
                                                                </span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {facilityDetail.equipment.slice(0, 4).map((e: string) => (
                                                                        <span
                                                                            key={e}
                                                                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                                                                        >
                                                                            {e}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {facilityDetail.anomalies?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-red-500 mb-1">Anomalies Detected</p>
                                                    {facilityDetail.anomalies.map((a: string, i: number) => (
                                                        <div key={i} className="text-xs text-red-600 bg-red-50 rounded p-2 mb-1">
                                                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                                                            {a}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Data Completeness</p>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${facilityDetail.dataCompleteness * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {Math.round(facilityDetail.dataCompleteness * 100)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
