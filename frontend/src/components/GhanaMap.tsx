import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polygon, Popup, useMap } from "react-leaflet";
import type { DesertZone, FacilityMapData, RegionPolygon } from "@/types/facility";
import "leaflet/dist/leaflet.css";

interface GhanaMapProps {
    facilities: FacilityMapData[];
    selectedRegion?: string;
    onFacilityClick?: (id: string) => void;
    height?: string;
    className?: string;
    desertZones?: DesertZone[];
    regionPolygons?: RegionPolygon[];
}

const typeColors: Record<string, string> = {
    hospital: "#2563eb",
    clinic: "#22c55e",
    dentist: "#f59e0b",
    farmacy: "#a855f7",
    doctor: "#06b6d4",
    unknown: "#94a3b8",
};

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function GhanaMap({
    facilities,
    selectedRegion,
    onFacilityClick,
    height = "100%",
    className = "",
    desertZones = [],
    regionPolygons = [],
}: GhanaMapProps) {
    const center: [number, number] = [7.9465, -1.0232];
    const zoom = 7;

    return (
        <div className={className} style={{ height }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={center} zoom={zoom} />

                {regionPolygons.map((poly) => (
                    <Polygon
                        key={`poly-${poly.region}`}
                        positions={poly.coords}
                        pathOptions={{
                            color:
                                poly.severity === "critical"
                                    ? "#ef4444"
                                    : poly.severity === "high"
                                    ? "#f59e0b"
                                    : "#60a5fa",
                            fillColor:
                                poly.severity === "critical"
                                    ? "#fecaca"
                                    : poly.severity === "high"
                                    ? "#fde68a"
                                    : "#bfdbfe",
                            fillOpacity: 0.12,
                            weight: 1,
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold">{poly.region}</p>
                                {poly.severity && (
                                    <p className="text-xs text-gray-500">Coverage: {poly.severity}</p>
                                )}
                            </div>
                        </Popup>
                    </Polygon>
                ))}

                {desertZones.map((zone) => (
                    <Circle
                        key={`desert-${zone.region}`}
                        center={[zone.lat, zone.lng]}
                        radius={zone.radiusKm * 1000}
                        pathOptions={{
                            color: zone.severity === "critical" ? "#ef4444" : "#f59e0b",
                            fillColor: zone.severity === "critical" ? "#fecaca" : "#fde68a",
                            fillOpacity: 0.18,
                            weight: 2,
                            dashArray: "6 6",
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold">Medical Desert Zone</p>
                                <p className="text-gray-500">{zone.region}</p>
                                {zone.gaps && zone.gaps.length > 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        Missing: {zone.gaps.slice(0, 3).join(", ")}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Radius: {zone.radiusKm} km
                                </p>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {facilities.map((f) => (
                    <CircleMarker
                        key={f.uniqueId}
                        center={[f.lat, f.lng]}
                        radius={f.hasAnomalies ? 6 : 4}
                        pathOptions={{
                            color: f.hasAnomalies ? "#ef4444" : typeColors[f.facilityType || "unknown"] || "#94a3b8",
                            fillColor: f.hasAnomalies ? "#fca5a5" : typeColors[f.facilityType || "unknown"] || "#94a3b8",
                            fillOpacity: 0.7,
                            weight: f.hasAnomalies ? 2 : 1,
                        }}
                        eventHandlers={{
                            click: () => onFacilityClick?.(f.uniqueId),
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold">{f.name}</p>
                                <p className="text-gray-500 capitalize">{f.facilityType || "Unknown type"}</p>
                                {f.region && <p className="text-gray-500">{f.region}</p>}
                                {f.hasAnomalies && (
                                    <p className="text-red-600 text-xs mt-1">Anomaly Detected</p>
                                )}
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
