import { useState, useEffect, useRef, useMemo } from "react";
import {
    Send,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Building2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import { facilitiesApi } from "@/api/facilities";
import { analysisApi } from "@/api/analysis";
import GhanaMap from "@/components/GhanaMap";
import { formatTtsText, stripEmoji } from "@/lib/utils";
import { REGION_CENTROIDS } from "@/data/regionCentroids";
import type { ChatMessage, GeospatialResult } from "@/types/chat";
import type { DesertZone, RegionPolygon } from "@/types/facility";

export default function CommandCenter() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string>();
    const [isListening, setIsListening] = useState(false);
    const [sttStatus, setSttStatus] = useState<string | null>(null);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
    const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const apiBase = useMemo(() => import.meta.env.VITE_API_URL || "", []);

    // Fetch map data
    const { data: mapData } = useQuery({
        queryKey: ["mapData"],
        queryFn: async () => {
            const res = await facilitiesApi.mapData();
            return res.data;
        },
    });

    // Fetch region stats
    const { data: regionStats } = useQuery({
        queryKey: ["regionStats"],
        queryFn: async () => {
            const res = await analysisApi.regionStats();
            return res.data;
        },
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ["facilityStats"],
        queryFn: async () => {
            const res = await facilitiesApi.stats();
            return res.data;
        },
    });

    // Fetch suggested queries
    const { data: suggested } = useQuery({
        queryKey: ["suggestedQueries"],
        queryFn: async () => {
            const res = await chatApi.suggestedQueries();
            return res.data;
        },
    });

    // Chat mutation
    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await chatApi.query(message, conversationId);
            return res.data;
        },
        onSuccess: (data) => {
            setConversationId(data.conversationId);
            const assistantMsg: ChatMessage = {
                id: Date.now().toString(),
                role: "assistant",
                content: data.answer,
                sources: data.sources,
                agentTrace: data.agentTrace,
                visualizationHint: data.visualizationHint,
                geospatial: data.geospatial,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            if (autoSpeak && data.answer) {
                speakResponse(data.answer, assistantMsg.id);
            }
        },
    });

    const handleSend = () => {
        if (!input.trim() || chatMutation.isPending) return;
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        chatMutation.mutate(input);
        setInput("");
    };

    const handleSuggestionClick = (query: string) => {
        setInput(query);
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: query,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        chatMutation.mutate(query);
    };

    const toggleListening = async () => {
        if (isListening) {
            // Stop recording manually
            if (recorderRef.current && recorderRef.current.state === "recording") {
                recorderRef.current.stop();
            }
            setIsListening(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Pick best supported mime type
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : MediaRecorder.isTypeSupported("audio/mp4")
                        ? "audio/mp4"
                        : "";

            const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(stream, recorderOptions);
            recorderRef.current = recorder;
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                // Clean up stream
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
                recorderRef.current = null;

                const blob = new Blob(chunks, { type: mimeType || "audio/webm" });

                if (blob.size < 100) {
                    setSttStatus("Recording too short — try again");
                    setTimeout(() => setSttStatus(null), 3000);
                    return;
                }

                setSttStatus("Transcribing...");
                const formData = new FormData();
                const ext = mimeType.includes("mp4") ? "mp4" : "webm";
                formData.append("audio", blob, `recording.${ext}`);

                try {
                    const res = await fetch(`${apiBase}/api/voice/stt`, {
                        method: "POST",
                        body: formData,
                    });
                    const data = await res.json();
                    if (data.text) {
                        setInput(data.text);
                        setSttStatus(null);
                    } else if (data.error) {
                        setSttStatus(data.error);
                        setTimeout(() => setSttStatus(null), 4000);
                    } else {
                        setSttStatus("No speech detected — try again");
                        setTimeout(() => setSttStatus(null), 3000);
                    }
                } catch (err) {
                    console.error("STT failed:", err);
                    setSttStatus("Connection error — check backend");
                    setTimeout(() => setSttStatus(null), 4000);
                }
            };

            recorder.start();
            setIsListening(true);
            setSttStatus("Listening... click mic to stop");

            // Auto-stop after 15 seconds
            setTimeout(() => {
                if (recorderRef.current && recorderRef.current.state === "recording") {
                    recorderRef.current.stop();
                    setIsListening(false);
                }
            }, 15000);
        } catch (err) {
            console.error("Microphone not available:", err);
            setSttStatus("Microphone access denied");
            setTimeout(() => setSttStatus(null), 4000);
        }
    };

    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setSpeakingMsgId(null);
    };

    const speakResponse = async (text: string, msgId?: string) => {
        // If already speaking, stop first
        if (isSpeaking) {
            stopSpeaking();
            // If clicking the same message's button, just stop (toggle off)
            if (msgId && msgId === speakingMsgId) return;
        }
        const cleanText = formatTtsText(text).substring(0, 1000);
        setIsSpeaking(true);
        setSpeakingMsgId(msgId || null);
        try {
            const res = await fetch(`${apiBase}/api/voice/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: cleanText }),
            });
            if (!res.ok) throw new Error("TTS request failed");
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
            audio.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
            await audio.play();
        } catch {
            if ("speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1;
                utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
                utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
                return;
            }
            setIsSpeaking(false);
            setSpeakingMsgId(null);
            console.error("TTS failed");
        }
    };

    // Cleanup audio and recorder on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
            if (recorderRef.current && recorderRef.current.state === "recording") {
                recorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Get sorted regions for the sidebar
    const sortedRegions = regionStats
        ? Object.entries(regionStats)
              .map(([region, data]: [string, any]) => ({ region, ...data }))
              .sort((a: any, b: any) => b.totalFacilities - a.totalFacilities)
        : [];

    useEffect(() => {
        if (!selectedRegion && sortedRegions.length > 0) {
            setSelectedRegion(sortedRegions[0].region);
        }
    }, [selectedRegion, sortedRegions]);

    const selectedStats = selectedRegion ? regionStats?.[selectedRegion] : null;
    const coverageKeys = selectedStats?.capabilitiesCoverage
        ? Object.keys(selectedStats.capabilitiesCoverage)
        : [];
    const coveredCount = coverageKeys.filter(
        (k) => (selectedStats?.capabilitiesCoverage?.[k] || 0) > 0
    ).length;
    const coveragePercent = coverageKeys.length
        ? Math.round((coveredCount / coverageKeys.length) * 100)
        : 0;
    const anomalyRate = selectedStats?.totalFacilities
        ? Math.round((selectedStats.anomalyCount / selectedStats.totalFacilities) * 100)
        : 0;

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
        mapData.forEach((f: any) => {
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

    const renderInline = (text: string) => {
        const parts = text.split(/\*\*(.+?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1 ? (
                <strong key={`${part}-${i}`} className="font-semibold text-slate-900">
                    {part}
                </strong>
            ) : (
                part
            )
        );
    };

    const renderMarkdownLite = (text: string) => {
        const cleanText = stripEmoji(text);
        const lines = cleanText.split(/\r?\n/);
        const blocks: Array<
            | { type: "p"; lines: string[] }
            | { type: "ol"; items: string[] }
            | { type: "ul"; items: string[] }
            | { type: "h"; text: string; level: number }
        > = [];
        let current: typeof blocks[number] | null = null;

        const flush = () => {
            if (current) blocks.push(current);
            current = null;
        };

        for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (line.trim() === "") {
                flush();
                continue;
            }
            const headingMatch = line.match(/^\s*(#{1,3})\s+(.*)$/);
            const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
            const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
            const bulletMatch = line.match(/^\s*[•·–—]\s+(.*)$/);
            if (headingMatch) {
                flush();
                blocks.push({ type: "h", text: headingMatch[2], level: headingMatch[1].length });
                continue;
            }
            if (olMatch) {
                if (!current || current.type !== "ol") {
                    flush();
                    current = { type: "ol", items: [] };
                }
                (current as { type: "ol"; items: string[] }).items.push(olMatch[1]);
                continue;
            }
            if (ulMatch || bulletMatch) {
                if (!current || current.type !== "ul") {
                    flush();
                    current = { type: "ul", items: [] };
                }
                const item = (ulMatch ? ulMatch[1] : bulletMatch?.[1]) || "";
                (current as { type: "ul"; items: string[] }).items.push(item);
                continue;
            }
            if (!current || current.type !== "p") {
                flush();
                current = { type: "p", lines: [] };
            }
            (current as { type: "p"; lines: string[] }).lines.push(line);
        }
        flush();

        return (
            <div className="space-y-2">
                {blocks.map((block, i) => {
                if (block.type === "h") {
                    const size =
                        block.level === 1 ? "text-sm font-semibold" : "text-xs font-semibold";
                    return (
                        <div key={`h-${i}`} className={`${size} text-slate-800`}>
                            {renderInline(block.text)}
                        </div>
                    );
                }
                if (block.type === "ol") {
                    return (
                        <ol key={`ol-${i}`} className="list-decimal ml-5 space-y-1">
                            {block.items.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-800">
                                    {renderInline(item)}
                                </li>
                            ))}
                        </ol>
                        );
                    }
                    if (block.type === "ul") {
                        return (
                            <ul key={`ul-${i}`} className="list-disc ml-5 space-y-1">
                                {block.items.map((item, idx) => (
                                    <li key={idx} className="text-sm text-slate-800">
                                        {renderInline(item)}
                                    </li>
                                ))}
                            </ul>
                        );
                    }
                    return (
                        <p key={`p-${i}`} className="text-sm text-slate-800 leading-relaxed">
                            {block.lines.map((l, idx) => (
                                <span key={idx}>
                                    {renderInline(l)}
                                    {idx < block.lines.length - 1 && <br />}
                                </span>
                            ))}
                        </p>
                    );
                })}
            </div>
        );
    };

    const renderGeospatialPanel = (geo: GeospatialResult) => {
        const coords = geo.location?.coords;
        const coordsLabel = coords
            ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`
            : "Location unavailable";
        const within = geo.withinRadius || [];
        const nearest = geo.nearest || [];
        const primaryList = within.length > 0 ? within : nearest;
        const listLabel =
            within.length > 0
                ? `Within ${geo.radiusKm ? Math.round(geo.radiusKm) : ""} km`
                : "Nearest facilities";

        return (
            <div className="bg-white border border-slate-200 rounded-md p-3 text-sm">
                <div className="flex items-center justify-between text-[11px] uppercase text-slate-400">
                    <span>Distance Results</span>
                    <span className="text-slate-500">{listLabel}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">
                        {geo.location?.label || "Custom Location"}
                    </span>
                    <span className="text-slate-400"> · {coordsLabel}</span>
                </div>
                {primaryList.length > 0 ? (
                    <div className="mt-2 space-y-1">
                        {primaryList.slice(0, 8).map((item, idx) => (
                            <div
                                key={`${item.uniqueId || item.name}-${idx}`}
                                className="flex items-center justify-between text-xs text-slate-700"
                            >
                                <div className="truncate">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-slate-400">
                                        {" "}
                                        · {item.region || "Unknown"}
                                    </span>
                                </div>
                                <span className="text-slate-500">
                                    {item.distanceKm != null
                                        ? `${item.distanceKm.toFixed(1)} km`
                                        : "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-2 text-xs text-slate-500">
                        No facilities found for this location.
                    </div>
                )}
                {geo.coldSpots && geo.coldSpots.length > 0 && (
                    <div className="mt-2 border-t border-slate-200 pt-2">
                        <div className="text-[11px] uppercase text-slate-400">
                            Coverage Gaps
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {geo.coldSpots.slice(0, 4).map((spot) => (
                                <span
                                    key={spot.region}
                                    className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md"
                                >
                                    {spot.region}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-slate-50 overflow-hidden">
            <div className="px-2 py-2 h-full w-full">
                <div className="grid grid-cols-[300px_1fr_260px] gap-2 h-full min-h-0 w-full min-w-0">
                    {/* Chat Panel - Left */}
                    <div className="rounded-md border border-slate-200 bg-white shadow-sm flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        Command Center
                                    </h2>
                                    <p className="text-xs text-slate-500">Regional Operations Overview</p>
                                </div>
                                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                    stats ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${stats ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
                                    {stats ? "ONLINE" : "CONNECTING"}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.length === 0 && suggested && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 text-center mt-4">
                                Ask questions about healthcare facilities in Ghana
                            </p>
                            {suggested.queries?.slice(0, 3).map((cat: any) => (
                                <div key={cat.category}>
                                    <p className="text-xs font-medium text-gray-400 mb-2">
                                        {stripEmoji(cat.category)}
                                    </p>
                                    <div className="space-y-1">
                                        {cat.examples?.slice(0, 2).map((q: string) => (
                                            <button
                                                key={q}
                                                onClick={() => handleSuggestionClick(q)}
                                                className="block w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                                            >
                                                {stripEmoji(q)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${msg.role === "user" ? "flex justify-end" : ""}`}
                        >
                            {msg.role === "user" ? (
                                <div className="bg-blue-600 text-white px-4 py-2 rounded-md rounded-br-sm max-w-[85%] text-sm">
                                    {stripEmoji(msg.content)}
                                </div>
                            ) : (
                                <div className="space-y-2 min-w-0 max-w-full overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 rounded-md rounded-bl-sm max-w-full overflow-hidden break-words">
                                        {renderMarkdownLite(msg.content)}
                                    </div>

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="space-y-2 px-1">
                                            <div className="flex flex-wrap gap-1">
                                                {msg.sources.slice(0, 3).map((src, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md"
                                                    >
                                                        {src.facilityName}
                                                    </span>
                                                ))}
                                            </div>
                                            {msg.sources.slice(0, 2).map((src, i) => (
                                                <div
                                                    key={`evidence-${i}`}
                                                    className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-md p-2"
                                                >
                                                    <div className="font-semibold text-slate-700">
                                                        {src.facilityName}
                                                    </div>
                                                    {src.evidence && src.evidence.length > 0 && (
                                                        <div className="mt-1 space-y-1">
                                                            {src.evidence.slice(0, 3).map((e, idx) => (
                                                                <div key={idx}>
                                                                    <span className="text-slate-400 uppercase text-[10px]">
                                                                        {e.field}
                                                                    </span>
                                                                    : {stripEmoji(e.text)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-1 text-[10px] text-slate-400">
                                                        Row ID: {src.rowId || src.facilityId}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.geospatial && (
                                        <div className="px-1">
                                            {renderGeospatialPanel(msg.geospatial)}
                                        </div>
                                    )}

                                    {/* Agent Trace Toggle */}
                                    {msg.agentTrace && msg.agentTrace.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() =>
                                                    setExpandedTrace(
                                                        expandedTrace === msg.id ? null : msg.id
                                                    )
                                                }
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-1"
                                            >
                                                {expandedTrace === msg.id ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                                Agent Trace ({msg.agentTrace.length} steps)
                                            </button>
                                            {expandedTrace === msg.id && (
                                                <div className="mt-2 space-y-1 bg-gray-100 rounded-lg p-2">
                                                    {msg.agentTrace.map((step) => (
                                                        <div
                                                            key={step.stepNumber}
                                                            className="text-xs text-gray-600 flex gap-2"
                                                        >
                                                            <span className="font-mono text-blue-600">
                                                                {step.stepNumber}.
                                                            </span>
                                                            <div>
                                                                <span className="font-medium">
                                                                    {step.agentName}
                                                                </span>
                                                                : {step.outputSummary}
                                                                {step.durationMs && (
                                                                    <span className="text-gray-400 ml-1">
                                                                        ({step.durationMs}ms)
                                                                    </span>
                                                                )}
                                                                {step.citations && step.citations.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {step.citations.slice(0, 6).map((c, idx) => (
                                                                            <span
                                                                                key={`${c.type}-${c.id || c.label}-${idx}`}
                                                                                className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md"
                                                                                title={c.region || c.type}
                                                                            >
                                                                                {c.label || c.id || c.type}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TTS button */}
                                    <button
                                        onClick={() => speakResponse(msg.content, msg.id)}
                                        className={`flex items-center gap-1 text-xs px-1 ${
                                            isSpeaking && speakingMsgId === msg.id
                                                ? "text-red-500 hover:text-red-700"
                                                : "text-gray-400 hover:text-blue-600"
                                        }`}
                                    >
                                        {isSpeaking && speakingMsgId === msg.id ? (
                                            <VolumeX className="w-3 h-3" />
                                        ) : (
                                            <Volume2 className="w-3 h-3" />
                                        )}
                                        {isSpeaking && speakingMsgId === msg.id ? "Stop" : "Listen"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {chatMutation.isPending && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            </div>
                            Analyzing...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-200">
                            {isSpeaking && (
                                <button
                                    onClick={stopSpeaking}
                                    className="w-full mb-2 flex items-center justify-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md py-1.5 hover:bg-red-100 transition-colors"
                                >
                                    <VolumeX className="w-3.5 h-3.5" />
                                    Stop Audio
                                </button>
                            )}
                            {sttStatus && (
                                <div className={`mb-2 text-xs text-center py-1.5 rounded-md transition-colors ${
                                    isListening
                                        ? "text-red-600 bg-red-50 border border-red-200 animate-pulse"
                                        : sttStatus.includes("Transcribing")
                                            ? "text-blue-600 bg-blue-50 border border-blue-200"
                                            : sttStatus.includes("error") || sttStatus.includes("denied") || sttStatus.includes("failed")
                                                ? "text-amber-600 bg-amber-50 border border-amber-200"
                                                : "text-slate-600 bg-slate-50 border border-slate-200"
                                }`}>
                                    {sttStatus}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className={`flex-1 flex items-center bg-slate-50 rounded-md px-4 py-2 border transition-colors ${
                                    isListening ? "border-red-400 bg-red-50/30" : "border-slate-200 focus-within:border-blue-400"
                                }`}>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder={isListening ? "Listening... speak now" : "Ask about facilities, medical deserts..."}
                                        className="flex-1 bg-transparent text-sm outline-none"
                                        disabled={chatMutation.isPending}
                                    />
                                    <button
                                        onClick={toggleListening}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            isListening
                                                ? "bg-red-100 text-red-600 animate-pulse"
                                                : "text-slate-400 hover:text-slate-600"
                                        }`}
                                        title={isListening ? "Stop recording" : "Start voice input"}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="bg-blue-600 text-white p-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-400">Verify critical data before action.</p>
                                <button
                                    onClick={() => setAutoSpeak(!autoSpeak)}
                                    className={`flex items-center gap-1 text-xs ${
                                        autoSpeak ? "text-blue-600" : "text-slate-400"
                                    }`}
                                >
                                    {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                    Auto-read
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map - Center */}
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden h-full min-h-0">
                        <GhanaMap
                            facilities={mapData || []}
                            desertZones={desertZones}
                            regionPolygons={regionPolygons}
                            height="100%"
                        />
                        {/* Map Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-md shadow-lg p-3 z-[500]">
                            <p className="text-xs font-semibold text-gray-700 mb-2">MAP LEGEND</p>
                            <div className="space-y-1">
                                {[
                                    { color: "#60a5fa", label: "Coverage Zone" },
                                    { color: "#2563eb", label: "Hospital" },
                                    { color: "#22c55e", label: "Clinic" },
                                    { color: "#f59e0b", label: "Dentist" },
                                    { color: "#ef4444", label: "Anomaly Detected" },
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
                    </div>

                    {/* Regional Overview - Right */}
                    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-y-auto h-full min-h-0 min-w-0">
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-gray-900">Regional Health Overview</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Dataset: {stats?.total || "..."} facilities loaded
                            </p>
                        </div>

                        {/* Regional Synthesis */}
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                        Regional Capability Synthesis
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Structured + extracted fields
                                    </p>
                                </div>
                                <select
                                    value={selectedRegion || ""}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                                >
                                    {sortedRegions.map((r: any) => (
                                        <option key={r.region} value={r.region}>
                                            {r.region}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedStats && (
                                <>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <div className="rounded-md bg-slate-50 p-2">
                                            <p className="text-[11px] uppercase text-slate-400">Coverage</p>
                                            <p className="text-lg font-semibold text-slate-900">
                                                {coveragePercent}%
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 p-2">
                                            <p className="text-[11px] uppercase text-slate-400">Data Complete</p>
                                            <p className="text-lg font-semibold text-slate-900">
                                                {Math.round(selectedStats.avgDataCompleteness)}%
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 p-2">
                                            <p className="text-[11px] uppercase text-slate-400">Anomaly Rate</p>
                                            <p className="text-lg font-semibold text-slate-900">
                                                {anomalyRate}%
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 p-2">
                                            <p className="text-[11px] uppercase text-slate-400">Facilities</p>
                                            <p className="text-lg font-semibold text-slate-900">
                                                {selectedStats.totalFacilities}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedStats.desertGaps?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[11px] uppercase text-slate-400">Key Gaps</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedStats.desertGaps.slice(0, 4).map((g: string) => (
                                                    <span
                                                        key={g}
                                                        className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-md"
                                                    >
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedStats.specialtiesAvailable?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[11px] uppercase text-slate-400">Top Specialties</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedStats.specialtiesAvailable.slice(0, 6).map((s: string) => (
                                                    <span
                                                        key={s}
                                                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                {/* Critical alert */}
                        {stats && (
                            <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-700">
                                Critical Gaps Detected
                            </span>
                        </div>
                        <p className="text-xs text-red-600">
                            {sortedRegions.filter((r: any) => r.isMedicalDesert).length} regions
                            identified as medical deserts
                        </p>
                    </div>
                )}

                {/* Stats */}
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-500">Total Facilities</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.total || "..."}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Medical Deserts</p>
                                <p className="text-xl font-bold text-red-600">
                                    {sortedRegions.filter((r: any) => r.isMedicalDesert).length}
                                    <span className="text-xs font-normal text-red-400 ml-1">High Priority</span>
                                </p>
                            </div>
                        </div>

                {/* Region list */}
                        <div className="px-4 pb-4 space-y-2">
                            <p className="text-xs font-medium text-gray-400 uppercase">Regions</p>
                            {sortedRegions.map((r: any) => (
                                <div
                                    key={r.region}
                                    onClick={() => setSelectedRegion(r.region)}
                                    className={`p-2.5 rounded-md border text-sm cursor-pointer ${
                                        r.region === selectedRegion
                                            ? "border-blue-200 bg-blue-50"
                                            : r.isMedicalDesert
                                            ? "border-red-200 bg-red-50"
                                            : "border-gray-100 bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-800">{r.region}</span>
                                        <span className="text-xs text-gray-500">
                                            {r.totalFacilities} facilities
                                        </span>
                                    </div>
                                    {r.isMedicalDesert && r.desertGaps?.length > 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Missing: {r.desertGaps.slice(0, 3).join(", ")}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
