"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface WatchChatProps {
  watchType: "FIRST_WATCH" | "NIGHT_WATCH";
  onGenerate: (messages: ChatMessage[]) => void;
  generating: boolean;
}

export function WatchChat({ watchType, onGenerate, generating }: WatchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function startConversation() {
    setStarted(true);
    // Send an empty first message to kick off the AI greeting
    await sendMessage(watchType === "FIRST_WATCH" ? t("watchChat.readyFirstWatch") : t("watchChat.readyNightWatch"));
  }

  async function sendMessage(text: string) {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setStreaming(true);

    try {
      console.log("[WatchChat] Calling /api/v1/watches/chat", {
        watchType,
        messageCount: updated.length,
      });
      const res = await fetch("/api/v1/watches/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchType,
          messages: updated,
        }),
      });

      if (!res.ok) {
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return copy;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      console.error("Watch chat error:", err);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
  }

  // Strip DIM tags from displayed messages
  function cleanContent(text: string): string {
    return text
      .replace(/\[DIM:\s*(?:DECISION|IDEA|MICRO_TASK):\s*.+?\]/g, "")
      .replace(/\[DIM_TRIAGE:\s*\S+?:\s*\w+\]/g, "")
      .trim();
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-muted-foreground">
          {watchType === "FIRST_WATCH"
            ? t("watchChat.firstWatchIntro")
            : t("watchChat.nightWatchIntro")}
        </p>
        <Button onClick={startConversation} size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          {watchType === "FIRST_WATCH" ? t("watchChat.beginFirstWatch") : t("watchChat.beginNightWatch")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[50vh] min-h-[200px]"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {cleanContent(msg.content)}
            </div>
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input + Generate button */}
      <div className="space-y-3 border-t pt-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("watchChat.inputPlaceholder")}
            disabled={streaming || generating}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={streaming || generating || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {messages.length >= 3 && (
          <Button
            onClick={() => onGenerate(messages)}
            disabled={streaming || generating}
            className="w-full"
            variant="default"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {generating
              ? t("watchChat.generating")
              : watchType === "FIRST_WATCH" ? t("watchChat.generateFirstWatch") : t("watchChat.generateNightWatch")}
          </Button>
        )}
      </div>
    </div>
  );
}
