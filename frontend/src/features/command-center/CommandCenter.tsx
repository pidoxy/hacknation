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
import { stripEmoji } from "@/lib/utils";
import { REGION_CENTROIDS } from "@/data/regionCentroids";
import type { ChatMessage } from "@/types/chat";
import type { DesertZone } from "@/types/facility";

export default function CommandCenter() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string>();
    const [isListening, setIsListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            if (autoSpeak && data.answer) {
                speakResponse(data.answer);
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
            setIsListening(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("audio", blob);
                try {
                    const res = await fetch(`${apiBase}/api/voice/stt`, {
                        method: "POST",
                        body: formData,
                    });
                    const data = await res.json();
                    if (data.text) {
                        setInput(data.text);
                    }
                } catch {
                    console.error("STT failed");
                }
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            setIsListening(true);
            setTimeout(() => {
                recorder.stop();
                setIsListening(false);
            }, 5000);
        } catch {
            console.error("Microphone not available");
        }
    };

    const speakResponse = async (text: string) => {
        const cleanText = text.substring(0, 500);
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
            await audio.play();
        } catch {
            if ("speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
                return;
            }
            console.error("TTS failed");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Get sorted regions for the sidebar
    const sortedRegions = regionStats
        ? Object.entries(regionStats)
              .map(([region, data]: [string, any]) => ({ region, ...data }))
              .sort((a: any, b: any) => b.totalFacilities - a.totalFacilities)
        : [];

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
            const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
            const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
            if (olMatch) {
                if (!current || current.type !== "ol") {
                    flush();
                    current = { type: "ol", items: [] };
                }
                (current as { type: "ol"; items: string[] }).items.push(olMatch[1]);
                continue;
            }
            if (ulMatch) {
                if (!current || current.type !== "ul") {
                    flush();
                    current = { type: "ul", items: [] };
                }
                (current as { type: "ul"; items: string[] }).items.push(ulMatch[1]);
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

    return (
        <div className="h-screen bg-slate-50 overflow-hidden">
            <div className="px-2 py-2 h-full">
                <div className="grid grid-cols-[300px_1fr_260px] gap-2 h-full min-h-0">
                    {/* Chat Panel - Left */}
                    <div className="rounded-md border border-slate-200 bg-white shadow-sm flex flex-col h-full min-h-0">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        Command Center
                                    </h2>
                                    <p className="text-xs text-slate-500">Regional Operations Overview</p>
                                </div>
                                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    ONLINE
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
                                <div className="space-y-2">
                                    <div className="bg-gray-50 px-4 py-3 rounded-md rounded-bl-sm max-w-full">
                                        {renderMarkdownLite(msg.content)}
                                    </div>

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-1 px-1">
                                            {msg.sources.slice(0, 3).map((src, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                                                >
                                                    {src.facilityName}
                                                </span>
                                            ))}
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
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TTS button */}
                                    <button
                                        onClick={() => speakResponse(msg.content)}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 px-1"
                                    >
                                        <Volume2 className="w-3 h-3" />
                                        Listen
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
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-slate-50 rounded-md px-4 py-2 border border-slate-200 focus-within:border-blue-400">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Ask about facilities, medical deserts..."
                                        className="flex-1 bg-transparent text-sm outline-none"
                                        disabled={chatMutation.isPending}
                                    />
                                    <button
                                        onClick={toggleListening}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            isListening
                                                ? "bg-red-100 text-red-600"
                                                : "text-slate-400 hover:text-slate-600"
                                        }`}
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
                            height="100%"
                        />
                        {/* Map Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-md shadow-lg p-3 z-[500]">
                            <p className="text-xs font-semibold text-gray-700 mb-2">MAP LEGEND</p>
                            <div className="space-y-1">
                                {[
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
                    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-y-auto h-full min-h-0">
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-gray-900">Regional Health Overview</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Data updated: live</p>
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
                                    className={`p-2.5 rounded-md border text-sm ${
                                        r.isMedicalDesert
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
