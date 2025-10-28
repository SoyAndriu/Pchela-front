import React, { createContext, useContext, useState } from "react";
import AlertModal from "./AlertModal";

const AlertContext = createContext();

export function AlertProvider({ children, darkMode = false }) {
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    resolve: null,
    showCancel: true,
  });

  // Función base que se usa internamente
  const show = (message, options = {}) => {
    return new Promise((resolve) => {
      setModal({
        visible: true,
        title: options.title || "Mensaje",
        message,
        confirmText: options.confirmText || "Aceptar",
        cancelText: options.cancelText || "Cancelar",
        showCancel: options.cancelText !== "", // si cancelText es vacío, ocultamos
        resolve,
      });
    });
  };

  const confirm = (message, options = {}) => {
    return show(message, { ...options, cancelText: options.cancelText ?? "Cancelar" });
  };

  const info = (message, options = {}) => {
    return show(message, {
      title: options.title || "Información",
      confirmText: options.confirmText || "Ok",
      cancelText: "", // Oculta botón cancelar
    });
  };

  const success = (message, options = {}) => {
    return show(message, {
      title: options.title || "Éxito",
      confirmText: options.confirmText || "Ok",
      cancelText: "",
    });
  };

  const error = (message, options = {}) => {
    return show(message, {
      title: options.title || "Error",
      confirmText: options.confirmText || "Ok",
      cancelText: "",
    });
  };

  const handleConfirm = () => {
    modal.resolve(true);
    setModal((m) => ({ ...m, visible: false }));
  };

  const handleCancel = () => {
    modal.resolve(false);
    setModal((m) => ({ ...m, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ confirm, info, success, error }}>
      {children}
      <AlertModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        darkMode={darkMode}
        showCancel={modal.showCancel}
      />
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
