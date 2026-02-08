import { useState } from "react";
import {
    Search,
    Filter,
    AlertTriangle,
    MapPin,
    Building2,
    Stethoscope,
    ChevronDown,
    X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { facilitiesApi } from "@/api/facilities";
import GhanaMap from "@/components/GhanaMap";

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

    return (
        <div className="h-screen flex">
            {/* Filter Sidebar */}
            <div className="w-[250px] border-r border-gray-200 bg-white overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
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
                        <p className="text-xs font-medium text-gray-500 mb-2">Facility Type</p>
                        {FACILITY_TYPES.map((type) => (
                            <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="facilityType"
                                    checked={selectedType === type}
                                    onChange={() => setSelectedType(selectedType === type ? undefined : type)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm text-gray-700 capitalize">{type}</span>
                            </label>
                        ))}
                    </div>

                    {/* Region */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Region</p>
                        <select
                            value={selectedRegion || ""}
                            onChange={(e) => setSelectedRegion(e.target.value || undefined)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                        >
                            <option value="">All Regions</option>
                            {REGIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* AI Detected Gaps */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">AI Detected Gaps</p>
                        <label className="flex items-center gap-2 py-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showAnomaliesOnly}
                                onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
                                className="accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">Anomalies Only</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 bg-white border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                        Find facilities & identify gaps
                    </h2>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Show clinics in Ghana with MRI but no verified backup power"
                            className="flex-1 bg-transparent text-sm outline-none"
                        />
                        <button className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Active filters */}
                    {activeFilters.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">INTERPRETED:</span>
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

                    <p className="text-xs text-gray-500 mt-2">
                        {listData?.total || 0} Facilities Found
                        {" | "}
                        {displayFacilities.filter((f: any) => f.hasAnomalies).length} Anomalies Detected
                    </p>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Facility List */}
                    <div className="w-1/2 overflow-y-auto p-4 space-y-3">
                        {displayFacilities.map((f: any) => (
                            <div
                                key={f.uniqueId}
                                onClick={() => setSelectedFacility(f.uniqueId)}
                                className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                                    f.hasAnomalies
                                        ? "border-amber-200 bg-amber-50/50"
                                        : selectedFacility === f.uniqueId
                                        ? "border-blue-300 bg-blue-50/50"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            {f.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" />
                                            {f.addressCity || "Unknown"}, {f.addressRegion || "Unknown"}
                                        </p>
                                    </div>
                                    {f.hasAnomalies && (
                                        <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                            <AlertTriangle className="w-3 h-3" />
                                            Anomaly
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded capitalize">
                                        {f.facilityType || "Unknown"}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {f.capabilitiesCount} capabilities
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {Math.round(f.dataCompleteness * 100)}% complete
                                    </span>
                                </div>

                                {f.specialties && f.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {f.specialties.slice(0, 4).map((s: string) => (
                                            <span
                                                key={s}
                                                className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                        {f.specialties.length > 4 && (
                                            <span className="text-xs text-gray-400">
                                                +{f.specialties.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

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
                                <span className="text-sm text-gray-500">
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
                    <div className="w-1/2 border-l border-gray-200">
                        <GhanaMap
                            facilities={mapData || []}
                            onFacilityClick={setSelectedFacility}
                            height="100%"
                        />
                    </div>
                </div>
            </div>

            {/* Facility Detail Panel */}
            {facilityDetail && (
                <div className="w-[350px] border-l border-gray-200 bg-white overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Facility Detail</h3>
                        <button
                            onClick={() => setSelectedFacility(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4 space-y-4">
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
                                            <Stethoscope className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                            {c}
                                        </li>
                                    ))}
                                </ul>
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
    );
}

function Sparkles({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        </svg>
    );
}
