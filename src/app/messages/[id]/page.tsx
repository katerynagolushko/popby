"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/types";

export default function ChatPage() {
  const { id: connectionId } = useParams<{ id: string }>();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .eq("id", connectionId)
        .single();

      if (!conn || conn.status !== "accepted") return;

      const otherId =
        conn.from_user_id === user.id ? conn.to_user_id : conn.from_user_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherId)
        .single();
      setOther(profile);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);
      setLoading(false);
    }
    load();
  }, [connectionId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !userId) return;

    const text = body.trim();
    setBody("");

    await supabase.from("messages").insert({
      connection_id: connectionId,
      sender_id: userId,
      body: text,
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted">
        Loading chat…
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-paper">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-paper-3 bg-paper">
        <Link href="/messages" className="text-muted hover:text-ink">
          ←
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-paper-2 border border-paper-3">
          {other?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center h-full text-sm font-bold text-accent">
              {other?.first_name?.[0] ?? "?"}
            </span>
          )}
        </div>
        <h1 className="font-medium text-navy font-display">
          {other?.first_name ?? "Chat"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">
            Say hi. You&apos;re connected.
          </p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-navy text-white rounded-br-md"
                    : "bg-white border border-paper-3 rounded-bl-md"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="p-4 border-t border-paper-3 bg-white flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="popby-input flex-1"
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="popby-btn popby-btn-accent disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </main>
  );
}
