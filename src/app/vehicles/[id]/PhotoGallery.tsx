"use client";

import { useState, useCallback } from "react";

interface Photo {
  id: string;
  url: string;
  category: "exterior" | "interior" | "mechanical" | "docs" | "other";
}

interface Props {
  photos: Photo[];
  vehicleName: string;
}

function generatePlaceholderPhotos(): Photo[] {
  const entries: [Photo["category"], number][] = [
    ["exterior", 8],
    ["interior", 5],
    ["mechanical", 3],
    ["docs", 2],
    ["other", 1],
  ];
  const result: Photo[] = [];
  for (const [cat, count] of entries) {
    for (let i = 0; i < count; i++) {
      result.push({ id: `${cat}-${i}`, url: "", category: cat });
    }
  }
  return result;
}

const categoryEmojis: Record<string, string> = {
  exterior: "🚗",
  interior: "🪑",
  mechanical: "⚙️",
  docs: "📄",
  other: "📷",
};

export default function PhotoGallery({ photos, vehicleName }: Props) {
  const allPhotos = photos.length > 0 ? photos : generatePlaceholderPhotos();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | Photo["category"]>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");

  const exteriorCount = allPhotos.filter((p) => p.category === "exterior").length;
  const interiorCount = allPhotos.filter((p) => p.category === "interior").length;

  const tabs = [
    { key: "all" as const, label: `Todas (${allPhotos.length})` },
    { key: "exterior" as const, label: "Exterior" },
    { key: "interior" as const, label: "Interior" },
    { key: "mechanical" as const, label: "Mecânica" },
    { key: "docs" as const, label: "Docs" },
    { key: "other" as const, label: "Outros" },
  ];

  const filteredPhotos =
    activeTab === "all"
      ? allPhotos
      : allPhotos.filter((p) => p.category === activeTab);

  const openGallery = useCallback(() => {
    setIsOpen(true);
    setViewMode("grid");
    setActiveTab("all");
  }, []);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewMode("single");
  }, []);

  function nextPhoto() {
    setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
  }

  function prevPhoto() {
    setCurrentIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  }

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredPhotos.length, currentIndex]
  );

  return (
    <>
      {/* Galeria inline - foto principal + thumbnails laterais */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-1 rounded-xl overflow-hidden mb-6">
        {/* Foto principal - clicável */}
        <button
          onClick={openGallery}
          className="relative h-[450px] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center cursor-pointer group text-left w-full overflow-hidden"
        >
          {allPhotos[0]?.url ? (
            <img
              src={allPhotos[0].url}
              alt={vehicleName}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <span className="text-[100px] opacity-15 group-hover:opacity-20 transition">
              🚗
            </span>
          )}
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-[#dc2626] text-white text-xs font-bold px-2.5 py-1 rounded">
              DESTAQUE
            </span>
          </div>
          <div className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition">
            📷 Ver todas as fotos
          </div>
        </button>

        {/* Grid de thumbnails */}
        <div className="hidden lg:grid grid-rows-3 grid-cols-2 gap-1">
          {allPhotos.slice(1, 6).map((photo, i) => (
            <button
              key={photo.id}
              onClick={openGallery}
              className="relative bg-[#333] flex items-center justify-center hover:opacity-80 transition cursor-pointer overflow-hidden"
            >
              {photo.url ? (
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl opacity-30">{categoryEmojis[photo.category]}</span>
              )}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Exterior ({exteriorCount})
                </span>
              )}
              {i === 3 && (
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Interior ({interiorCount})
                </span>
              )}
            </button>
          ))}
          <button
            onClick={openGallery}
            className="relative bg-[#333] flex items-center justify-center cursor-pointer hover:opacity-80 transition overflow-hidden"
          >
            {allPhotos[6]?.url ? (
              <img src={allPhotos[6].url} alt="" className="w-full h-full object-cover opacity-50" />
            ) : (
              <span className="text-2xl opacity-30">📸</span>
            )}
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">
              Todas as Fotos ({allPhotos.length})
            </span>
          </button>
        </div>
      </div>

      {/* Galeria fullscreen overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-[#1a1a1a]"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          role="dialog"
          aria-label="Galeria de fotos"
        >
          {/* Header da galeria */}
          <div className="flex items-center justify-between px-6 h-12 bg-[#111] border-b border-gray-800">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setViewMode("grid");
                  }}
                  className={`text-sm transition ${
                    activeTab === tab.key
                      ? "text-white font-bold"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {viewMode === "single" && (
                <span className="text-gray-400 text-sm">
                  {currentIndex + 1} of {filteredPhotos.length}
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          {viewMode === "grid" ? (
            <div className="overflow-y-auto h-[calc(100vh-48px)] p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-w-[1400px] mx-auto">
                {filteredPhotos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => openLightbox(i)}
                    className="aspect-[4/3] bg-[#2d2d2d] rounded-lg overflow-hidden hover:opacity-80 transition flex items-center justify-center relative group"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={`${vehicleName} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl opacity-30">
                        {categoryEmojis[photo.category]}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-48px)] flex items-center justify-center relative select-none">
              {/* Seta esquerda */}
              <button
                onClick={prevPhoto}
                className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-3xl transition"
              >
                ‹
              </button>
              {/* Seta direita */}
              <button
                onClick={nextPhoto}
                className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-3xl transition"
              >
                ›
              </button>

              {/* Foto */}
              <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
                {filteredPhotos[currentIndex]?.url ? (
                  <img
                    src={filteredPhotos[currentIndex].url}
                    alt={`${vehicleName} - foto ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded"
                  />
                ) : (
                  <div className="w-[900px] h-[600px] bg-[#2d2d2d] rounded-xl flex flex-col items-center justify-center">
                    <span className="text-7xl opacity-30">
                      {categoryEmojis[filteredPhotos[currentIndex]?.category || "other"]}
                    </span>
                    <p className="text-gray-500 mt-4 text-sm">
                      {vehicleName} — {filteredPhotos[currentIndex]?.category}
                    </p>
                  </div>
                )}
              </div>

              {/* Voltar para grid */}
              <button
                onClick={() => setViewMode("grid")}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-sm px-4 py-2 rounded-lg transition"
              >
                ⊟ Voltar para grid
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

