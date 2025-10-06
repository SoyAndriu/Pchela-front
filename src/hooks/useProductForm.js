// HOOK PERSONALIZADO PARA MANEJAR EL FORMULARIO DE PRODUCTOS

import { useState, useCallback } from 'react';
import { validateProduct } from '../utils/productUtils';

/**
 * Hook para manejar toda la lógica del formulario de productos
 * @returns {Object} Estados y funciones para manejar el formulario
 */
export const useProductForm = () => {
  // ESTADOS DEL FORMULARIO
  const [modalVisible, setModalVisible] = useState(false);
  const [productoForm, setProductoForm] = useState({ 
    id: null, 
    nombre: "", 
    precio: "", 
    cantidad: "", 
    categoria_id: "", // Usar el nuevo campo consistente con el backend y la validación
    imagen: "" 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // FUNCIÓN PARA ABRIR MODAL DE EDICIÓN
  const handleEdit = useCallback((producto) => {
    // Normalizar el producto para asegurar que categoria_id exista
    const normalized = { ...producto };
    if (!normalized.categoria_id) {
      // Intentar derivar categoria_id desde posibles formas
      if (normalized.categoria && typeof normalized.categoria === 'object') {
        normalized.categoria_id = normalized.categoria.id;
      }
    }
    setProductoForm(normalized); // Llenar formulario con datos del producto
    setSelectedFile(null); // Limpiar archivo seleccionado
    setIsEditing(true); // Marcar que estamos editando
    setErrors({}); // Limpiar errores
    setModalVisible(true); // Mostrar el modal
  }, []);

  // FUNCIÓN PARA ABRIR MODAL DE CREACIÓN
  const handleAdd = useCallback(() => {
    // Limpiar formulario para nuevo producto
    setProductoForm({ 
      id: null, 
      nombre: "", 
      precio: "", 
      cantidad: "", 
      categoria_id: "", 
      imagen: "" 
    });
    setSelectedFile(null); // Limpiar archivo seleccionado
    setIsEditing(false); // Marcar que estamos creando (no editando)
    setErrors({}); // Limpiar errores
    setModalVisible(true); // Mostrar el modal
  }, []);

  // FUNCIÓN PARA CERRAR EL MODAL
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setErrors({});
    setSelectedFile(null);
  }, []);

  // FUNCIÓN PARA VALIDAR EL FORMULARIO
  const validate = useCallback(() => {
    const newErrors = validateProduct(productoForm);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retornar true si no hay errores
  }, [productoForm]);

  // FUNCIÓN PARA ACTUALIZAR CAMPOS DEL FORMULARIO
  const updateField = useCallback((field, value) => {
    setProductoForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // FUNCIÓN PRINCIPAL PARA GUARDAR PRODUCTO
  const handleSave = useCallback(async (saveProductFn) => {
    // Primero validar que todos los campos estén bien
    if (!validate()) return false;
    
    setSaving(true); // Activar indicador de "guardando..."
    
    try {
      // Llamar a la función de guardado del hook useProducts
  // Asegurar que no enviamos campo legacy 'categoria'
  const { categoria, ...cleanForm } = productoForm; // si categoria no existe no pasa nada
  await saveProductFn(cleanForm, selectedFile, isEditing);
      
      // Si llegamos aquí, el guardado fue exitoso
      closeModal();
      return true;
    } catch (error) {
      // Si algo sale mal, mostrar alerta
      alert("Error guardando el producto");
      return false;
    } finally {
      // Siempre desactivar el indicador de "guardando..."
      setSaving(false);
    }
  }, [productoForm, selectedFile, isEditing, validate, closeModal]);

  return {
    // Estados del formulario
    modalVisible,
    productoForm,
    isEditing,
    errors,
    selectedFile,
    saving,
    
    // Funciones de control
    setModalVisible,
    setSelectedFile,
    handleEdit,
    handleAdd,
    closeModal,
    handleSave,
    updateField
  };
};