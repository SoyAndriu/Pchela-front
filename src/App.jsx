import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./auth/Login";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública del login */}
          <Route path="/login" element={<Login />} />

          {/* ⚠️ Más adelante acá agregamos las rutas:
              /dueno/*
              /empleado/*
              /cajero/*
          */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

