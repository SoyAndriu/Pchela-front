import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import useCaja from "../hooks/useCaja";

export default function Ventas({ darkMode }) {
  const navigate = useNavigate();
  const { getSesionAbierta } = useCaja();

  // Estado de ventas de prueba (hasta conectar con API)
  const [ventas, setVentas] = useState([
    { id: 1, fecha: "2025-09-01", empleado: "Juan Pérez", total: 25000 },
    { id: 2, fecha: "2025-09-15", empleado: "María Gómez", total: 15000 },
    { id: 3, fecha: "2025-09-20", empleado: "Ana Silva", total: 32000 },
    { id: 4, fecha: "2025-09-25", empleado: "Carlos López", total: 18500 },
  ]);

  // Gate de Caja
  const [cajaLoading, setCajaLoading] = useState(true);
  const [cajaOpen, setCajaOpen] = useState(false);
  const [cajaErr, setCajaErr] = useState("");

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
    return () => { active = false; };
  }, []);

  const agregarVenta = () => {
    const nuevaVenta = {
      id: ventas.length + 1,
      fecha: new Date().toISOString().split("T")[0],
      empleado: "Empleado Demo",
      total: Math.floor(Math.random() * 50000) + 1000,
    };
    setVentas([...ventas, nuevaVenta]);
  };

  const eliminarVenta = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
      setVentas(ventas.filter((venta) => venta.id !== id));
    }
  };

  const editarVenta = (id) => {
    alert(`Editar venta ${id} - Funcionalidad por implementar`);
  };

  // Calcular total de ventas
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            darkMode 
              ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600" 
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
          Gestión de Ventas
        </h1>
        <div className="w-[90px]" />
      </header>

      {/* Aviso de Caja */}
      {cajaLoading ? (
        <div className={`mb-4 p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-gray-800'}`}>Verificando estado de caja…</div>
      ) : !cajaOpen ? (
        <div className={`mb-4 p-4 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-slate-200 text-gray-800'}`}>
          <p className="text-sm mb-3">Caja no abierta: solo podrás ver el historial. Abrí la caja para registrar, editar o eliminar ventas. {cajaErr && (<span className="block mt-2 text-red-500">{cajaErr}</span>)}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/cajero/caja')} className={`${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} px-3 py-1 rounded`}>Ir a Caja</button>
            <button onClick={async () => { setCajaLoading(true); try { const s = await getSesionAbierta(); setCajaOpen(!!s?.open); setCajaErr(''); } catch (e) { setCajaOpen(false); setCajaErr(e?.message || 'No se pudo verificar la caja'); } finally { setCajaLoading(false); } }} className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>Reintentar</button>
          </div>
        </div>
      ) : null}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Total Ventas
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            {ventas.length}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Ingresos Totales
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            ${totalVentas.toLocaleString()}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Promedio por Venta
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            ${Math.round(totalVentas / ventas.length).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`rounded-lg border shadow-sm ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Aquí podrás gestionar las ventas registradas en el sistema.
            </p>
            <button
              onClick={agregarVenta}
              disabled={!cajaOpen}
              title={!cajaOpen ? 'Abrí la caja para registrar una venta' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !cajaOpen
                  ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed')
                  : (darkMode ? "bg-pink-600 text-white hover:bg-pink-700" : "bg-pink-500 text-white hover:bg-pink-600")
              }`}
            >
              <PlusIcon className="h-4 w-4" />
              {cajaOpen ? 'Registrar Nueva Venta' : 'Caja no abierta'}
            </button>
          </div>

          {/* Tabla de ventas */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-700"
              }`}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Empleado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Monto Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className={darkMode ? "text-gray-300" : "text-gray-900"}>
                {ventas.map((venta, index) => (
                  <tr 
                    key={venta.id} 
                    className={`border-t transition-colors ${
                      darkMode 
                        ? "border-gray-600 hover:bg-gray-700" 
                        : "border-slate-200 hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">{venta.id}</td>
                    <td className="px-4 py-3">{venta.fecha}</td>
                    <td className="px-4 py-3">{venta.empleado}</td>
                    <td className="px-4 py-3 font-semibold">${venta.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarVenta(venta.id)}
                          disabled={!cajaOpen}
                          title={!cajaOpen ? 'Abrí la caja para editar' : undefined}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            !cajaOpen
                              ? (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                              : (darkMode ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                          }`}
                        >
                          <PencilIcon className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarVenta(venta.id)}
                          disabled={!cajaOpen}
                          title={!cajaOpen ? 'Abrí la caja para eliminar' : undefined}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            !cajaOpen
                              ? (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                              : (darkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-500 text-white hover:bg-red-600")
                          }`}
                        >
                          <TrashIcon className="h-3 w-3" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensaje si no hay ventas */}
          {ventas.length === 0 && (
            <div className="text-center py-8">
              <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No hay ventas registradas aún.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}