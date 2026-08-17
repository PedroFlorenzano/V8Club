import { prisma } from "@/lib/prisma";
import { formatCurrency, getTimeRemaining, formatMileage } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Tags de marcas populares
const BRAND_TAGS = [
  "Ofertas Ativas",
  "Resultados",
  "Porsche",
  "BMW",
  "Golf GTI",
  "Mercedes-Benz",
  "Opala",
  "Maverick",
  "Mustang",
  "Civic Si",
  "Uno Turbo",
  "Fusca",
  "Skyline",
  "Supra",
  "WRX",
  "Camaro",
];

export default async function HomePage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { in: ["approved", "active", "sold"] } },
    include: {
      seller: { select: { name: true } },
      images: { where: { isCover: true }, take: 1 },
      bids: { orderBy: { amount: "desc" }, take: 1 },
      _count: { select: { bids: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Separar o featured (maior score) do resto
  const sorted = [...vehicles].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
      {/* Tags de marcas - scrollável horizontalmente */}
      <div className="py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto tags-scroll pb-2">
          {BRAND_TAGS.map((tag, i) => (
            <button
              key={tag}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                i === 0
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#1c1c1c] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Vehicle */}
      {featured && (
        <section className="mt-6">
          <a href={`/vehicles/${featured.id}`} className="block">
            <div className="relative rounded-xl overflow-hidden h-[420px] bg-gradient-to-br from-gray-700 to-gray-900 group">
              {/* Imagem de fundo */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10" />
              {featured.images?.[0]?.url ? (
                <img
                  src={featured.images[0].url}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
              )}
              
              {/* Fallback visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[120px] opacity-20">🏎️</span>
              </div>

              {/* Badge FEATURED */}
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-[#dc2626] text-white text-xs font-bold px-3 py-1 rounded">
                  DESTAQUE
                </span>
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {featured.year} {featured.brand} {featured.model}{" "}
                  {featured.version}
                </h2>
                <p className="text-gray-300 text-sm mb-4">
                  {featured.title}
                </p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {featured.auctionEnd ? getTimeRemaining(featured.auctionEnd) : "—"}
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                    Oferta{" "}
                    <span className="text-[#d4a853] font-bold">{formatCurrency(
                        featured.bids[0]?.amount || featured.startingBid
                      )}
                    </span>
                  </span>
                </div>
              </div>

              {/* Mini gallery placeholders à direita */}
              <div className="absolute top-0 right-0 h-full w-[300px] z-10 hidden lg:grid grid-rows-2 grid-cols-2 gap-1 p-1">
                <div className="bg-gray-700/50 rounded flex items-center justify-center text-2xl">📸</div>
                <div className="bg-gray-700/50 rounded flex items-center justify-center text-2xl">📸</div>
                <div className="bg-gray-700/50 rounded flex items-center justify-center text-2xl">📸</div>
                <div className="bg-gray-700/50 rounded flex items-center justify-center text-2xl">📸</div>
              </div>
            </div>
          </a>
        </section>
      )}

      {/* Filtros */}
      <section className="mt-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Ofertas</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-gray-300 text-sm px-3 py-1.5 rounded-md transition">
              Anos
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-gray-300 text-sm px-3 py-1.5 rounded-md transition">
              Câmbio
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-gray-300 text-sm px-3 py-1.5 rounded-md transition">
              Tipo
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button className="text-white font-medium border-b-2 border-[#dc2626] pb-0.5">
            Encerrando em breve
          </button>
          <button className="text-gray-400 hover:text-white transition">
            Recém listados
          </button>
          <button className="text-gray-400 hover:text-white transition">
            Sem reserva
          </button>
          <button className="text-gray-400 hover:text-white transition">
            Menor km
          </button>
        </div>
      </section>

      {/* Grid de veículos - 4 colunas */}
      <section className="mt-6 pb-16">
        {vehicles.length === 0 ? (
          <div className="text-center py-16 bg-[#1c1c1c] rounded-xl">
            <p className="text-gray-400 text-lg">Nenhum anúncio ativo.</p>
            <p className="text-gray-500 mt-2 text-sm">
              Execute o seed:{" "}
              <code className="bg-[#1a1a1a] px-2 py-1 rounded text-xs text-[#dc2626]">
                POST /api/seed
              </code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(rest.length > 0 ? rest : vehicles).map((vehicle) => {
              const highBid = vehicle.bids[0]?.amount || vehicle.startingBid;
              const timeLeft = vehicle.auctionEnd
                ? getTimeRemaining(vehicle.auctionEnd)
                : "—";

              return (
                <a
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.id}`}
                  className="vehicle-card block rounded-lg overflow-hidden bg-[#1c1c1c] hover:bg-[#242424]"
                >
                  {/* Imagem */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center overflow-hidden">
                    {vehicle.images?.[0]?.url ? (
                      <img
                        src={vehicle.images[0].url}
                        alt={vehicle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl opacity-30">🚗</span>
                    )}

                    {/* Badge timer + preço OU vendido */}
                    {vehicle.status === "sold" ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-[#d4a853] text-black text-sm font-bold px-4 py-2 rounded-lg">
                          VENDIDO — {formatCurrency(highBid)}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="4" />
                          </svg>
                          {timeLeft}
                        </span>
                        <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                          Oferta{" "}
                          <span className="text-[#d4a853] font-bold">{formatCurrency(highBid)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-[15px] leading-tight">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1.5 line-clamp-2">
                      {vehicle.version && `${vehicle.version}, `}
                      {formatMileage(vehicle.mileage)},{" "}
                      {vehicle.transmission},{" "}
                      {vehicle.color}
                    </p>
                    {vehicle.highlights && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                        {vehicle.highlights.split("|").slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


