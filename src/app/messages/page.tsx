"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Connection, Profile } from "@/lib/types";

interface ConnectionRow extends Connection {
  other: Profile;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: conns } = await supabase
        .from("connections")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!conns?.length) {
        setLoading(false);
        return;
      }

      const otherIds = conns.map((c) =>
        c.from_user_id === user.id ? c.to_user_id : c.from_user_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", otherIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      setConnections(
        conns.map((c) => ({
          ...c,
          other: profileMap.get(
            c.from_user_id === user.id ? c.to_user_id : c.from_user_id
          )!,
        }))
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function accept(id: string) {
    await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "accepted" } : c))
    );
  }

  async function decline(id: string) {
    await supabase
      .from("connections")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", id);
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 bg-paper/95 backdrop-blur border-b border-paper-3 px-4 py-4 flex items-center gap-3">
        <Link href="/map" className="text-navy/70 hover:text-ink text-lg font-medium min-h-[52px] inline-flex items-center">
          ←
        </Link>
        <h1 className="text-xl text-navy font-display">Messages</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {loading && (
          <p className="text-lg text-navy/70 text-center py-8">Loading…</p>
        )}

        {!loading && connections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-navy/70 text-lg">
              No connections yet. Find someone on the map and send a request.
            </p>
            <Link href="/map" className="popby-btn popby-btn-accent mt-4 inline-flex">
              Go to map
            </Link>
          </div>
        )}

        <ul className="space-y-2">
          {connections.map((c) => (
            <li key={c.id} className="popby-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-paper-2 flex-shrink-0 border border-paper-3">
                  {c.other?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.other.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-full text-lg font-bold text-accent">
                      {c.other?.first_name?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy truncate">
                    {c.other?.first_name ?? "Unknown"}
                  </p>
                  <p className="text-lg text-navy/70 capitalize">{c.status}</p>
                </div>
                {c.status === "pending" && c.to_user_id === userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(c.id)}
                      className="popby-btn popby-btn-accent text-lg py-3.5 px-5 min-h-[52px]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decline(c.id)}
                      className="popby-btn popby-btn-ghost text-lg py-3.5 px-5 min-h-[52px]"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {c.status === "accepted" && (
                  <Link
                    href={`/messages/${c.id}`}
                    className="popby-btn popby-btn-navy text-lg py-3.5 px-5 min-h-[52px]"
                  >
                    Chat
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
