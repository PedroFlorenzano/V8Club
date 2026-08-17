"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  isSeller: boolean;
}

interface Bid {
  id: string;
  amount: number;
  bidderName: string;
  createdAt: string;
}

interface Props {
  comments: Comment[];
  bids: Bid[];
  vehicleId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CommentSection({ comments, bids, vehicleId }: Props) {
  const [activeTab, setActiveTab] = useState<"newest" | "bids">("newest");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    { key: "newest" as const, label: "Mais Recentes" },
    { key: "bids" as const, label: "Histórico de Ofertas" },
  ];

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      // Login como comprador de teste para o MVP
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "comprador@teste.com", password: "123456" }),
      });

      if (loginRes.ok) {
        const user = await loginRes.json();
        await fetch(`/api/vehicles/${vehicleId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment, authorId: user.id }),
        });
        setNewComment("");
        window.location.reload();
      }
    } catch {
      // silently fail for MVP
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Comentários & Ofertas</h2>
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium transition ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input de comentário */}
      <form onSubmit={handleComment} className="mb-6">
        <div className="flex items-center gap-2 bg-[#1c1c1c] border border-gray-700 rounded-lg px-4 py-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="text-gray-400 hover:text-[#dc2626] disabled:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Lista de comentários */}
      {activeTab === "newest" && (
        <div className="space-y-0 divide-y divide-gray-800">
          {comments.length === 0 ? (
            <p className="text-gray-500 py-6 text-center text-sm">
              Nenhum comentário ainda. Seja o primeiro a perguntar!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="py-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {comment.authorName}
                      </span>
                      {comment.isSeller && (
                        <span className="bg-[#dc2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Vendedor
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    {/* Content */}
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition">
                        <span className="border border-gray-700 rounded px-1.5 py-0.5">↑ 0</span>
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-300 transition">
                        Responder ↩
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Histórico de ofertas */}
      {activeTab === "bids" && (
        <div className="space-y-0 divide-y divide-gray-800">
          {bids.length === 0 ? (
            <p className="text-gray-500 py-6 text-center text-sm">
              Nenhuma oferta ainda.
            </p>
          ) : (
            bids.map((bid, i) => (
              <div key={bid.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                    {bid.bidderName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">
                      {bid.bidderName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {timeAgo(bid.createdAt)}
                    </span>
                  </div>
                </div>
                <span
                  className={`font-bold ${
                    i === 0 ? "text-[#dc2626]" : "text-gray-400"
                  }`}
                >
                  {formatCurrency(bid.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


