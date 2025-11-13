import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useProducts } from "../hooks/useProducts";
import useProveedores from "../hooks/useProveedores";
import useMarcas from "../hooks/useMarcas";
import { useLotes } from "../hooks/useLotes";
import { DEBUG_CAJA } from "../config/productConfig";
import { useRegistrarCompra } from "../hooks/useRegistrarCompra";
import useCaja from "../hooks/useCaja";
import Toast from "../components/Toast";
import CompraLineItem from "../components/compras/CompraLineItem";
import CompraTotals from "../components/compras/CompraTotals";
import ProveedorModal from "../components/proveedores/ProveedorModal";
import ProductModal from "../components/products/ProductModal";

export default function Compras({ darkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { productos, fetchProducts, loading: loadingProductos, apiError: productosError, saveProduct } = useProducts();
  const { proveedores, fetchProveedores, loading: loadingProveedores, error: proveedoresError, existsProveedor, createProveedor } = useProveedores();
  const { marcas, fetchMarcas, loading: loadingMarcas, error: marcasError } = useMarcas();
  const { fetchLotes: fetchLotesProducto, lotes: lotesProducto } = useLotes();

  const [proveedor, setProveedor] = useState("");
  const [showTooltipProveedor, setShowTooltipProveedor] = useState(false);
  const [medioPago, setMedioPago] = useState("");
  const [detalles, setDetalles] = useState([
    { producto: "", cantidad: "1", precio: "", numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" },
  ]);

  // Filtro por marca (el buscador por nombre ahora vive dentro del combobox por fila)
  const [marcaFiltro, setMarcaFiltro] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [notaPedido, setNotaPedido] = useState("");
  const { getSesionAbierta } = useCaja();
  // Control de caja abierta
  const [cajaLoading, setCajaLoading] = useState(true);
  const [cajaOpen, setCajaOpen] = useState(false);
  const [cajaErr, setCajaErr] = useState("");
  // Historial movido a página aparte

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoForm, setProductoForm] = useState({ nombre: '', precio: '', categoria_id: '', marca_id: '' });
  const [productoErrors, setProductoErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [savingProducto, setSavingProducto] = useState(false);
  const [newProductTargetIndex, setNewProductTargetIndex] = useState(null);
  const [compraTicket, setCompraTicket] = useState(null);

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

  // Productos filtrados por marca (el texto lo filtra el combobox por fila)
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

  const { registrarCompra } = useRegistrarCompra();
  const handleRegistrarCompra = async () => {
    if (!proveedor || detalles.length === 0) {
      setToastType("info");
      setToastMsg("Completa proveedor y al menos una línea de detalle");
      return;
    }
    // Medio de pago obligatorio
    const medioSeleccionado = (medioPago || '').trim();
    if (!medioSeleccionado) {
      setToastType('info');
      setToastMsg('Seleccioná el medio de pago');
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
      if (DEBUG_CAJA) console.debug("Registrando compra:", { proveedor, medioPago, notaPedido, detalles });
      // Armar payload para el backend
      const lotes = detalles.map((d) => ({
        producto: Number(d.producto),
        numero_lote: String(d.numeroLote).trim(),
        cantidad_inicial: Number(d.cantidad || 0),
        cantidad_disponible: Number(d.cantidad || 0),
        costo_unitario: Number(d.precio || 0),
        descuento_tipo: d.descuentoTipo || null,
        descuento_valor: d.descuentoValor ? Number(d.descuentoValor) : null,
        fecha_vencimiento: d.fechaVencimiento || null,
        notas: [d.notas?.trim(), notaPedido?.trim()].filter(Boolean).join(' | ') || null,
      }));
      const payload = {
        id_proveedor: Number(proveedor),
        monto_total: Number(calcularTotal()),
        lotes,
        medio_pago: medioSeleccionado,
        nota_pedido: notaPedido?.trim() || null,
      };
      const { data, error } = await registrarCompra(payload);
      if (error) throw error;
      setToastType("success");
      setToastMsg("Compra registrada exitosamente");
      setCompraTicket(data);
      setDetalles([{ producto: "", cantidad: "1", precio: "", numeroLote: "", confirmarLote: "", descuentoTipo: "", descuentoValor: "", notas: "" }]);
      setProveedor("");
      setMedioPago("");
      setNotaPedido("");
    } catch (err) {
      console.error(err);
      setToastType("error");
      setToastMsg(err?.message || "Error al registrar la compra");
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

      {/* Ticket de compra */}
      {compraTicket && (
        <div className={`mb-6 p-4 rounded-xl border shadow-sm ${darkMode ? "bg-gray-900 border-pink-700 text-pink-200" : "bg-pink-50 border-pink-300 text-pink-900"}`}>
          <h4 className="font-bold text-lg mb-2">Ticket de Compra #{compraTicket.id}</h4>
          <div className="mb-1 text-sm">Fecha: {new Date(compraTicket.fecha_compra).toLocaleString()}</div>
          <div className="mb-1 text-sm">Proveedor: {compraTicket.id_proveedor}</div>
          <div className="mb-1 text-sm">Usuario: {compraTicket.id_usuario}</div>
          <div className="mb-2 text-sm">Total: <span className="font-bold">${Number(compraTicket.monto_total).toFixed(2)}</span></div>
          <div className="mb-2">
            <span className="font-semibold">Detalles:</span>
            <ul className="ml-4 list-disc">
              {compraTicket.detalles?.map(d => (
                <li key={d.id} className="text-xs">
                  Producto: {d.producto?.nombre} | Lote: {d.id_lote} | Cantidad: {d.cantidad} | Unit: ${Number(d.costo_unitario).toFixed(2)} | Desc: {d.descuento_por_item} | Subtotal: ${Number(d.subtotal).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <button
            className={`mt-2 px-3 py-1 rounded bg-pink-500 text-white font-semibold hover:bg-pink-600`}
            onClick={() => setCompraTicket(null)}
          >Cerrar ticket</button>
        </div>
      )}
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
                <div className="flex gap-2">
                  <select
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className={`w-full p-2 rounded border ${input}`}
                  >
                    <option value="">Seleccionar proveedor</option>
                    {loadingProveedores && <option>Cargando proveedores…</option>}
                    {proveedoresError && <option disabled>Error cargando proveedores</option>}
                    {proveedores?.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Crear nuevo proveedor"
                      role="button"
                      onClick={() => setShowProveedorModal(true)}
                      onMouseEnter={() => setShowTooltipProveedor(true)}
                      onMouseLeave={() => setShowTooltipProveedor(false)}
                      onFocus={() => setShowTooltipProveedor(true)}
                      onBlur={() => setShowTooltipProveedor(false)}
                      className={`transition-all duration-150 px-3 rounded flex items-center justify-center shadow-sm focus:outline-none ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-pink-700 focus:bg-pink-700' : 'bg-gray-200 text-gray-800 hover:bg-pink-500 focus:bg-pink-500'}`}
                      style={{ height: '2.25rem', minWidth: '2.25rem', width: '2.25rem', fontSize: '1.25rem', fontWeight: 600, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}
                    >
                      <PlusIcon className="w-6 h-6" />
                    </button>
                    {showTooltipProveedor && (
                      <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded text-xs shadow-lg z-10 ${darkMode ? 'bg-gray-900 text-pink-200' : 'bg-white text-pink-600 border border-pink-200'}`}>
                        Crear nuevo proveedor
                      </div>
                    )}
                  </div>
                </div>
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
                  <option value="transferencia">Transferencia</option>
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
                  <b> Efectivo</b> impacta el saldo de efectivo y el total; <b>Tarjeta</b>/<b>Transferencia</b>/<b>Crédito</b> impactan sólo el saldo total.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLE DE COMPRA */}
          <div className={`p-4 rounded-lg shadow mb-6 ${card}`}>
            <h2 className="text-lg font-semibold mb-4">Detalle de productos</h2>

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

            {productosError && (
              <p className="text-red-500 text-sm mb-3">{String(productosError)}</p>
            )}

            {detalles.map((d, i) => (
              <CompraLineItem
                key={i}
                index={i}
                d={d}
                darkMode={darkMode}
                inputClass={input}
                options={brandFilteredProducts}
                loadingProductos={loadingProductos}
                onChangeDetalle={handleChangeDetalle}
                onEliminar={eliminarLinea}
                getLineAmounts={getLineAmounts}
                onNewProduct={(idx) => { setNewProductTargetIndex(idx); setShowProductModal(true); }}
              />
            ))}

            <button
              onClick={agregarLinea}
              className={`flex items-center gap-1 px-3 py-1 mt-2 rounded text-sm font-medium ${
                darkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"
              }`}
            >
              <PlusIcon className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          {/* SECCIÓN 3: TOTALES */}
          <CompraTotals
            detalles={detalles}
            totalBruto={totalBruto}
            totalDescuento={totalDescuento}
            totalNeto={totalNeto}
            cardClass={card}
          />

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
      <ProveedorModal
        visible={showProveedorModal}
        darkMode={darkMode}
        onClose={() => setShowProveedorModal(false)}
        onSave={async (form) => {
          try {
            const dup = await existsProveedor({ cuil: form.cuil, nombre: form.nombre });
            if (dup) {
              setToastType('info');
              setToastMsg(`Proveedor ya existe: ${dup.nombre}`);
              setProveedor(String(dup.id));
              return;
            }
          } catch { /* ignore */ }
          const nuevo = await createProveedor(form);
          setProveedor(String(nuevo.id));
          setToastType('success');
          setToastMsg('Proveedor creado');
        }}
      />
      <ProductModal
        visible={showProductModal}
        darkMode={darkMode}
        isEditing={false}
        productoForm={productoForm}
        errors={productoErrors}
        selectedFile={selectedFile}
        saving={savingProducto}
        existingProducts={productos}
        onClose={() => {
          setShowProductModal(false);
          setProductoForm({ nombre: '', precio: '', categoria_id: '', marca_id: '' });
          setSelectedFile(null);
          setProductoErrors({});
        }}
        onFieldChange={(field, value) => {
          setProductoForm(f => ({ ...f, [field]: value }));
          setProductoErrors(errs => ({ ...errs, [field]: undefined }));
        }}
        onFileChange={(file) => setSelectedFile(file)}
  onSave={async () => {
          // Validaciones mínimas
          const errs = {};
          if (!productoForm.nombre?.trim()) errs.nombre = 'Nombre obligatorio';
          if (!productoForm.precio || Number(productoForm.precio) < 0) errs.precio = 'Precio inválido';
          if (!productoForm.categoria_id) errs.categoria_id = 'Selecciona categoría';
          if (Object.keys(errs).length) { setProductoErrors(errs); return; }
          setSavingProducto(true);
          try {
            const created = await saveProduct(productoForm, selectedFile, false);
            setToastType('success');
            setToastMsg('Producto creado');
            // refrescar lista ya se hace dentro de saveProduct
            // Seleccionar producto recién creado (buscamos por nombre y precio)
            const creado = (created && created.id) ? created : (productos.find(p => p.nombre === productoForm.nombre));
            if (creado) {
              setDetalles(detalles => {
                const copia = [...detalles];
                if (newProductTargetIndex != null && copia[newProductTargetIndex]) {
                  copia[newProductTargetIndex].producto = String(creado.id);
                  if (!copia[newProductTargetIndex].precio) copia[newProductTargetIndex].precio = String(creado.precio || '');
                } else {
                  if (copia.length === 0 || copia[0].producto) {
                    copia.unshift({ producto: String(creado.id), cantidad: '1', precio: String(creado.precio || ''), numeroLote: '', confirmarLote: '', descuentoTipo: '', descuentoValor: '', notas: '' });
                  } else {
                    copia[0].producto = String(creado.id);
                    copia[0].precio = String(creado.precio || '');
                  }
                }
                return copia;
              });
              setMarcaFiltro(String((creado.marca_id ?? (creado.marca?.id)) || ''));
            }
            setNewProductTargetIndex(null);
            setShowProductModal(false);
            setProductoForm({ nombre: '', precio: '', categoria_id: '', marca_id: '' });
            setSelectedFile(null);
          } catch (e) {
            setToastType('error');
            setToastMsg(e?.message || 'Error creando producto');
          } finally {
            setSavingProducto(false);
          }
        }}
      />
    </div>
  );
}