import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../../hooks/useProducts";
import { useLotes } from "../../hooks/useLotes";

export default function Cart({ value, onChange, darkMode }) {
  const { productos, fetchProducts } = useProducts();
  const { lotes, fetchLotes } = useLotes();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      fetchProducts();
    }
  }, [productos, fetchProducts]);

  useEffect(() => {
    value.forEach((item) => {
      fetchLotes(item.producto_id);
    });
  }, [value, fetchLotes]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = Array.isArray(productos) ? productos : [];
    if (!s) return list.slice(0, 20);
    return list.filter((p) => (p.nombre || "").toLowerCase().includes(s));
  }, [search, productos]);

  const addItem = (p) => {
    const exists = value.find((i) => i.producto_id === p.id);
    if (exists)
      onChange(
        value.map((i) =>
          i.producto_id === p.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      );
    else onChange([...value, { producto_id: p.id, cantidad: 1, lote_id: null }]);
  };

  const updateQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    onChange(value.map((i) => (i.producto_id === id ? { ...i, cantidad: q } : i)));
  };

  // Selección de descuento: reparte la cantidad entre los lotes disponibles con ese descuento, priorizando los de menor stock
  const updateDescuento = (id, descuento) => {
    const item = value.find(i => i.producto_id === id);
    if (!item) return;
    const cantidadTotal = Number(item.cantidad) || 1;
    let lotesFiltrados;

    if (descuento === 'Sin descuento') {
      lotesFiltrados = lotes.filter(l => l.producto === id && (!l.descuento_tipo || Number(l.descuento_valor) === 0) && Number(l.cantidad_disponible) > 0);
    } else if (descuento.endsWith('%')) {
      const val = Number(descuento.replace('%', ''));
      lotesFiltrados = lotes.filter(l => l.producto === id && l.descuento_tipo === 'porc' && Number(l.descuento_valor) === val && Number(l.cantidad_disponible) > 0);
    } else if (descuento.startsWith('$')) {
      const val = Number(descuento.replace('$', ''));
      lotesFiltrados = lotes.filter(l => l.producto === id && l.descuento_tipo === 'valor' && Number(l.descuento_valor) === val && Number(l.cantidad_disponible) > 0);
    } else {
      lotesFiltrados = [];
    }

    lotesFiltrados.sort((a, b) => Number(a.cantidad_disponible) - Number(b.cantidad_disponible));

    let cantidadRestante = cantidadTotal;
    const asignaciones = [];

    for (const lote of lotesFiltrados) {
      if (cantidadRestante <= 0) break;
      const usar = Math.min(Number(lote.cantidad_disponible), cantidadRestante);
      asignaciones.push({
        lote_id: lote.id,
        cantidad: usar,
        precio_unitario: lote.costo_unitario,
        descuento_por_item: lote.descuento_tipo === 'porc' ? Number(lote.descuento_valor) : (lote.descuento_tipo === 'valor' ? Number(lote.descuento_valor) : 0)
      });
      cantidadRestante -= usar;
    }

    onChange(value.map(i => i.producto_id === id ? {
      ...i,
      descuento_seleccionado: descuento,
      lotes_asignados: asignaciones
    } : i));
  };

  const removeItem = (id) => onChange(value.filter((i) => i.producto_id !== id));

  // Calcular el total sumando los subtotales de todos los lotes asignados
  const total = useMemo(
    () =>
      value.reduce((s, i) => {
        if (!i.lotes_asignados || i.lotes_asignados.length === 0) return s;
        return s + i.lotes_asignados.reduce((sum, lote) => {
          const precio = Number(lote.precio_unitario || 0);
          const cantidad = Number(lote.cantidad || 0);
          const descuento = Number(lote.descuento_por_item || 0);
          const subtotal = precio * cantidad;
          const descuentoAplicado = subtotal * (descuento / 100);
          return sum + (subtotal - descuentoAplicado);
        }, 0);
      }, 0),
    [value]
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeIn}
      className={`rounded-xl border p-5 shadow-sm transition-all ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-gray-100"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">🛒 Carrito</h3>
        <span
          className={`text-sm font-medium ${
            darkMode ? "text-pink-300" : "text-pink-600"
          }`}
        >
          {value.length} producto{value.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className={`w-full p-2 rounded-lg border text-sm shadow-sm focus:ring-2 focus:ring-pink-500 transition-all ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-gray-100"
              : "bg-white border-gray-300 text-gray-800"
          }`}
        />
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto"
        >
          {filtered.map((p) => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => addItem(p)}
              className={`text-left rounded-lg p-2 border text-sm transition-all ${
                darkMode
                  ? "bg-gray-900 hover:bg-gray-700 border-gray-700"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="font-medium truncate">{p.nombre}</div>
              <div className="text-xs opacity-70">
                ${Number(p.precio).toFixed(2)}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Carrito */}
      <div className="divide-y border-t">
        <AnimatePresence mode="sync">
          {value.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-sm text-center opacity-70"
            >
              Sin productos en el carrito.
            </motion.div>
          )}

          {value.map((i) => {
            const lotesProducto = lotes.filter(
              (l) => l.producto === i.producto_id && Number(l.cantidad_disponible) > 0
            );

            // Agrupar descuentos y calcular sumatoria de stock por descuento
            const descuentoStockMap = {};
            lotesProducto.forEach((l) => {
              let key;
              if (!l.descuento_tipo || Number(l.descuento_valor) === 0) {
                key = "Sin descuento";
              } else if (l.descuento_tipo === "porc") {
                key = `${l.descuento_valor}%`;
              } else if (l.descuento_tipo === "valor") {
                key = `$${l.descuento_valor}`;
              } else {
                key = "";
              }
              if (key) {
                descuentoStockMap[key] = (descuentoStockMap[key] || 0) + Number(l.cantidad_disponible);
              }
            });
            const descuentos = Object.keys(descuentoStockMap);

            return (
              <motion.div key={i.producto_id} variants={fadeIn} initial="hidden" animate="show" exit="exit" layout className="py-3">
                {/* Línea del producto */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                  <div className="flex-1 min-w-[120px]">
                    <div className="font-medium text-sm">Producto #{i.producto_id}</div>
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={i.cantidad}
                    onChange={(e) => updateQty(i.producto_id, e.target.value)}
                    className={`w-20 p-1 rounded border text-right text-sm ${
                      darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
                    }`}
                  />

                  {/* SELECT DE DESCUENTO --- AHORA EN EL LUGAR CORRECTO */}
                  <select
                    value={i.descuento_seleccionado || ""}
                    onChange={(e) => updateDescuento(i.producto_id, e.target.value)}
                    className={`w-40 p-1 rounded border text-sm ${
                      darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="" disabled>Seleccionar descuento</option>
                    {descuentos.map((desc) => (
                      <option key={desc} value={desc}>
                        {desc} ({descuentoStockMap[desc]})
                      </option>
                    ))}
                  </select>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeItem(i.producto_id)}
                    className={`text-xs font-medium hover:underline ${
                      darkMode ? "text-red-300 hover:text-red-400" : "text-red-600 hover:text-red-700"
                    }`}
                  >
                    Quitar
                  </motion.button>
                </div>

                {/* Lotes asignados y subtotales */}
                {i.lotes_asignados && i.lotes_asignados.length > 0 && (
                  <div className="mt-1 ml-1 text-xs opacity-80 flex flex-wrap gap-3 pl-3 border-l border-gray-500/30">
                    {i.lotes_asignados.map(lote => (
                      <div key={lote.lote_id} className="flex gap-2 items-center">
                        <span>Lote #{lote.lote_id}</span>
                        <span>Cant: {lote.cantidad}</span>
                        <span>Desc: {lote.descuento_por_item}{i.descuento_seleccionado && i.descuento_seleccionado.startsWith('$') ? ' $' : '%'}</span>
                        <span>Unit: ${Number(lote.precio_unitario).toFixed(2)}</span>
                        <span>Subtotal: ${((Number(lote.precio_unitario)*Number(lote.cantidad))*(1-(Number(lote.descuento_por_item)/100))).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-4 mt-2 flex justify-between items-center font-semibold text-base border-t"
      >
        <span>Total</span>
        <span
          className={`text-lg font-bold ${
            darkMode ? "text-pink-300" : "text-pink-600"
          }`}
        >
          ${total.toFixed(2)}
        </span>
      </motion.div>
    </motion.div>
  );
}
