// src/hooks/useAlmacen.js
// Custom hook to encapsulate all almacen state and logic from App.js

import { useState, useRef, useEffect } from 'react';
import {
  tiposConPrioridad,
  proveedores,
  gridSize,
  pasillos,
  objetoFrontendAbackend,
  getCapasPara3D,
  buscarHueco,
  getTipoClase,
  getSalidaBorde,
  getBordesExteriores
} from '../utils/almacenHelpers';

const usuarioActual = "Admin";

export default function useAlmacen() {
  // State
  const [objetos, setObjetos] = useState([]);
  const [nuevoObjeto, setNuevoObjeto] = useState({
    identificador: '',
    tipo: '',
    proveedor: '',
    ancho: 1,
    alto: 1,
    observaciones: '',
    capa: 'auto'
  });
  const [ocupadas, setOcupadas] = useState([]);
  const [ocupadasPorCapa, setOcupadasPorCapa] = useState({ 1: [], 2: [], 3: [] });
  const [alertas, setAlertas] = useState([]);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState({ visible: false, id: null });
  const [objetoSeleccionado, setObjetoSeleccionado] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [capaSeleccionada, setCapaSeleccionada] = useState('Todos');
  const capaBtnRef = useRef(null);
  const [hora, setHora] = useState(new Date());
  const [alertasVistas, setAlertasVistas] = useState(true);
  const sonidoAlertaRef = useRef(null);
  const [vista3D, setVista3D] = useState(false);
  const [toast, setToast] = useState(null);
  const [objetoEditando, setObjetoEditando] = useState(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const clickCount = useRef(0);
  const lastClick = useRef(Date.now());
  const [frontendLogs, setFrontendLogs] = useState(() => {
    const saved = localStorage.getItem("frontendLogs");
    return saved ? JSON.parse(saved) : [];
  });

  // Effects
  useEffect(() => {
    localStorage.setItem("frontendLogs", JSON.stringify(frontendLogs));
  }, [frontendLogs]);

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        capaBtnRef.current &&
        !capaBtnRef.current.contains(event.target)
      ) {
        setMenuVisible(false);
      }
    }
    if (menuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuVisible]);

  useEffect(() => {
    fetch('http://localhost:8000/objetos')
      .then(res => res.json())
      .then(data => {
        const adaptados = data.map(obj => ({
          ...obj,
          identificador: obj.id,
          alto: obj.largo,
          ancho: obj.ancho,
          capa: obj.capa,
          posicion: { row: obj.posicion_y, col: obj.posicion_x }
        }));
        setObjetos(adaptados);
        recalcularOcupadas(adaptados);
      })
      .catch(err => console.error('Error cargando objetos:', err));
  }, []);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setSugerencias([]);
      return;
    }
    const texto = busqueda.toLowerCase();
    const sugerenciasUnicas = [
      ...new Set(
        objetos
          .flatMap(obj => [obj.identificador, obj.tipo, obj.proveedor])
          .filter(Boolean)
          .filter(val => val.toLowerCase().includes(texto))
      )
    ];
    setSugerencias(sugerenciasUnicas.slice(0, 8));
  }, [busqueda, objetos]);

  useEffect(() => {
    if (sugerencias.length > 0 && sugerencias.includes(busqueda)) {
      setSugerencias([]);
    }
  }, [busqueda, sugerencias]);

  // Logic
  function recalcularOcupadas(objetosLista) {
    let nuevasOcupadas = [];
    let nuevasOcupadasPorCapa = { 1: [], 2: [], 3: [] };
    objetosLista.forEach(obj => {
      for (let rr = 0; rr < obj.alto; rr++) {
        for (let cc = 0; cc < obj.ancho; cc++) {
          nuevasOcupadas.push({ row: obj.posicion.row + rr, col: obj.posicion.col + cc, id: obj.identificador, capa: obj.capa });
          nuevasOcupadasPorCapa[obj.capa] = [
            ...(nuevasOcupadasPorCapa[obj.capa] || []),
            { row: obj.posicion.row + rr, col: obj.posicion.col + cc, id: obj.identificador }
          ];
        }
      }
    });
    setOcupadas(nuevasOcupadas);
    setOcupadasPorCapa(nuevasOcupadasPorCapa);
  }

  function agregarAlerta(tipo, mensaje, objeto = null) {
    const id = Date.now();
    setAlertas(prev => [
      ...prev,
      { id, tipo, mensaje, objeto }
    ]);
    setAlertasVistas(false);
    if (sonidoAlertaRef.current) {
      try {
        sonidoAlertaRef.current.pause();
        sonidoAlertaRef.current.currentTime = 0;
        sonidoAlertaRef.current.play();
      } catch (e) {}
    }
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 2000);
  }

  function agregarObjeto(nuevoObjeto) {
    fetch('http://localhost:8000/objetos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objetoFrontendAbackend(nuevoObjeto))
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al agregar objeto');
        return res.json();
      })
      .then(obj => {
        const nuevo = {
          ...obj,
          identificador: obj.id,
          alto: obj.largo,
          ancho: obj.ancho,
          capa: obj.capa,
          posicion: { row: obj.posicion_y, col: obj.posicion_x }
        };
        setObjetos(prev => {
          const actualizados = [...prev, nuevo];
          recalcularOcupadas(actualizados);
          return actualizados;
        });
        agregarAlerta('success', 'Objeto insertado correctamente', nuevo);
        setNuevoObjeto({
          identificador: '',
          tipo: '',
          proveedor: '',
          ancho: 1,
          alto: 1,
          observaciones: '',
          capa: 'auto'
        });
        setFrontendLogs(logs => [
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} creó objeto\nID: ${nuevo.id ?? nuevo.identificador ?? ""}\nNombre: ${nuevo.nombre ?? ""}\nTipo: ${nuevo.tipo ?? ""}\nDatos: ${JSON.stringify(nuevo)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  function editarObjeto(objetoEditado) {
    fetch(`http://localhost:8000/objetos/${objetoEditado.identificador}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objetoFrontendAbackend(objetoEditado))
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al editar objeto');
        return res.json();
      })
      .then(obj => {
        setObjetos(prev => {
          const actualizados = prev.map(o => o.identificador === obj.id ? {
            ...obj,
            identificador: obj.id,
            alto: obj.largo,
            ancho: obj.ancho,
            capa: obj.capa,
            posicion: { row: obj.posicion_y, col: obj.posicion_x }
          } : o);
          recalcularOcupadas(actualizados);
          return actualizados;
        });
        agregarAlerta('edit', 'Objeto editado correctamente', objetoEditado);
        setMostrarModalEditar(false);
        setFrontendLogs(logs => [
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} editó objeto\nID: ${objetoEditado.id ?? objetoEditado.identificador ?? ""}\nNombre: ${objetoEditado.nombre ?? ""}\nTipo: ${objetoEditado.tipo ?? ""}\nDatos: ${JSON.stringify(objetoEditado)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  function eliminarObjeto() {
    const id = confirmEliminar.id;
    const objetoEliminado = objetos.find(o => o.identificador === id);
    fetch(`http://localhost:8000/objetos/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setObjetos(prev => {
          const actualizados = prev.filter(o => o.identificador !== id);
          recalcularOcupadas(actualizados);
          return actualizados;
        });
        setConfirmEliminar({ visible: false, id: null });
        agregarAlerta('delete', 'Objeto eliminado correctamente', objetoEliminado);
        setFrontendLogs(logs => [
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} eliminó objeto\nID: ${objetoEliminado.id ?? objetoEliminado.identificador ?? ""}\nNombre: ${objetoEliminado.nombre ?? ""}\nTipo: ${objetoEliminado.tipo ?? ""}\nDatos: ${JSON.stringify(objetoEliminado)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  // ...other handlers (toggleAlertDropdown, handleMenuOption, etc.) can be added here as needed

  return {
    // State
    objetos, setObjetos,
    nuevoObjeto, setNuevoObjeto,
    ocupadas, setOcupadas,
    ocupadasPorCapa, setOcupadasPorCapa,
    alertas, setAlertas,
    showAlertDropdown, setShowAlertDropdown,
    confirmEliminar, setConfirmEliminar,
    objetoSeleccionado, setObjetoSeleccionado,
    menuVisible, setMenuVisible,
    capaSeleccionada, setCapaSeleccionada,
    capaBtnRef,
    hora, setHora,
    alertasVistas, setAlertasVistas,
    sonidoAlertaRef,
    vista3D, setVista3D,
    toast, setToast,
    objetoEditando, setObjetoEditando,
    mostrarModalEditar, setMostrarModalEditar,
    busqueda, setBusqueda,
    sugerencias, setSugerencias,
    loading, setLoading,
    showAdmin, setShowAdmin,
    clickCount, lastClick,
    frontendLogs, setFrontendLogs,
    // Logic
    recalcularOcupadas,
    agregarAlerta,
    agregarObjeto,
    editarObjeto,
    eliminarObjeto,
    tiposConPrioridad,
    proveedores,
    gridSize,
    pasillos,
    objetoFrontendAbackend,
    getCapasPara3D,
    buscarHueco,
    getTipoClase,
    getSalidaBorde,
    getBordesExteriores
  };
}
