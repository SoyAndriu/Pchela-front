import React from "react";

export default function ConfiguracionGeneral({ darkMode }) {
	return (
		<div className="max-w-2xl mx-auto space-y-8">
			<h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>General</h2>
			<div className={darkMode ? "text-gray-300" : "text-slate-700"}>
				Aquí podrás configurar los ajustes generales de la aplicación.
			</div>
		</div>
	);
}