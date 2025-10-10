import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';

const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // FUNCIÓN PARA CARGAR CATEGORÍAS (GET)
    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Usar el endpoint correcto: /api/categorias/ (no /api/productos/categorias/)
            const response = await fetch(`${API_BASE}/categorias/`, {
                method: 'GET',
                headers: getHeaders()
            });

            // Verificar si la respuesta fue exitosa
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Convertir respuesta a JSON
            const data = await response.json();
            setCategories(data.results || data); // Manejar ambos formatos de respuesta
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError(err.message || 'Error cargando categorías');
        } finally {
            setLoading(false);
        }
    }, []);

    // FUNCIÓN PARA CREAR CATEGORÍA (POST)
    const createCategory = useCallback(async (categoryData) => {
        try {
            const response = await fetch(`${API_BASE}/categorias/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const newCategory = await response.json();
            
            // Actualizar la lista local
            setCategories(prev => [...prev, newCategory]);
            
            return newCategory;
        } catch (err) {
            console.error('Error creating category:', err);
            throw err;
        }
    }, []);

    // FUNCIÓN PARA ACTUALIZAR CATEGORÍA (PUT/PATCH)
    const updateCategory = useCallback(async (id, categoryData) => {
        try {
            const response = await fetch(`${API_BASE}/categorias/${id}/`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const updatedCategory = await response.json();
            
            // Actualizar la lista local
            setCategories(prev => 
                prev.map(cat => cat.id === id ? updatedCategory : cat)
            );
            
            return updatedCategory;
        } catch (err) {
            console.error('Error updating category:', err);
            throw err;
        }
    }, []);

    // FUNCIÓN PARA ELIMINAR CATEGORÍA (DELETE)
    const deleteCategory = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE}/categorias/${id}/`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar la lista local
            setCategories(prev => prev.filter(cat => cat.id !== id));
            
            return true;
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    }, []);

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { 
        categories, 
        loading, 
        error,
        // Funciones CRUD
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory
    };
};

export default useCategories;