"use client";

import { useEffect, useState, useMemo } from "react";

interface PsychologistProfile {
  slug: string;
  specialty: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  consultationFee: number | null;
  currency: string;
  sessionDuration: number;
  yearsOfExperience: number | null;
  modalityOnline: boolean;
  modalityPresential: boolean;
  acceptsNewPatients: boolean;
}

interface DirectoryEntry {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  profile: PsychologistProfile;
  reviewCount: number;
  averageRating: number | null;
}

function StarRating({ value, count }: { value: number | null; count: number }) {
  if (value === null) {
    return <span className="text-xs text-[#8A96A8]">Sin calificaciones</span>;
  }
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-300" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-[#2D4270]">{value.toFixed(1)}</span>
      <span className="text-xs text-[#8A96A8]">({count})</span>
    </div>
  );
}

function PsychCard({ entry }: { entry: DirectoryEntry }) {
  const p = entry.profile;
  const ini = entry.name
    ? entry.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : entry.email[0].toUpperCase();

  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D8EAF7] text-sm font-bold text-[#2D4270]">
          {entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image} alt="" className="h-full w-full object-cover" />
          ) : ini}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#1C2940] truncate">{entry.name || "Sin nombre"}</h3>
          {p.specialty && <p className="text-xs text-[#8AACC8] font-medium mt-0.5 truncate">{p.specialty}</p>}
          <div className="mt-1.5">
            <StarRating value={entry.averageRating} count={entry.reviewCount} />
          </div>
        </div>
        {!p.acceptsNewPatients && (
          <span className="shrink-0 text-[10px] font-semibold text-[#C0392B] bg-[#FDF0EE] px-2 py-1 rounded-full">No acepta nuevos pacientes</span>
        )}
      </div>

      {/* Bio */}
      {p.bio && (
        <p className="text-sm text-[#4A5568] line-clamp-2 leading-relaxed">{p.bio}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {p.modalityOnline && (
          <span className="text-[11px] font-medium bg-[#EEF2FA] text-[#2D4270] px-2.5 py-1 rounded-full">Online</span>
        )}
        {p.modalityPresential && (
          <span className="text-[11px] font-medium bg-[#EEF2FA] text-[#2D4270] px-2.5 py-1 rounded-full">Presencial</span>
        )}
        {p.city && (
          <span className="text-[11px] font-medium bg-[#F4F6FA] text-[#8A96A8] px-2.5 py-1 rounded-full">{p.city}</span>
        )}
        {p.yearsOfExperience != null && (
          <span className="text-[11px] font-medium bg-[#F4F6FA] text-[#8A96A8] px-2.5 py-1 rounded-full">{p.yearsOfExperience} años de exp.</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F4F6FA]">
        <div>
          {p.consultationFee != null ? (
            <p className="text-base font-bold text-[#2D4270]">
              {p.currency} {p.consultationFee.toLocaleString()}
              <span className="text-xs font-normal text-[#8A96A8] ml-1">/ sesión</span>
            </p>
          ) : (
            <p className="text-sm text-[#8A96A8]">Consultar precio</p>
          )}
          <p className="text-xs text-[#8A96A8]">{p.sessionDuration} min</p>
        </div>
        <a
          href={`/p/${p.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#2D4270] hover:bg-[#1F3060] text-white text-xs font-semibold px-4 py-2 transition-colors"
        >
          Ver perfil
        </a>
      </div>
    </div>
  );
}

type SortKey = "rating" | "price_asc" | "price_desc" | "name";

export default function PsychologistDirectory() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [maxFee, setMaxFee] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/psychologists")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEntries(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = entries.filter((e) => {
      if (!e.profile.acceptsNewPatients) return false;
      if (onlineOnly && !e.profile.modalityOnline) return false;
      if (maxFee !== "" && e.profile.consultationFee != null && e.profile.consultationFee > maxFee) return false;
      if (minRating > 0 && (e.averageRating === null || e.averageRating < minRating)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          e.name?.toLowerCase().includes(q) ||
          e.profile.specialty?.toLowerCase().includes(q) ||
          e.profile.city?.toLowerCase().includes(q) ||
          e.profile.bio?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "rating") {
        return (b.averageRating ?? -1) - (a.averageRating ?? -1);
      }
      if (sortBy === "price_asc") {
        const fa = a.profile.consultationFee ?? Infinity;
        const fb = b.profile.consultationFee ?? Infinity;
        return fa - fb;
      }
      if (sortBy === "price_desc") {
        const fa = a.profile.consultationFee ?? -1;
        const fb = b.profile.consultationFee ?? -1;
        return fb - fa;
      }
      // name
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return list;
  }, [entries, maxFee, minRating, sortBy, onlineOnly, search]);

  const hasActiveFilters = maxFee !== "" || minRating > 0 || onlineOnly || search.trim() !== "";

  function clearFilters() {
    setMaxFee("");
    setMinRating(0);
    setSortBy("rating");
    setOnlineOnly(false);
    setSearch("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-[#2D4270]">Directorio de psicólogos</h1>
        <span className="text-xs text-[#8A96A8] bg-[#F4F6FA] px-2.5 py-1 rounded-full">
          {loading ? "..." : `${filtered.length} disponible${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A96A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1C2940] focus:outline-none focus:ring-2 focus:ring-[#8AACC8] focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {/* Max price */}
          <label className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-xs font-semibold text-[#8A96A8] uppercase tracking-wide">Precio máximo (ARS)</span>
            <input
              type="number"
              min={0}
              step={500}
              placeholder="Sin límite"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1C2940] focus:outline-none focus:ring-2 focus:ring-[#8AACC8] focus:border-transparent"
            />
          </label>

          {/* Min rating */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8A96A8] uppercase tracking-wide">Calificación mínima</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinRating(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                    minRating === n
                      ? "bg-[#2D4270] text-white border-[#2D4270]"
                      : "bg-white text-[#8A96A8] border-[#E2E8F0] hover:border-[#8AACC8]"
                  }`}
                >
                  {n === 0 ? "All" : `${n}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <label className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs font-semibold text-[#8A96A8] uppercase tracking-wide">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1C2940] focus:outline-none focus:ring-2 focus:ring-[#8AACC8] focus:border-transparent"
            >
              <option value="rating">Mejor calificados</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </label>

          {/* Online toggle */}
          <button
            type="button"
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              onlineOnly
                ? "bg-[#2D4270] text-white border-[#2D4270]"
                : "bg-white text-[#8A96A8] border-[#E2E8F0] hover:border-[#8AACC8]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
            Solo online
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-[#C0392B] hover:underline self-end pb-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-[14px] bg-white border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#8AACC8] bg-white p-10 text-center">
          <p className="text-[#8A96A8] text-sm">No se encontraron psicólogos con los filtros seleccionados.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs text-[#2D4270] font-semibold hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <PsychCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
