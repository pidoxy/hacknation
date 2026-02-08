import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function stripEmoji(text: string) {
    return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "");
}

export function formatTtsText(text: string) {
    let t = stripEmoji(text);

    // Remove code blocks
    t = t.replace(/```[\s\S]*?```/g, "");

    // Remove markdown headings but keep the text
    t = t.replace(/^#{1,6}\s+/gm, "");

    // Remove bold/italic markers but keep text
    t = t.replace(/\*\*(.+?)\*\*/g, "$1");
    t = t.replace(/[_*`]/g, "");

    // Convert numbered lists into natural speech: "1. Item" → "Item."
    t = t.replace(/^\s*\d+\.\s+/gm, "");

    // Convert bullet lists into natural speech
    t = t.replace(/^\s*[-*•]\s+/gm, "");

    // Collapse multiple newlines into sentence breaks
    t = t.replace(/\n{2,}/g, ". ");
    t = t.replace(/\n/g, ". ");

    // Clean up punctuation
    t = t.replace(/\.\s*\./g, ".");
    t = t.replace(/\s{2,}/g, " ");

    return t.trim();
}
