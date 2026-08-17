"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  imageUrl: string | null;
  highBid: number;
  bidsCount: number;
  auctionEnd: string | null;
}

interface Bid {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  vehicleTitle: string;
  vehicleId: string;
  vehicleImage: string | null;
  createdAt: string;
}

interface SaleItem {
  id: string;
  salePrice: number;
  paymentMethod: string;
  vehicleTitle: string;
  vehicleId: string;
  vehicleImage: string | null;
  otherPartyName: string;
  role: "buyer" | "seller";
  createdAt: string;
}

type Tab = "veiculos" | "ofertas" | "vendas";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  financiamento: "Financiamento",
  consorcio: "Consórcio",
  troca: "Troca + Valor",
  boleto: "Boleto",
};

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("veiculos");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/resultados");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setVehicles(data.vehicles || []);
      setBids(data.bids || []);
      setSales(data.sales || []);
    } catch {
      // ignore
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Meus Resultados</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1c1c1c] rounded-lg p-1 mb-8 border border-[#2a2a2a]">
          <TabButton
            active={tab === "veiculos"}
            onClick={() => setTab("veiculos")}
            count={vehicles.length}
          >
            Meus Veículos
          </TabButton>
          <TabButton
            active={tab === "ofertas"}
            onClick={() => setTab("ofertas")}
            count={bids.length}
          >
            Minhas Ofertas
          </TabButton>
          <TabButton
            active={tab === "vendas"}
            onClick={() => setTab("vendas")}
            count={sales.length}
          >
            Vendas Concluídas
          </TabButton>
        </div>

        {/* Conteúdo */}
        {tab === "veiculos" && <MyVehicles vehicles={vehicles} />}
        {tab === "ofertas" && <MyBids bids={bids} />}
        {tab === "vendas" && <MySales sales={sales} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition ${
        active
          ? "bg-[#dc2626] text-white"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {children}
      <span className={`ml-1.5 text-xs ${active ? "text-white/70" : "text-gray-600"}`}>
        ({count})
      </span>
    </button>
  );
}

function MyVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Você ainda não tem veículos cadastrados</p>
        <Link
          href="/submit"
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-3 rounded-lg transition inline-block"
        >
          Cadastrar Veículo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <Link
          key={v.id}
          href={`/vehicles/${v.id}`}
          className="flex items-center gap-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#444] transition"
        >
          <div className="w-24 h-16 bg-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
            {v.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.imageUrl} alt={v.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🚗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">
              {v.year} {v.brand} {v.model}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{v.bidsCount} oferta(s)</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[#d4a853] font-bold text-sm">{formatCurrency(v.highBid)}</div>
            <StatusBadge status={v.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function MyBids({ bids }: { bids: Bid[] }) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-2">Você ainda não fez nenhuma oferta</p>
        <p className="text-gray-600 text-sm">Explore o V8 Club e faça sua primeira oferta!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map((b) => (
        <Link
          key={b.id}
          href={`/vehicles/${b.vehicleId}`}
          className="flex items-center gap-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#444] transition"
        >
          <div className="w-24 h-16 bg-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
            {b.vehicleImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.vehicleImage} alt={b.vehicleTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🚗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">{b.vehicleTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">{PAYMENT_LABELS[b.paymentMethod]}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">
                {new Date(b.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-white font-bold text-sm">{formatCurrency(b.amount)}</div>
            <BidStatusBadge status={b.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function MySales({ sales }: { sales: SaleItem[] }) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhuma venda concluída ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((s) => (
        <Link
          key={s.id}
          href={`/venda/${s.id}`}
          className="flex items-center gap-4 bg-[#1c1c1c] border border-[#d4a853]/20 rounded-lg p-4 hover:border-[#d4a853]/40 transition"
        >
          <div className="w-24 h-16 bg-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
            {s.vehicleImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.vehicleImage} alt={s.vehicleTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🚗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">{s.vehicleTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {s.role === "buyer" ? "Comprado de" : "Vendido para"} {s.otherPartyName}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[#d4a853] font-bold text-sm">{formatCurrency(s.salePrice)}</div>
            <span className="text-[10px] text-green-400 font-medium">CONCLUÍDA ✓</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "text-yellow-400" },
    approved: { label: "Ativo", color: "text-green-400" },
    active: { label: "Com ofertas", color: "text-blue-400" },
    sold: { label: "Vendido", color: "text-[#d4a853]" },
    rejected: { label: "Rejeitado", color: "text-red-400" },
    expired: { label: "Expirado", color: "text-gray-500" },
  };
  const c = config[status] || config.pending;
  return <span className={`text-[10px] font-medium ${c.color}`}>{c.label}</span>;
}

function BidStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "text-yellow-400" },
    accepted: { label: "Aceita ✓", color: "text-[#d4a853]" },
    rejected: { label: "Recusada", color: "text-red-400" },
    expired: { label: "Expirada", color: "text-gray-500" },
  };
  const c = config[status] || config.pending;
  return <span className={`text-[10px] font-medium ${c.color}`}>{c.label}</span>;
}
