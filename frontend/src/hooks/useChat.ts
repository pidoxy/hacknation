import { useCallback, useState } from "react";
import { sendMessage } from "../api";
import type { ChatMessage } from "../types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const send = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const resp = await sendMessage(text, conversationId);
        setConversationId(resp.conversation_id);

        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: resp.answer,
          agent_trace: resp.agent_trace,
          visualization_hint: resp.visualization_hint ?? undefined,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return { messages, loading, send, clear, conversationId };
}
