"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Offer {
  id: string;
  amount: number;
  paymentMethod: string;
  message: string | null;
  tradeVehicle: string | null;
  status: string;
  platformFee: number;
  bidderName: string;
  createdAt: string;
}

interface Props {
  offers: Offer[];
  vehicleId: string;
  sellerId: string;
  isOwner: boolean; // Se o usuário logado é o vendedor
}

const PAYMENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  pix: { label: "PIX / À vista", icon: "💳", color: "text-green-400" },
  financiamento: { label: "Financiamento", icon: "🏦", color: "text-blue-400" },
  consorcio: { label: "Consórcio", icon: "📋", color: "text-purple-400" },
  troca: { label: "Troca + Valor", icon: "🔄", color: "text-orange-400" },
  boleto: { label: "Boleto", icon: "📄", color: "text-yellow-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function OffersList({ offers, vehicleId, sellerId, isOwner }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ id: string; msg: string } | null>(null);

  const pendingOffers = offers.filter((o) => o.status === "pending");
  const processedOffers = offers.filter((o) => o.status !== "pending");

  async function handleAction(bidId: string, action: "accept" | "reject") {
    setActionLoading(bidId);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/bids`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId, action, sellerId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "accept") {
          // Finalizar venda → criar Sale → liberar contatos
          const finalizeRes = await fetch(`/api/vehicles/${vehicleId}/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bidId }),
          });
          const finalizeData = await finalizeRes.json();
          if (finalizeRes.ok && finalizeData.redirectTo) {
            setActionResult({ id: bidId, msg: "Venda finalizada! Redirecionando..." });
            setTimeout(() => {
              window.location.href = finalizeData.redirectTo;
            }, 1000);
            return;
          }
        }
        setActionResult({ id: bidId, msg: data.message });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Ofertas Recebidas
          <span className="text-gray-500 font-normal text-sm ml-2">
            ({offers.length})
          </span>
        </h2>
        {pendingOffers.length > 0 && (
          <span className="bg-[#dc2626]/10 text-[#dc2626] text-xs font-medium px-2.5 py-1 rounded-full">
            {pendingOffers.length} pendente{pendingOffers.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Info pública */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 mb-4 text-xs text-gray-500">
        📋 Todas as ofertas são públicas. O vendedor escolhe qual aceitar — não necessariamente a maior.
        Forma de pagamento e condições são visíveis para transparência.
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-1">Nenhuma oferta ainda</p>
          <p className="text-sm">Seja o primeiro a fazer uma oferta!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Ofertas pendentes primeiro */}
          {pendingOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isOwner={isOwner}
              actionLoading={actionLoading}
              actionResult={actionResult}
              onAction={handleAction}
            />
          ))}

          {/* Ofertas processadas */}
          {processedOffers.length > 0 && pendingOffers.length > 0 && (
            <div className="border-t border-[#2a2a2a] pt-3 mt-3">
              <p className="text-xs text-gray-600 mb-2">Ofertas anteriores</p>
            </div>
          )}
          {processedOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isOwner={isOwner}
              actionLoading={actionLoading}
              actionResult={actionResult}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  isOwner,
  actionLoading,
  actionResult,
  onAction,
}: {
  offer: Offer;
  isOwner: boolean;
  actionLoading: string | null;
  actionResult: { id: string; msg: string } | null;
  onAction: (bidId: string, action: "accept" | "reject") => void;
}) {
  const payment = PAYMENT_LABELS[offer.paymentMethod] || PAYMENT_LABELS.pix;
  const isProcessing = actionLoading === offer.id;
  const result = actionResult?.id === offer.id ? actionResult.msg : null;

  return (
    <div
      className={`p-4 rounded-lg border transition ${
        offer.status === "accepted"
          ? "bg-[#d4a853]/5 border-[#d4a853]/30"
          : offer.status === "rejected"
          ? "bg-[#1c1c1c] border-[#2a2a2a] opacity-50"
          : "bg-[#1c1c1c] border-[#2a2a2a]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Info do ofertante */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 bg-[#2a2a2a] rounded-full flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
            {offer.bidderName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{offer.bidderName}</span>
              <span className="text-xs text-gray-600">{timeAgo(offer.createdAt)}</span>
              {/* Status badge */}
              {offer.status === "accepted" && (
                <span className="text-[10px] bg-[#d4a853] text-black font-bold px-1.5 py-0.5 rounded">
                  ACEITA ✓
                </span>
              )}
              {offer.status === "rejected" && (
                <span className="text-[10px] bg-gray-700 text-gray-400 font-bold px-1.5 py-0.5 rounded">
                  RECUSADA
                </span>
              )}
            </div>

            {/* Forma de pagamento */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs">{payment.icon}</span>
              <span className={`text-xs font-medium ${payment.color}`}>{payment.label}</span>
            </div>

            {/* Troca info */}
            {offer.tradeVehicle && (
              <div className="mt-1.5 text-xs text-gray-400 bg-[#0a0a0a] px-2 py-1 rounded">
                🔄 Troca: {offer.tradeVehicle}
              </div>
            )}

            {/* Mensagem */}
            {offer.message && (
              <p className="text-sm text-gray-400 mt-1.5 italic">
                &ldquo;{offer.message}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Valor */}
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${
            offer.status === "accepted" ? "text-[#d4a853]" : "text-white"
          }`}>
            {formatCurrency(offer.amount)}
          </div>
          <div className="text-[10px] text-gray-600">
            + taxa {formatCurrency(offer.platformFee)}
          </div>
        </div>
      </div>

      {/* Botões do vendedor */}
      {isOwner && offer.status === "pending" && (
        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center gap-2">
          {result ? (
            <span className="text-sm text-[#d4a853]">{result}</span>
          ) : (
            <>
              <button
                onClick={() => onAction(offer.id, "accept")}
                disabled={isProcessing}
                className="bg-[#d4a853] hover:bg-[#e8c76a] disabled:bg-gray-700 text-black font-bold text-sm px-4 py-1.5 rounded transition"
              >
                {isProcessing ? "..." : "✓ Aceitar Oferta"}
              </button>
              <button
                onClick={() => onAction(offer.id, "reject")}
                disabled={isProcessing}
                className="bg-[#2a2a2a] hover:bg-[#333] disabled:bg-gray-700 text-gray-300 text-sm px-4 py-1.5 rounded transition"
              >
                Recusar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
