"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WatchItem {
  id: string;
  vehicleId: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  imageUrl: string | null;
  highBid: number;
  auctionEnd: string | null;
  addedAt: string;
}

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function getTimeRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchWatchlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWatchlist() {
    try {
      const res = await fetch("/api/watchlist");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(vehicleId: string) {
    setRemoving(vehicleId);
    try {
      await fetch(`/api/watchlist?vehicleId=${vehicleId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.vehicleId !== vehicleId));
    } catch {
      // ignore
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">
            Observando
            <span className="text-gray-500 font-normal text-base ml-2">({items.length})</span>
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">☆</div>
            <p className="text-gray-500 text-lg mb-2">Sua lista de observação está vazia</p>
            <p className="text-gray-600 text-sm mb-6">
              Clique em &quot;☆ Observar&quot; em qualquer veículo para acompanhar as ofertas
            </p>
            <Link
              href="/"
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-3 rounded-lg transition inline-block"
            >
              Explorar V8 Club
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#444] transition"
              >
                <Link
                  href={`/vehicles/${item.vehicleId}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-28 h-18 bg-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🚗</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {item.year} {item.brand} {item.model}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#d4a853] font-bold text-sm">
                        {formatCurrency(item.highBid)}
                      </span>
                      {item.auctionEnd && item.status !== "sold" && (
                        <span className="text-xs text-gray-500">
                          ⏱ {getTimeRemaining(item.auctionEnd)}
                        </span>
                      )}
                      {item.status === "sold" && (
                        <span className="text-xs text-[#d4a853] font-medium">VENDIDO</span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Botão remover */}
                <button
                  onClick={() => removeItem(item.vehicleId)}
                  disabled={removing === item.vehicleId}
                  className="text-gray-500 hover:text-red-400 text-sm px-3 py-2 rounded-lg transition flex-shrink-0"
                  title="Remover da lista"
                >
                  {removing === item.vehicleId ? "..." : "✕"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
