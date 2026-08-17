"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface BidFormProps {
  vehicleId: string;
  currentBid: number;
  sellerId: string;
  variant?: "inline" | "button" | "full";
}

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX / Transferência", icon: "💳", desc: "Pagamento à vista via PIX ou TED" },
  { value: "financiamento", label: "Financiamento", icon: "🏦", desc: "Financiamento bancário aprovado" },
  { value: "consorcio", label: "Consórcio", icon: "📋", desc: "Carta de consórcio contemplada" },
  { value: "troca", label: "Troca + Valor", icon: "🔄", desc: "Veículo de troca + complemento" },
  { value: "boleto", label: "Boleto", icon: "📄", desc: "Pagamento via boleto bancário" },
];

function calculateFee(amount: number): number {
  const fee = Math.round(amount * 0.05);
  const cap = 500000; // R$ 5.000
  return Math.min(fee, cap);
}

export default function BidForm({
  vehicleId,
  currentBid,
  sellerId,
  variant = "full",
}: BidFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [bidAmount, setBidAmount] = useState(Math.ceil(currentBid / 100) + 500);

  const fee = calculateFee(bidAmount * 100);
  const total = bidAmount * 100 + fee;

  async function handleBid(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const amount = Math.round(parseFloat(form.get("bidAmount") as string) * 100);
    const method = form.get("paymentMethod") as string;
    const message = (form.get("message") as string) || "";
    const tradeVehicle = (form.get("tradeVehicle") as string) || "";

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: method,
          message,
          tradeVehicle: method === "troca" ? tradeVehicle : null,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireLogin) {
          setError("Você precisa fazer login para enviar ofertas. Acesse /login");
          return;
        }
        if (data.requireVerification) {
          setError("Verifique sua identidade antes de fazer ofertas. Acesse /verificar");
          return;
        }
        throw new Error(data.error);
      }

      setSuccess("Oferta enviada! O vendedor será notificado.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar oferta");
    } finally {
      setLoading(false);
    }
  }

  // Variante inline (sticky bar)
  if (variant === "inline") {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-5 py-2 rounded-md text-sm transition"
      >
        Fazer Oferta
      </button>
    );
  }

  // Variante button
  if (variant === "button") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-2.5 rounded-md transition"
        >
          Fazer Oferta
        </button>
        {showModal && <BidModal />}
      </>
    );
  }

  function BidModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1c1c1c] rounded-xl p-6 w-full max-w-lg mx-4 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white">Fazer uma Oferta</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* Info da taxa */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 mb-5 text-xs text-gray-400">
            <p>💡 <strong className="text-gray-300">Taxa da plataforma:</strong> 5% do valor da oferta (máximo R$ 5.000)</p>
            <p className="mt-1">O vendedor recebe 100% do valor. A taxa é paga pelo comprador.</p>
          </div>

          <form onSubmit={handleBid} className="space-y-4">
            {/* Valor */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor da oferta (R$) *</label>
              <input
                name="bidAmount"
                type="number"
                step="0.01"
                min={Math.ceil(currentBid / 100)}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-xl font-bold text-white focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none"
              />
              {/* Cálculo da taxa */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Taxa (5%, max R$5.000):</span>
                <span className="text-[#d4a853]">{formatCurrency(fee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-[#2a2a2a]">
                <span className="text-gray-400 font-medium">Total a pagar:</span>
                <span className="text-white font-bold">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Forma de pagamento *</label>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      paymentMethod === method.value
                        ? "border-[#dc2626] bg-[#dc2626]/5"
                        : "border-[#2a2a2a] hover:border-[#444]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{method.label}</div>
                      <div className="text-gray-500 text-xs">{method.desc}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.value
                        ? "border-[#dc2626]"
                        : "border-gray-600"
                    }`}>
                      {paymentMethod === method.value && (
                        <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campo de troca (só aparece se selecionar troca) */}
            {paymentMethod === "troca" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Descreva seu veículo de troca *
                </label>
                <input
                  name="tradeVehicle"
                  type="text"
                  required
                  placeholder="Ex: Honda Civic 2018 + R$ 50.000 de complemento"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] outline-none text-sm"
                />
              </div>
            )}

            {/* Mensagem ao vendedor */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Mensagem ao vendedor <span className="text-gray-600">(opcional)</span>
              </label>
              <textarea
                name="message"
                rows={2}
                placeholder="Ex: Tenho interesse, posso buscar em SP neste fim de semana..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] outline-none text-sm resize-none"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 p-2 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-[#d4a853] bg-[#d4a853]/10 border border-[#d4a853]/30 p-2 rounded">
                {success}
              </div>
            )}

            {/* Termo vinculante */}
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  required
                  className="mt-0.5 accent-[#dc2626] w-4 h-4"
                />
                <span className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-gray-300">Declaro que esta oferta é vinculante.</strong>{" "}
                  Caso o vendedor aceite, me comprometo a concluir a compra no valor indicado,
                  no prazo de 7 dias. Entendo que a taxa de plataforma ({formatCurrency(fee)}) será
                  cobrada no ato do aceite e não é reembolsável.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-lg transition text-lg"
            >
              {loading ? "Enviando oferta..." : "Enviar Oferta Vinculante"}
            </button>
            <p className="text-[10px] text-gray-600 text-center">
              A taxa de {formatCurrency(fee)} será cobrada somente se sua oferta for aceita pelo vendedor.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Variante full (inline na sidebar)
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3.5 rounded-lg transition text-lg"
      >
        Fazer Oferta
      </button>
      <p className="text-[10px] text-gray-600 text-center mt-2">
        Taxa de 5% (máx R$ 5.000) paga pelo comprador
      </p>
      {showModal && <BidModal />}
    </>
  );
}
