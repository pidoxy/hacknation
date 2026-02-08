import { MapPin, AlertTriangle, Building } from "lucide-react";
import clsx from "clsx";
import type { FacilitySummary } from "../types";

interface Props {
  facility: FacilitySummary;
  onClick?: () => void;
  compact?: boolean;
}

export default function FacilityCard({ facility: f, onClick, compact }: Props) {
  const pct = Math.round(f.data_completeness * 100);
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-xl border bg-white transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-800">
            {f.name}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <Building size={12} />
            <span className="capitalize">{f.facility_type ?? "unknown"}</span>
            {f.address_region && (
              <>
                <MapPin size={12} />
                <span>
                  {f.address_city ? `${f.address_city}, ` : ""}
                  {f.address_region}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Completeness badge */}
        <span
          className={clsx(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            pct >= 60
              ? "bg-emerald-100 text-emerald-700"
              : pct >= 30
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {pct}%
        </span>
      </div>

      {!compact && (
        <>
          {/* Specialties */}
          {f.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {f.specialties.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                >
                  {s}
                </span>
              ))}
              {f.specialties.length > 4 && (
                <span className="text-[11px] text-slate-400">
                  +{f.specialties.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Anomaly flag */}
          {f.has_anomalies && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle size={12} />
              Anomalies detected
            </div>
          )}
        </>
      )}
    </div>
  );
}
