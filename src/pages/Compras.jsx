import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useProducts } from "../hooks/useProducts";
import useProveedores from "../hooks/useProveedores";
import useMarcas from "../hooks/useMarcas";
import { useLotes } from "../hooks/useLotes";
import { API_BASE, DEBUG_CAJA } from "../config/productConfig";
import useCaja from "../hooks/useCaja";
import Toast from "../components/Toast";

export default function Compras({ darkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { productos, fetchProducts, loading: loadingProductos, apiError: productosError } = useProducts();
  const { proveedores, fetchProveedores, loading: loadingProveedores, error: proveedoresError } = useProveedores();
  const { marcas, fetchMarcas, loading: loadingMarcas, error: marcasError } = useMarcas();
  const { createLote, fetchLotes: fetchLotesProducto, lotes: lotesProducto } = useLotes();

  const [proveedor, setProveedor] = useState("");
  const [medioPago, setMedioPago] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [detalles, setDetalles] = useState([
    { producto: "", cantidad: "1", precio: "", numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" },
  ]);

  // Filtro por marca (el buscador por nombre ahora vive dentro del combobox por fila)
  const [marcaFiltro, setMarcaFiltro] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [notaPedido, setNotaPedido] = useState("");
  const { getSesionAbierta, crearMovimiento } = useCaja();
  // Control de caja abierta
  const [cajaLoading, setCajaLoading] = useState(true);
  const [cajaOpen, setCajaOpen] = useState(false);
  const [cajaErr, setCajaErr] = useState("");
  // Historial movido a página aparte

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  useEffect(() => {
    fetchProducts?.();
    fetchProveedores?.();
    fetchMarcas?.();
  }, [fetchProducts, fetchProveedores, fetchMarcas]);

  // Verificar estado de caja al montar
  useEffect(() => {
    let active = true;
    (async () => {
      setCajaLoading(true);
      setCajaErr("");
      try {
        const s = await getSesionAbierta();
        if (!active) return;
        setCajaOpen(!!s?.open);
      } catch (e) {
        if (!active) return;
        setCajaOpen(false);
        setCajaErr(e?.message || "No se pudo verificar la caja");
      } finally {
        if (active) setCajaLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getSesionAbierta]);

  // Preselección al llegar desde Productos
  useEffect(() => {
    const pid = location?.state?.productId;
    if (pid && Array.isArray(productos) && productos.length) {
      setDetalles([{ producto: String(pid), cantidad: 1, precio: 0, numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" }]);
      const prod = productos.find(p => String(p.id) === String(pid));
      const brandId = prod?.marca_id ?? (typeof prod?.marca === 'object' ? prod?.marca?.id : prod?.marca);
      if (brandId !== undefined && brandId !== null && brandId !== '') {
        setMarcaFiltro(String(brandId));
      }
      // Cargar lotes del producto para sugerir proveedor
      fetchLotesProducto?.(pid);
    }
  }, [location?.state?.productId, productos, fetchLotesProducto]);

  // Cuando lotes del producto estén listos, preseleccionar proveedor (último proveedor usado)
  useEffect(() => {
    const pid = location?.state?.productId;
    if (!pid) return;
    if (!Array.isArray(lotesProducto) || lotesProducto.length === 0) return;
    // Ordenar por fecha si existe, descendente
    const parseDate = (d) => (d ? new Date(d).getTime() : 0);
    const ordered = [...lotesProducto].sort((a,b) => parseDate(b.fecha_compra) - parseDate(a.fecha_compra));
    const ultimo = ordered[0];
    let proveedorId = null;
    if (ultimo?.proveedor) {
      if (typeof ultimo.proveedor === 'object' && ultimo.proveedor.id) proveedorId = ultimo.proveedor.id;
      else proveedorId = ultimo.proveedor;
    }
    if (proveedorId) setProveedor(String(proveedorId));
  }, [lotesProducto, location?.state?.productId]);

  // Historial eliminado de esta vista

  // Productos filtrados por marca (el texto lo filtra el combobox)
  const brandFilteredProducts = useMemo(() => {
    const items = Array.isArray(productos) ? productos : [];
    const brand = (marcaFiltro || '').trim();
    return items.filter(p => !brand || String(p.marca_id ?? p.marca) === String(brand));
  }, [productos, marcaFiltro]);

  // Cálculo de importes por línea con descuentos y total
  function getLineAmounts(d) {
    const qty = Math.max(0, Number(d.cantidad || 0));
    const price = Math.max(0, Number(d.precio || 0));
    const subtotal = qty * price;
    let discount = 0;
    if (d.descuentoTipo && d.descuentoValor !== '' && !Number.isNaN(Number(d.descuentoValor))) {
      const val = Math.max(0, Number(d.descuentoValor));
      if (d.descuentoTipo === 'porc') {
        const perc = Math.min(100, val);
        discount = (subtotal * perc) / 100;
      } else if (d.descuentoTipo === 'valor') {
        discount = Math.min(subtotal, val);
      }
    }
    const net = Math.max(0, subtotal - discount);
    return { subtotal, discount, net };
  }

  // Totales (bruto, descuento, neto) memorizados
  const totalBruto = useMemo(() => detalles.reduce((sum, d) => sum + getLineAmounts(d).subtotal, 0), [detalles]);
  const totalDescuento = useMemo(() => detalles.reduce((sum, d) => sum + getLineAmounts(d).discount, 0), [detalles]);
  const totalNeto = useMemo(() => detalles.reduce((sum, d) => sum + getLineAmounts(d).net, 0), [detalles]);

  const calcularTotal = () => detalles.reduce((sum, d) => sum + getLineAmounts(d).net, 0);

  const handleChangeDetalle = (index, field, value) => {
    const nuevos = [...detalles];
    if (field === "cantidad") {
      const v = String(value ?? "");
      // Solo dígitos, sin ceros a la izquierda (si hay más de un dígito)
      const digits = v.replace(/\D/g, "");
      const cleaned = digits.replace(/^0+(?=\d)/, "");
      nuevos[index][field] = cleaned;
    } else if (field === "precio") {
      // Sanitizar: quitar ceros a la izquierda (pero permitir "0" y vacío)
      const v = String(value ?? "");
      const cleaned = v.replace(/^0+(?=\d)/, "");
      nuevos[index][field] = cleaned;
    } else {
      nuevos[index][field] = value;
    }
    setDetalles(nuevos);
  };

  const agregarLinea = () => {
    setDetalles([...detalles, { producto: "", cantidad: "1", precio: "", numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" }]);
  };

  const eliminarLinea = (index) => {
    const nuevos = detalles.filter((_, i) => i !== index);
    setDetalles(nuevos);
  };

  const handleRegistrarCompra = async () => {
    if (!proveedor || detalles.length === 0) {
      setToastType("info");
      setToastMsg("Completa proveedor y al menos una línea de detalle");
      return;
    }
    // Validaciones por línea
    for (const d of detalles) {
      if (!d.producto) { setToastType("info"); setToastMsg("Seleccioná un producto en cada línea"); return; }
      if (!d.cantidad || Number(d.cantidad) <= 0) { setToastType("info"); setToastMsg("La cantidad debe ser mayor a 0"); return; }
      if (d.precio === "" || Number(d.precio) < 0) { setToastType("info"); setToastMsg("El precio no puede ser negativo"); return; }
      // Lote obligatorio con confirmación
      if (!d.numeroLote || !String(d.numeroLote).trim()) { setToastType("info"); setToastMsg("Ingresá el número de lote en cada línea"); return; }
      if (!d.confirmarLote || String(d.confirmarLote).trim() !== String(d.numeroLote).trim()) {
        setToastType("info"); setToastMsg("La confirmación del número de lote no coincide"); return;
      }
      if (d.descuentoTipo && d.descuentoTipo !== 'porc' && d.descuentoTipo !== 'valor') { setToastType("info"); setToastMsg("Tipo de descuento inválido"); return; }
      if (d.descuentoTipo && (d.descuentoValor === '' || Number.isNaN(Number(d.descuentoValor)))) { setToastType("info"); setToastMsg("Ingresá un valor de descuento válido"); return; }
      if (d.descuentoTipo) {
        const qty = Math.max(0, Number(d.cantidad || 0));
        const price = Math.max(0, Number(d.precio || 0));
        const subtotal = qty * price;
        const val = Math.max(0, Number(d.descuentoValor || 0));
        if (d.descuentoTipo === 'porc' && (val < 0 || val > 100)) { setToastType("info"); setToastMsg("El descuento en % debe estar entre 0 y 100"); return; }
        if (d.descuentoTipo === 'valor' && val > subtotal) { setToastType("info"); setToastMsg("El descuento en valor no puede superar el subtotal de la línea"); return; }
      }
    }
    setGuardando(true);
    try {
  // Registrar compra y detalles (placeholder)
  if (DEBUG_CAJA) console.debug("Registrando compra:", { proveedor, medioPago, tipoPago, notaPedido, detalles });
      // Simular id de compra (hasta conectar API real)
      const compraId = Math.floor(Date.now() / 1000);

      // Crear lotes para cada producto
      for (const d of detalles) {
        const productoSel = productos.find((p) => p.id === Number(d.producto));
        if (productoSel) {
          await createLote({
            producto: productoSel.id,
            numero_lote: String(d.numeroLote).trim(),
            cantidad_inicial: Number(d.cantidad || 0),
            cantidad_disponible: Number(d.cantidad || 0),
            costo_unitario: Number(d.precio || 0),
            descuento_tipo: d.descuentoTipo || null,
            descuento_valor: d.descuentoValor ? Number(d.descuentoValor) : null,
            proveedor: Number(proveedor),
            notas: d.notas?.trim() || null,
          });
        }
      }

      // Registrar movimiento de caja automáticamente según medio de pago
      const mapMedio = {
        efectivo: 'EFECTIVO',
        tarjeta: 'TARJETA',
        transferencia: 'TRANSFERENCIA',
        credito: 'CREDITO',
      };
      const total = Number(calcularTotal());
      if (!Number.isFinite(total) || total <= 0) {
        console.warn("Movimiento de caja omitido: total inválido", total);
      } else if (medioPago === 'efectivo') {
        try {
          const s = await getSesionAbierta();
          if (s?.open) {
            await crearMovimiento({
              tipo_movimiento: 'EGRESO',
              origen: 'COMPRA',
              ref_type: 'compra',
              ref_id: compraId,
              monto: total,
              medio_pago: mapMedio[medioPago] || 'EFECTIVO',
              descripcion: `Compra proveedor ${proveedores?.find(p=>String(p.id)===String(proveedor))?.nombre || ''}`,
            });
          } else {
            setToastType("error");
            setToastMsg("No hay una caja abierta. Se registró la compra, pero no el movimiento de caja.");
          }
        } catch (err) {
          setToastType("error");
          setToastMsg((err?.message || "Error registrando en caja") + ". La compra fue registrada.");
        }
      } else if (medioPago === 'tarjeta' || medioPago === 'transferencia' || medioPago === 'credito') {
        // Registrar movimiento electrónico para impactar saldo_total (no efectivo)
        try {
          const s = await getSesionAbierta();
          if (s?.open) {
            await crearMovimiento({
              tipo_movimiento: 'EGRESO',
              origen: 'COMPRA',
              ref_type: 'compra',
              ref_id: compraId,
              monto: total,
              medio_pago: mapMedio[medioPago],
              descripcion: `Compra (${medioPago}) proveedor ${proveedores?.find(p=>String(p.id)===String(proveedor))?.nombre || ''}`,
            });
          } else {
            if (DEBUG_CAJA) console.warn("Caja cerrada: no se registró movimiento electrónico de compra");
            setToastType("info");
            setToastMsg("Caja cerrada: no se registró movimiento electrónico de compra");
          }
        } catch (err) {
          const msg = err?.message || String(err) || "Error registrando movimiento electrónico de compra";
          console.warn("Error registrando movimiento electrónico de compra:", msg);
          setToastType("error");
          setToastMsg(msg + ". La compra fue registrada.");
        }
      }

    setToastType("success");
    setToastMsg("Compra registrada exitosamente");
  setDetalles([{ producto: "", cantidad: "1", precio: "", numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" }]);
      setProveedor("");
      setMedioPago("");
      setTipoPago("");
    setNotaPedido("");
    } catch (err) {
      console.error(err);
      setToastType("error");
      setToastMsg("Error al registrar la compra");
    } finally {
      setGuardando(false);
    }
  };

  // Reducimos el uso del color rosa: tonos neutros en textos y contenedores
  const card = darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800";
  const input = darkMode
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-300";

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
          Registrar Compra
        </h1>
        <button
          type="button"
          onClick={() => navigate('/gerente/compras/historial')}
          className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${
            darkMode ? 'border-pink-700 text-pink-300 hover:bg-pink-900/30' : 'border-pink-200 text-pink-600 hover:bg-pink-50'
          }`}
        >
          Ver historial
        </button>
      </div>

      {/* Gate de Caja: bloquear si no hay caja abierta */}
      {cajaLoading ? (
        <div className={`p-4 rounded-lg shadow mb-6 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
          Verificando estado de caja…
        </div>
      ) : !cajaOpen ? (
        <div className={`p-5 rounded-lg shadow border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2">Caja no abierta</h2>
          <p className="mb-4 text-sm opacity-80">Debés abrir la caja antes de registrar compras. Podés ir a Caja para hacer la apertura. {cajaErr && (<span className="block mt-2 text-red-500">{cajaErr}</span>)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/cajero/caja')}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
            >
              Ir a Caja
            </button>
            <button
              onClick={async () => {
                setCajaLoading(true);
                try { const s = await getSesionAbierta(); setCajaOpen(!!s?.open); setCajaErr(""); } catch (e) { setCajaOpen(false); setCajaErr(e?.message || "No se pudo verificar la caja"); } finally { setCajaLoading(false); }
              }}
              className={`px-4 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SECCIÓN 1: DATOS PRINCIPALES */}
          <div className={`p-4 rounded-lg shadow mb-6 ${card}`}>
  <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm block mb-1">Proveedor</label>
                <select
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className={`w-full p-2 rounded border ${input}`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {loadingProveedores && <option>Cargando proveedores…</option>}
                  {proveedoresError && <option disabled>Error cargando proveedores</option>}
                  {proveedores?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm block mb-1">Medio de pago</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                  className={`w-full p-2 rounded border ${input}`}
                >
                  <option value="">Seleccionar medio</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="text-sm block mb-1">Tipo de pago</label>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  className={`w-full p-2 rounded border ${input}`}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-sm block mb-1">Nota de pedido (opcional)</label>
                <input
                  type="text"
                  value={notaPedido}
                  onChange={(e) => setNotaPedido(e.target.value)}
                  className={`w-full p-2 rounded border ${input}`}
                  placeholder="Ej: NP-2025-001 / Referencia interna"
                />
              </div>
              <div className="md:col-span-3 mt-2">
                <p className="text-xs opacity-75">
                  Hint: registramos el EGRESO automáticamente según el medio.
                  <b> Efectivo</b> impacta el saldo de efectivo y el total; <b>tarjeta/transferencia/crédito</b> impactan sólo el saldo total.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLE DE COMPRA */}
          <div className={`p-4 rounded-lg shadow mb-6 ${card}`}>
            <h2 className="text-lg font-semibold mb-4">Detalle de productos</h2>

            {/* Filtro por marca (el texto se busca dentro del combobox por fila) */}
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-sm block mb-1">Filtrar por marca</label>
                <select
                  value={marcaFiltro}
                  onChange={(e) => setMarcaFiltro(e.target.value)}
                  className={`w-full p-2 rounded border ${input}`}
                >
                  <option value="">Todas</option>
                  {loadingMarcas && <option>Cargando marcas…</option>}
                  {marcasError && <option disabled>Error cargando marcas</option>}
                  {marcas?.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre || m.nombre_marca}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opciones filtradas */}
            {productosError && (
              <p className="text-red-500 text-sm mb-3">{String(productosError)}</p>
            )}

            {detalles.map((d, i) => {
              // const selectedId = Number(d.producto);
              // const all = Array.isArray(productos) ? productos : [];
              return (
                <div key={i} className="grid md:grid-cols-6 gap-3 mb-3 items-end">
                  <div className="md:col-span-2">
                    <label className="text-sm block mb-1">Producto</label>
                    <SearchableProductSelect
                      value={d.producto}
                      onChange={(val) => handleChangeDetalle(i, "producto", val)}
                      options={brandFilteredProducts}
                      loading={loadingProductos}
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={d.cantidad}
                      onChange={(e) => handleChangeDetalle(i, "cantidad", e.target.value)}
                      onBlur={(e) => {
                        const val = String(e.target.value || "");
                        const digits = val.replace(/\D/g, "");
                        let n = parseInt(digits || "", 10);
                        if (!Number.isFinite(n) || n < 1) n = 1;
                        handleChangeDetalle(i, "cantidad", String(n));
                      }}
                      onKeyDown={(e) => {
                        if (["e","E","+","-",".",","] .includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full p-2 rounded border ${input}`}
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1">Precio unitario</label>
                    <input
                      type="number"
                      min="0"
                      value={d.precio}
                      onChange={(e) => handleChangeDetalle(i, "precio", e.target.value)}
                      className={`w-full p-2 rounded border ${input}`}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1">N° Lote</label>
                    <input
                      type="text"
                      value={d.numeroLote || ""}
                      onChange={(e) => handleChangeDetalle(i, "numeroLote", e.target.value)}
                      className={`w-full p-2 rounded border ${input}`}
                      placeholder="Ej: L-12345"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1">Confirmar N° Lote</label>
                    <input
                      type="text"
                      value={d.confirmarLote || ""}
                      onChange={(e) => handleChangeDetalle(i, "confirmarLote", e.target.value)}
                      className={`w-full p-2 rounded border ${input}`}
                      placeholder="Repite el número de lote"
                      required
                    />
                  </div>

                  <div className="md:col-span-6 grid md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-sm block mb-1">Tipo Descuento</label>
                      <select
                        value={d.descuentoTipo}
                        onChange={(e) => handleChangeDetalle(i, "descuentoTipo", e.target.value)}
                        className={`w-full p-2 rounded border ${input}`}
                      >
                        <option value="">Ninguno</option>
                        <option value="porc">% Porcentaje</option>
                        <option value="valor">Valor total</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm block mb-1">Descuento</label>
                      <input
                        type="number"
                        step="0.01"
                        value={d.descuentoValor}
                        disabled={!d.descuentoTipo}
                        onChange={(e) => handleChangeDetalle(i, "descuentoValor", e.target.value)}
                        className={`w-full p-2 rounded border ${input}`}
                        placeholder={d.descuentoTipo === 'porc' ? 'Ej: 10 (para 10%)' : 'Ej: 5000'}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm block mb-1">Notas</label>
                      <input
                        type="text"
                        value={d.notas || ''}
                        onChange={(e) => handleChangeDetalle(i, "notas", e.target.value)}
                        className={`w-full p-2 rounded border ${input}`}
                        placeholder="Notas opcionales"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {(() => {
                        const a = getLineAmounts(d);
                        return (
                          <>
                            <span className="font-semibold">Subtotal neto:</span> ${a.net.toFixed(2)}
                            {a.discount > 0 && (
                              <span className="opacity-75 ml-2">(antes: ${a.subtotal.toFixed(2)} • desc: -${a.discount.toFixed(2)})</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {detalles.length > 1 && (
                      <button
                        onClick={() => eliminarLinea(i)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={agregarLinea}
              className={`flex items-center gap-1 px-3 py-1 mt-2 rounded text-sm font-medium ${
                darkMode
                  ? "bg-pink-600 hover:bg-pink-700 text-white"
                  : "bg-pink-500 hover:bg-pink-600 text-white"
              }`}
            >
              <PlusCircleIcon className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          {/* SECCIÓN 3: TOTALES */}
          <div className={`p-4 rounded-lg shadow mb-6 ${card}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-lg font-semibold">
              <div className="flex justify-between">
                <span>Ítems:</span>
                <span>{detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Líneas:</span>
                <span>{detalles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total bruto:</span>
                <span>${totalBruto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento:</span>
                <span>- ${totalDescuento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total neto:</span>
                <span>${totalNeto.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* BOTÓN FINAL */}
          <button
            onClick={handleRegistrarCompra}
            disabled={guardando}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              guardando
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                ? "bg-pink-600 hover:bg-pink-700 text-white"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {guardando ? "Registrando..." : "Registrar Compra"}
          </button>
        </>
      )}
      
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />
    </div>
  );
}

// Combobox simple y accesible sin dependencias externas
function SearchableProductSelect({ value, onChange, options, loading, darkMode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => options?.find(o => String(o.id) === String(value)), [options, value]);

  // Sincroniza el texto mostrado con el seleccionado cuando cambia externamente
  useEffect(() => {
    if (selected && !open && query === "") {
      setQuery(selected.nombre || "");
    }
    if (!selected && !open && query !== "") {
      // Si se limpió la selección desde afuera, vaciamos el query
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
      {/* Botón para limpiar selección */}
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
