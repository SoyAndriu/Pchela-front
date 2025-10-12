import React, { useEffect, useMemo, useState } from "react";

export default function SearchableProductSelect({ value, onChange, options, loading, darkMode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => options?.find(o => String(o.id) === String(value)), [options, value]);

  useEffect(() => {
    if (selected && !open && query === "") {
      setQuery(selected.nombre || "");
    }
    if (!selected && !open && query !== "") {
      setQuery("");
    }
  }, [selected, open, query]);

  const filtered = useMemo(() => {
    const list = Array.isArray(options) ? options : [];
    const q = (query || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter(p => (p.nombre || "").toLowerCase().includes(q));
  }, [options, query]);

  const inputBase = darkMode
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-300 text-gray-900";

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={selected ? selected.nombre : "Buscar y seleccionar..."}
        className={`w-full p-2 rounded border ${inputBase}`}
      />
      {open && (
        <div className={`absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Cargando productos…</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          ) : (
            <ul className="py-1">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(String(p.id));
                      setQuery(p.nombre || "");
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${darkMode ? "hover:bg-gray-800 text-gray-100" : "text-gray-800"}`}
                  >
                    {p.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
