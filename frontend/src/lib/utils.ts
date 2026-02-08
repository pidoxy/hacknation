import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function stripEmoji(text: string) {
    return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "");
}

export function formatTtsText(text: string) {
    const clean = stripEmoji(text);
    const boldMatches = Array.from(clean.matchAll(/\*\*(.+?)\*\*/g))
        .map((m) => m[1].trim())
        .filter(Boolean);
    const uniqueBold = Array.from(new Set(boldMatches));
    if (uniqueBold.length >= 2) {
        return uniqueBold.join(", ");
    }

    const listLines = clean
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^(\d+\.|[-*•])\s+/.test(line));
    if (listLines.length >= 2) {
        const names = listLines
            .map((line) =>
                line
                    .replace(/^(\d+\.|[-*•])\s+/, "")
                    .replace(/\*\*(.+?)\*\*/g, "$1")
                    .split(" - ")[0]
                    .split(" — ")[0]
                    .trim()
            )
            .filter(Boolean);
        const uniqueNames = Array.from(new Set(names));
        if (uniqueNames.length >= 2) {
            return uniqueNames.join(", ");
        }
    }

    let t = clean;
    t = t.replace(/```[\s\S]*?```/g, " ");
    t = t.replace(/^#{1,6}\s+/gm, "");
    t = t.replace(/\*\*(.+?)\*\*/g, "$1");
    t = t.replace(/[_*`]/g, "");
    t = t.replace(/^\s*[-*•]\s+/gm, "");
    t = t.replace(/^\s*\d+\.\s+/gm, "");
    t = t.replace(/\s{2,}/g, " ");
    return t.trim();
}
