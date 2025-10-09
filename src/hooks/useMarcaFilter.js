import { useState } from 'react';
import useMarcasSelect from './useMarcasSelect';

export const useMarcaFilter = () => {
  const { marcas } = useMarcasSelect();
  const [marcaFilter, setMarcaFilter] = useState("");
  return { marcas, marcaFilter, setMarcaFilter };
};
