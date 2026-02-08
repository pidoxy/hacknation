import { useState } from "react";
import { FileSearch, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { searchFacilities, runIDPExtraction } from "../../api";
import type { FacilitySummary, IDPResult } from "../../types";
import FacilityCard from "../../components/FacilityCard";

export default function IDPAgent() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FacilitySummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<IDPResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    setSelectedId(null);
    try {
      const res = await searchFacilities(query, 8);
      setSearchResults(res.results.map((r) => r.facility));
    } finally {
      setSearching(false);
    }
  };

  const handleExtract = async (id: string) => {
    setSelectedId(id);
    setExtracting(true);
    setResult(null);
    try {
      const res = await runIDPExtraction(id);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Intelligent Document Parsing
        </h2>
        <p className="text-sm text-slate-500">
          Select a facility and watch the AI extract & enrich its data
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search facilities…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {searching ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
          Search
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: search results */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Facilities ({searchResults.length})
          </h3>
          {searchResults.map((f) => (
            <div key={f.unique_id} className="flex items-center gap-2">
              <div className="flex-1">
                <FacilityCard facility={f} compact />
              </div>
              <button
                onClick={() => handleExtract(f.unique_id)}
                disabled={extracting}
                className="shrink-0 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Right: extraction result */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Extraction Result
          </h3>
          {extracting && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Running IDP pipeline…
            </div>
          )}
          {!extracting && !result && (
            <p className="text-sm text-slate-400">
              Select a facility and click the arrow to run extraction.
            </p>
          )}
          {result && (
            <div className="space-y-4 text-sm">
              {/* Agent trace */}
              <div>
                <h4 className="font-medium text-slate-600 mb-1">Agent Trace</h4>
                <ul className="space-y-1">
                  {result.agent_trace.map((step: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span className="font-medium">{step.agent_name}</span>
                      <span className="text-slate-400">{step.action}</span>
                      {step.duration_ms && (
                        <span className="text-slate-400">{step.duration_ms}ms</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extracted fields */}
              <div>
                <h4 className="font-medium text-slate-600 mb-1">
                  Extracted Fields
                </h4>
                <div className="max-h-72 overflow-y-auto rounded border bg-slate-50 p-3">
                  <pre className="whitespace-pre-wrap text-xs text-slate-700">
                    {JSON.stringify(result.extracted, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <h4 className="font-medium text-slate-600 mb-1">Confidence</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.confidence_scores).map(
                    ([k, v]) =>
                      (v as number) > 0 && (
                        <span
                          key={k}
                          className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        >
                          {k}: {Math.round((v as number) * 100)}%
                        </span>
                      )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
