"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

const OFFER_OPTIONS = [
  { value: "active", label: "Ofertas Ativas" },
  { value: "all", label: "Todas" },
  { value: "sold", label: "Vendidos" },
];

const TRANSMISSION_OPTIONS = [
  { value: "all", label: "Todos os Câmbios" },
  { value: "Manual", label: "Manual" },
  { value: "Automático", label: "Automático" },
];

const FUEL_OPTIONS = [
  { value: "all", label: "Todos os Tipos" },
  { value: "Gasolina", label: "Gasolina" },
  { value: "Flex", label: "Flex" },
  { value: "Diesel", label: "Diesel" },
  { value: "Elétrico", label: "Elétrico" },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "active";
  const currentYearMin = searchParams.get("yearMin") || "";
  const currentYearMax = searchParams.get("yearMax") || "";
  const currentTransmission = searchParams.get("transmission") || "all";
  const currentFuel = searchParams.get("fuel") || "all";

  const [yearMin, setYearMin] = useState(currentYearMin);
  const [yearMax, setYearMax] = useState(currentYearMax);

  const buildUrl = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      const values = {
        status: currentStatus,
        yearMin,
        yearMax,
        transmission: currentTransmission,
        fuel: currentFuel,
        ...overrides,
      };

      // Limpar e setar
      Object.entries(values).forEach(([key, value]) => {
        if (!value || value === "all" || (key === "status" && value === "active")) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const qs = params.toString();
      return qs ? `/?${qs}` : "/";
    },
    [searchParams, currentStatus, yearMin, yearMax, currentTransmission, currentFuel]
  );

  function applyFilter(key: string, value: string) {
    router.push(buildUrl({ [key]: value }));
  }

  function applyYears() {
    const validMin = yearMin && parseInt(yearMin) > 0 ? yearMin : "";
    const validMax = yearMax && parseInt(yearMax) > 0 ? yearMax : "";
    router.push(buildUrl({ yearMin: validMin, yearMax: validMax }));
  }

  const hasFilters =
    currentStatus !== "active" ||
    currentYearMin ||
    currentYearMax ||
    currentTransmission !== "all" ||
    currentFuel !== "all";

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      {/* Ofertas */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Ofertas</label>
        <select
          value={currentStatus}
          onChange={(e) => applyFilter("status", e.target.value)}
          className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
        >
          {OFFER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Anos - De/Até */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Anos</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            onBlur={applyYears}
            onKeyDown={(e) => e.key === "Enter" && applyYears()}
            placeholder="De"
            min="1950"
            max="2026"
            className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-2 py-2 w-[72px] focus:border-[#d4a853] outline-none placeholder-gray-600"
          />
          <span className="text-gray-600 text-xs">—</span>
          <input
            type="number"
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            onBlur={applyYears}
            onKeyDown={(e) => e.key === "Enter" && applyYears()}
            placeholder="Até"
            min="1950"
            max="2026"
            className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-2 py-2 w-[72px] focus:border-[#d4a853] outline-none placeholder-gray-600"
          />
        </div>
      </div>

      {/* Câmbio */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Câmbio</label>
        <select
          value={currentTransmission}
          onChange={(e) => applyFilter("transmission", e.target.value)}
          className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
        >
          {TRANSMISSION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Tipo</label>
        <select
          value={currentFuel}
          onChange={(e) => applyFilter("fuel", e.target.value)}
          className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
        >
          {FUEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Limpar */}
      {hasFilters && (
        <button
          onClick={() => router.push("/")}
          className="text-xs text-gray-500 hover:text-[#dc2626] px-2 py-2 transition"
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}
