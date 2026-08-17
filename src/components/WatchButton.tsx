"use client";

import { useState } from "react";

interface Props {
  vehicleId: string;
  initialWatching?: boolean;
  size?: "sm" | "md";
}

export default function WatchButton({ vehicleId, initialWatching = false, size = "md" }: Props) {
  const [watching, setWatching] = useState(initialWatching);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (watching) {
        await fetch(`/api/watchlist?vehicleId=${vehicleId}`, { method: "DELETE" });
        setWatching(false);
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId }),
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.ok || res.status === 409) {
          setWatching(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (size === "sm") {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded transition ${
          watching
            ? "bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/30"
            : "text-gray-400 hover:text-[#d4a853] border border-gray-700 hover:border-[#d4a853]/30"
        }`}
      >
        {loading ? "..." : watching ? "★ Observando" : "☆ Observar"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition border ${
        watching
          ? "bg-[#d4a853]/10 text-[#d4a853] border-[#d4a853]/30"
          : "text-gray-300 hover:text-[#d4a853] border-gray-700 hover:border-[#d4a853]/30"
      }`}
    >
      {loading ? "..." : watching ? "★ Observando" : "☆ Observar"}
    </button>
  );
}
