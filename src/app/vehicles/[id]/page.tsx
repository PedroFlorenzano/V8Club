import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, getTimeRemaining, formatMileage } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BidForm from "./BidForm";
import CommentSection from "./CommentSection";
import PhotoGallery from "./PhotoGallery";
import VideoSection from "./VideoSection";
import OffersList from "./OffersList";
import ChatSection from "./ChatSection";
import WatchButton from "@/components/WatchButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" } },
      bids: {
        orderBy: { createdAt: "desc" },
        include: { bidder: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      sale: { select: { id: true, buyerId: true, sellerId: true } },
    },
  });

  if (!vehicle) notFound();

  // Verificar se o usuário logado é parte da venda
  const currentUser = await getCurrentUser();
  const isSaleParticipant = vehicle.sale && currentUser &&
    (currentUser.userId === vehicle.sale.buyerId || currentUser.userId === vehicle.sale.sellerId);

  // Buscar outros veículos para sidebar "ending soon"
  const otherVehicles = await prisma.vehicle.findMany({
    where: { 
      status: { in: ["approved", "active"] },
      id: { not: vehicle.id },
    },
    include: {
      bids: { orderBy: { amount: "desc" }, take: 1 },
    },
    orderBy: { auctionEnd: "asc" },
    take: 4,
  });

  const highBid = vehicle.bids[0]?.amount || vehicle.startingBid;
  const timeLeft = vehicle.auctionEnd ? getTimeRemaining(vehicle.auctionEnd) : "—";
  const highlights = vehicle.highlights?.split("|").filter(Boolean) || [];
  const aiAnalysis = vehicle.aiAnalysis ? JSON.parse(vehicle.aiAnalysis) : null;

  return (
    <div>
      {/* Sticky Bar - estilo C&B */}
      <div className="sticky top-0 z-50 bg-[#1c1c1c] border-b border-gray-700">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-400">Tempo</span>
              <span className="text-white font-bold">{timeLeft}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">↑</span>
              <span className="text-gray-400">Maior Oferta</span>
              <span className="text-[#d4a853] font-bold">{formatCurrency(highBid)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">#</span>
              <span className="text-gray-400">Ofertas</span>
              <span className="text-white font-bold">{vehicle.bids.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">💬</span>
              <span className="text-gray-400">Comentários</span>
              <span className="text-white font-bold">{vehicle.comments.length}</span>
            </div>
          </div>
          <BidForm
            vehicleId={vehicle.id}
            currentBid={highBid}
            sellerId={vehicle.sellerId}
            variant="inline"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Banner de venda concluída */}
        {vehicle.status === "sold" && isSaleParticipant && vehicle.sale && (
          <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-[#d4a853] font-bold text-lg">🎉 Venda Concluída!</h3>
              <p className="text-gray-400 text-sm mt-1">
                Os dados de contato da outra parte estão disponíveis.
              </p>
            </div>
            <a
              href={`/venda/${vehicle.sale.id}`}
              className="bg-[#d4a853] hover:bg-[#e8c76a] text-black font-bold px-6 py-3 rounded-lg transition"
            >
              Ver Contatos & Checklist →
            </a>
          </div>
        )}

        {vehicle.status === "sold" && !isSaleParticipant && (
          <div className="bg-[#2a2a2a] border border-[#333] rounded-xl p-5 mb-6 text-center">
            <p className="text-gray-400 font-medium">🏁 Este veículo foi vendido</p>
          </div>
        )}

        {/* Título */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {vehicle.year} {vehicle.brand} {vehicle.model} {vehicle.version}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {vehicle.transmission}, {formatMileage(vehicle.mileage)}, {vehicle.color}
              {highlights.length > 0 && `, ${highlights[0]?.trim()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WatchButton vehicleId={vehicle.id} />
            <button className="flex items-center gap-1.5 text-gray-300 hover:text-white border border-gray-700 px-3 py-1.5 rounded-md text-sm transition">
              ↗ Compartilhar
            </button>
          </div>
        </div>

        {/* Galeria - foto grande + grid lateral */}
        <PhotoGallery
          photos={vehicle.images.map((img) => ({
            id: img.id,
            url: img.url,
            category: "exterior" as const,
          }))}
          vehicleName={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
        />

        {/* Layout 2 colunas: conteúdo + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Coluna principal */}
          <div className="space-y-8">
            {/* Barra de info rápida abaixo da foto */}
            <div className="flex items-center gap-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs text-gray-500">Tempo</div>
                  <div className="text-white font-bold">{timeLeft}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Maior Oferta</div>
                <div className="text-[#d4a853] font-bold text-lg">{formatCurrency(highBid)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ofertas</div>
                <div className="text-white font-bold">{vehicle.bids.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Comentários</div>
                <div className="text-white font-bold">{vehicle.comments.length}</div>
              </div>
              <div className="ml-auto">
                <BidForm
                  vehicleId={vehicle.id}
                  currentBid={highBid}
                  sellerId={vehicle.sellerId}
                  variant="button"
                />
              </div>
            </div>

            {/* Data de encerramento */}
            <div className="text-sm text-gray-400">
              Encerrando em{" "}
              <span className="text-white">
                {vehicle.auctionEnd
                  ? new Date(vehicle.auctionEnd).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>

            {/* Tabela de especificações - estilo C&B */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  {[
                    ["Marca", vehicle.brand, "Motor", vehicle.fuel],
                    ["Modelo", `${vehicle.model} ${vehicle.version || ""}`, "Tração", "—"],
                    ["Quilometragem", formatMileage(vehicle.mileage), "Câmbio", vehicle.transmission],
                    ["Ano", vehicle.year.toString(), "Carroceria", "—"],
                    ["Documentação", "Regular", "Cor Ext.", vehicle.color],
                    ["Local", "Brasil", "Cor Int.", "—"],
                    ["Vendedor", vehicle.seller.name, "Tipo", "Particular"],
                  ].map(([label1, value1, label2, value2], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-[#1c1c1c]" : "bg-[#252525]"}>
                      <td className="px-4 py-3 text-sm text-gray-400 w-[140px]">{label1}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{value1}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 w-[140px] border-l border-gray-700">{label2}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{value2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Destaques</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>{vehicle.description.split(".")[0]}.</p>
                {highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {highlights.map((h, i) => (
                      <li key={i}>{h.trim()}</li>
                    ))}
                  </ul>
                )}
                <p className="text-gray-400 text-sm mt-4 whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            </div>

            {/* Vídeos */}
            <VideoSection videos={[]} />

            {/* Análise IA */}
            {aiAnalysis && currentUser?.userId === vehicle.sellerId && (
              <div className="border border-blue-900/40 bg-[#1a2332] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  🤖 Análise da Curadoria IA
                  <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">Visível só para você</span>
                </h3>
                <div className="flex items-center gap-6 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Score</div>
                    <div className="text-2xl font-bold text-[#d4a853]">{aiAnalysis.score}/10</div>
                  </div>
                  {vehicle.fipePrice && (
                    <div>
                      <div className="text-xs text-gray-500">Ref. FIPE</div>
                      <div className="text-lg font-bold text-white">{formatCurrency(vehicle.fipePrice)}</div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400">{aiAnalysis.marketAnalysis}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {aiAnalysis.tags?.map((tag: string) => (
                    <span key={tag} className="text-xs bg-blue-900/30 border border-blue-800/40 text-blue-300 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Live Stats Card - estilo C&B */}
            <div className="bg-[#1c1c1c] rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Estatísticas</h2>
              <div className="bg-[#1a1a1a] rounded-lg p-5">
                <h3 className="text-white font-semibold mb-4">
                  {vehicle.year} {vehicle.brand} {vehicle.model}
                  {vehicle.reservePrice && " · Reserva"}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Oferta Atual</div>
                    <div className="text-4xl font-bold text-white">
                      {formatCurrency(highBid)}
                    </div>
                    {vehicle.bids[0] && (
                      <div className="text-sm text-gray-400 mt-1">
                        por {vehicle.bids[0].bidder.name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vendedor</span>
                      <span className="text-white">{vehicle.seller.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Encerramento</span>
                      <span className="text-white">
                        {vehicle.auctionEnd
                          ? new Date(vehicle.auctionEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ofertas</span>
                      <span className="text-white">{vehicle.bids.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Comentários</span>
                      <span className="text-white">{vehicle.comments.length}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-gray-800">
                  <BidForm
                    vehicleId={vehicle.id}
                    currentBid={highBid}
                    sellerId={vehicle.sellerId}
                    variant="button"
                  />
                  <a href="/sobre" className="text-gray-500 hover:text-[#d4a853] text-sm transition">ℹ️ Como funciona</a>
                  <WatchButton vehicleId={vehicle.id} size="sm" />
                </div>
              </div>
            </div>

            {/* Ofertas Públicas */}
            <OffersList
              offers={vehicle.bids.map((b) => ({
                id: b.id,
                amount: b.amount,
                paymentMethod: b.paymentMethod,
                message: b.message,
                tradeVehicle: b.tradeVehicle,
                status: b.status,
                platformFee: b.platformFee,
                bidderName: b.bidder.name,
                createdAt: b.createdAt.toISOString(),
              }))}
              vehicleId={vehicle.id}
              sellerId={vehicle.sellerId}
              isOwner={true}
            />

            {/* Chat Interno */}
            <ChatSection vehicleId={vehicle.id} />

            {/* Comments */}
            <CommentSection
              comments={vehicle.comments.map((c) => ({
                id: c.id,
                content: c.content,
                authorName: c.author.name,
                createdAt: c.createdAt.toISOString(),
                isSeller: c.authorId === vehicle.sellerId,
              }))}
              bids={vehicle.bids.map((b) => ({
                id: b.id,
                amount: b.amount,
                bidderName: b.bidder.name,
                createdAt: b.createdAt.toISOString(),
              }))}
              vehicleId={vehicle.id}
            />
          </div>

          {/* Sidebar - Ofertas encerrando em breve */}
          <div className="hidden lg:block">
            <div className="sticky top-16">
              <h3 className="text-lg font-bold text-white mb-4">Encerrando em breve</h3>
              <div className="space-y-5">
                {otherVehicles.map((v) => {
                  const vBid = v.bids[0]?.amount || v.startingBid;
                  const vTime = v.auctionEnd ? getTimeRemaining(v.auctionEnd) : "—";
                  const vHighlights = (v.highlights || "").split("|").filter(Boolean).slice(0, 3);
                  const hasNoReserve = !v.reservePrice;
                  return (
                    <a
                      key={v.id}
                      href={`/vehicles/${v.id}`}
                      className="block rounded-lg overflow-hidden bg-[#1c1c1c] hover:bg-[#242424] transition group"
                    >
                      {/* Fotos - principal + thumb pequena */}
                      <div className="flex gap-0.5">
                        <div className="relative flex-1 h-36 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                          <span className="text-3xl opacity-20">🚗</span>
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            <span className="bg-[#dc2626] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              NOVO
                            </span>
                          </div>
                          {/* Timer + bid */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5 bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" /></svg>
                              {vTime}
                            </span>
                            <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                              Oferta <span className="text-[#d4a853] font-bold">{formatCurrency(vBid)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="w-16 h-36 bg-[#3a3a3a] flex items-center justify-center">
                          <span className="text-lg opacity-20">📸</span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-white text-sm font-bold group-hover:text-[#dc2626] transition">
                          {v.year} {v.brand} {v.model}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {v.version && `${v.version}, `}
                          {v.transmission}, {formatMileage(v.mileage)}
                        </p>
                        {/* Badges */}
                        {hasNoReserve && (
                          <span className="inline-block mt-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            SEM RESERVA
                          </span>
                        )}
                        {/* Highlights como bullets */}
                        {vHighlights.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {vHighlights.map((h, i) => (
                              <li key={i} className="text-[11px] text-gray-500">
                                • {h.trim()}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1.5">
                          Brasil
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



