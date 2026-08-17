"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Sale {
  id: string;
  salePrice: number;
  platformFee: number;
  paymentMethod: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buyerCpf: string | null;
  sellerEmail: string;
  sellerPhone: string | null;
  sellerCpf: string | null;
  paymentConfirmed: boolean;
  vehicleDelivered: boolean;
  titleTransferred: boolean;
  createdAt: string;
  vehicle: { title: string; brand: string; model: string; year: number };
  bid: { paymentMethod: string; tradeVehicle: string | null; message: string | null };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX / Transferência",
  financiamento: "Financiamento",
  consorcio: "Consórcio",
  troca: "Troca + Valor",
  boleto: "Boleto",
};

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string): string {
  if (phone.length === 11) return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export default function SalePage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    fetchSale();
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setCurrentUserId(data.user?.id || "");
    }
  }

  async function fetchSale() {
    try {
      // A URL usa o saleId, precisamos buscar via uma API de sale
      const res = await fetch(`/api/sales/${params.id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Venda não encontrada");
        return;
      }
      const data = await res.json();
      setSale(data.sale);
    } catch {
      setError("Erro ao carregar dados da venda");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Venda não encontrada"}</p>
          <Link href="/" className="text-[#d4a853] hover:text-[#e8c76a]">Voltar ao V8 Club</Link>
        </div>
      </div>
    );
  }

  const isBuyer = currentUserId === sale.buyer.id;
  const isSeller = currentUserId === sale.seller.id;
  const otherParty = isBuyer ? "Vendedor" : "Comprador";
  const otherName = isBuyer ? sale.seller.name : sale.buyer.name;
  const otherEmail = isBuyer ? sale.sellerEmail : sale.buyerEmail;
  const otherPhone = isBuyer ? sale.sellerPhone : sale.buyerPhone;
  const otherCpf = isBuyer ? sale.sellerCpf : sale.buyerCpf;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header celebratório */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isBuyer ? "Parabéns pela compra!" : "Venda concluída!"}
          </h1>
          <p className="text-gray-400 text-lg">
            {sale.vehicle.year} {sale.vehicle.brand} {sale.vehicle.model}
          </p>
          <div className="mt-4 inline-block bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-6 py-2">
            <span className="text-[#d4a853] font-bold text-xl">{formatCurrency(sale.salePrice)}</span>
            <span className="text-gray-400 text-sm ml-2">via {PAYMENT_LABELS[sale.paymentMethod]}</span>
          </div>
        </div>

        {/* Card de contato */}
        <div className="bg-[#1c1c1c] rounded-xl border border-[#d4a853]/30 p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-1">
            📞 Dados do {otherParty}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Entre em contato para acertar os detalhes da entrega e pagamento
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-[#0a0a0a] rounded-lg p-4">
              <div className="w-12 h-12 bg-[#d4a853] rounded-full flex items-center justify-center text-black font-bold text-lg">
                {otherName.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{otherName}</p>
                <p className="text-gray-400 text-sm">{otherParty}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Email */}
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">📧 Email</p>
                <p className="text-white font-medium">{otherEmail}</p>
              </div>

              {/* Telefone */}
              {otherPhone && (
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">📱 Telefone / WhatsApp</p>
                  <p className="text-white font-medium">{formatPhone(otherPhone)}</p>
                </div>
              )}

              {/* CPF */}
              {otherCpf && (
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">🪪 CPF</p>
                  <p className="text-white font-medium">{formatCPF(otherCpf)}</p>
                </div>
              )}

              {/* Taxa */}
              {isBuyer && (
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">💰 Taxa da plataforma</p>
                  <p className="text-[#d4a853] font-medium">{formatCurrency(sale.platformFee)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Troca (se aplicável) */}
        {sale.bid.tradeVehicle && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6 mb-6">
            <h3 className="text-white font-bold mb-2">🔄 Veículo de Troca</h3>
            <p className="text-gray-300">{sale.bid.tradeVehicle}</p>
          </div>
        )}

        {/* Checklist pós-venda */}
        <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">✅ Checklist Pós-Venda</h2>
          <p className="text-sm text-gray-400 mb-5">
            Siga estes passos para concluir a transação com segurança
          </p>

          <div className="space-y-3">
            <CheckItem
              done={false}
              title="1. Fazer contato"
              desc="Entre em contato com a outra parte via WhatsApp ou telefone para alinhar próximos passos."
            />
            <CheckItem
              done={false}
              title={isBuyer ? "2. Efetuar pagamento" : "2. Confirmar recebimento do pagamento"}
              desc={isBuyer
                ? `Pague ${formatCurrency(sale.salePrice)} ao vendedor via ${PAYMENT_LABELS[sale.paymentMethod]}. Prazo: 7 dias.`
                : "Confirme o recebimento do valor integral antes de liberar o veículo."
              }
            />
            <CheckItem
              done={false}
              title="3. Vistoria e entrega do veículo"
              desc="Recomendamos uma vistoria presencial antes da entrega. Verifique: lataria, motor, câmbio, documentos."
            />
            <CheckItem
              done={false}
              title="4. Transferência de propriedade"
              desc="Realize a transferência no Detran. Documentos necessários: CRV assinado, comprovante de pagamento de IPVA, laudo cautelar."
            />
            <CheckItem
              done={false}
              title="5. Registrar venda no Detran (vendedor)"
              desc="O vendedor deve comunicar a venda ao Detran em até 30 dias para evitar responsabilidade sobre multas futuras."
            />
          </div>
        </div>

        {/* Dicas de segurança */}
        <div className="bg-[#0a0a0a] rounded-xl border border-[#2a2a2a] p-6 mb-6">
          <h3 className="text-sm font-bold text-[#d4a853] mb-3">🔒 Dicas de Segurança</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>• Prefira encontrar em local público e movimentado (shopping, estacionamento de banco)</li>
            <li>• Para valores altos, considere fazer a transação em agência bancária</li>
            <li>• Verifique se o CRV (documento do carro) está no nome do vendedor</li>
            <li>• Consulte restrições do veículo: <span className="text-[#d4a853]">DETRAN</span> ou app Sinesp</li>
            <li>• Nunca entregue/receba o veículo sem pagamento confirmado em conta</li>
            <li>• Guarde comprovantes de pagamento e contrato assinado</li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#2a2a2a] hover:bg-[#333] text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Voltar ao V8 Club
          </Link>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ done, title, desc }: { done: boolean; title: string; desc: string }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${done ? "bg-green-500/5 border border-green-500/20" : "bg-[#0a0a0a]"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        done ? "bg-green-500 text-white" : "border-2 border-gray-600"
      }`}>
        {done && <span className="text-xs">✓</span>}
      </div>
      <div>
        <p className={`text-sm font-medium ${done ? "text-green-400" : "text-white"}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
