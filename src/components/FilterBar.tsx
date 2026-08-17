"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const OFFER_OPTIONS = [
  { value: "active", label: "Ofertas Ativas" },
  { value: "all", label: "Todas" },
  { value: "sold", label: "Vendidos" },
];

const YEAR_OPTIONS = [
  { value: "", label: "Todos os Anos" },
  { value: "2020-2026", label: "2020+" },
  { value: "2015-2019", label: "2015–2019" },
  { value: "2010-2014", label: "2010–2014" },
  { value: "2000-2009", label: "2000–2009" },
  { value: "1970-1999", label: "Clássicos (antes de 2000)" },
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
  const currentYear = searchParams.get("year") || "";
  const currentTransmission = searchParams.get("transmission") || "all";
  const currentFuel = searchParams.get("fuel") || "all";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "active" && value !== "") {
        params.set(key, value);
      } else if (key === "status" && value !== "active") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters = currentStatus !== "active" || currentYear || currentTransmission !== "all" || currentFuel !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Ofertas */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
      >
        {OFFER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Anos */}
      <select
        value={currentYear}
        onChange={(e) => updateFilter("year", e.target.value)}
        className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
      >
        {YEAR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Câmbio */}
      <select
        value={currentTransmission}
        onChange={(e) => updateFilter("transmission", e.target.value)}
        className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
      >
        {TRANSMISSION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tipo (combustível) */}
      <select
        value={currentFuel}
        onChange={(e) => updateFilter("fuel", e.target.value)}
        className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-[#d4a853] outline-none cursor-pointer"
      >
        {FUEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          onClick={() => router.push("/")}
          className="text-xs text-gray-500 hover:text-[#dc2626] px-2 py-1 transition"
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}
