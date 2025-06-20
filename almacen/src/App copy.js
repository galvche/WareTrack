import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import logo from './logo.png';
import alertaSonido from './alerta.mp3';
import Almacen3D from './Almacen3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Loader from './Loader';
import AdminPanel from './AdminPanel';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import AdminPanelPage from "./AdminPanelPage";

const usuarioActual = "Admin";

function objetoFrontendAbackend(obj) {
  // Busca la prioridad según el tipo
  const tipoObj = tiposConPrioridad.find(t => t.tipo === obj.tipo);
  return {
    id: obj.identificador,
    tipo: obj.tipo,
    prioridad: tipoObj ? tipoObj.prioridad : "Media", // <-- Añade esto
    proveedor: obj.proveedor,
    largo: obj.alto,
    ancho: obj.ancho,
    capa: obj.capa,
    posicion_x: obj.posicion?.col ?? 0,
    posicion_y: obj.posicion?.row ?? 0,
    observaciones: obj.observaciones || ""
  };
}

function getCapasPara3D(ocupadasPorCapa) {
  return [
    { ocupadas: ocupadasPorCapa[1] || [] },
    { ocupadas: ocupadasPorCapa[2] || [] },
    { ocupadas: ocupadasPorCapa[3] || [] }
  ];
}

const tiposConPrioridad = [
  { tipo: 'Palets', prioridad: 'Alta' },
  { tipo: 'Cajas', prioridad: 'Media' },
  { tipo: 'Contenedores', prioridad: 'Alta' },
  { tipo: 'Equipos', prioridad: 'Baja' }
];

const proveedores = ['GALVATEC', 'INDUSTRIALTECH', 'LOGISERVE', 'PROQUIMIA'];

const gridSize = { columns: 28, rows: 18 };

const pasillos = [
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 4 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 9 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 14 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 19 })),
  ...Array.from({ length: gridSize.columns }, (_, c) => ({ row: 5, col: c })),
  ...Array.from({ length: gridSize.columns }, (_, c) => ({ row: 11, col: c }))
];

function App() {
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

  // Guardar logs en localStorage cada vez que cambian
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

  // Recalcula ocupadas y ocupadasPorCapa
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
function handleEditarObjeto(e) {
  e.preventDefault();
  const form = e.target;
  const datosEditados = {
    ...objetoEditando,
    tipo: form.tipo.value,
    proveedor: form.proveedor.value,
    alto: Number(form.largo.value),
    ancho: Number(form.ancho.value),
    capa: Number(form.capa.value),
    observaciones: form.observaciones.value,
    // El identificador es solo lectura, así que no lo cambiamos
  };

  // Validación: comprobar que no pisa pasillos ni otros objetos
  let hayPasillo = false;
  let haySolape = false;
  for (let rr = 0; rr < datosEditados.alto; rr++) {
    for (let cc = 0; cc < datosEditados.ancho; cc++) {
      const row = datosEditados.posicion.row + rr;
      const col = datosEditados.posicion.col + cc;
      if (pasillos.some(p => p.row === row && p.col === col)) {
        hayPasillo = true;
      }
      // Comprobar solape con otros objetos en la misma capa (excepto consigo mismo)
      if (
        ocupadasPorCapa[datosEditados.capa]
          .some(o =>
            o.row === row &&
            o.col === col &&
            o.id !== datosEditados.identificador
          )
      ) {
        haySolape = true;
      }
    }
  }
  if (hayPasillo) {
    agregarAlerta('error', 'No puedes colocar el objeto sobre un pasillo');
    return;
  }
  if (haySolape) {
    agregarAlerta('error', 'No puedes solapar con otro objeto');
    return;
  }

  editarObjeto(datosEditados);
}
  // Cargar objetos desde el backend al iniciar
  useEffect(() => {
    fetch('http://localhost:8000/objetos')
      .then(res => res.json())
      .then(data => {
        const adaptados = data.map(obj => ({
          ...obj,
          identificador: obj.id,
          alto: obj.largo,
          ancho: obj.ancho,
          capa: obj.capa, // <-- BIEN
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
    setSugerencias(sugerenciasUnicas.slice(0, 8)); // máximo 8 sugerencias
  }, [busqueda, objetos]);

  useEffect(() => {
    if (sugerencias.length > 0 && sugerencias.includes(busqueda)) {
      setSugerencias([]);
    }
  }, [busqueda, sugerencias]);

  function mostrarPopup(mensaje, tipo) {
    const popup = document.createElement('div');
    popup.className = `popup ${tipo}`;
    popup.textContent = mensaje;
    document.body.appendChild(popup);
    setTimeout(() => {
      popup.classList.add('visible');
    }, 100);
    setTimeout(() => {
      popup.classList.remove('visible');
      setTimeout(() => document.body.removeChild(popup), 300);
    }, 4000);
  }

  function agregarAlerta(tipo, mensaje, objeto = null) {
    const id = Date.now();
    setAlertas(prev => [
      ...prev,
      { id, tipo, mensaje, objeto }
    ]);
    setAlertasVistas(false);

    // Reproduce el sonido de alerta para cualquier tipo excepto 'success'
    if (sonidoAlertaRef.current) {
      try {
        sonidoAlertaRef.current.pause();
        sonidoAlertaRef.current.currentTime = 0;
        sonidoAlertaRef.current.play();
      } catch (e) {
        // Puede fallar si el usuario no ha interactuado aún con la página
      }
    }

    // Toast flotante solo con el mensaje corto
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
          capa: obj.capa, // <-- BIEN
          posicion: { row: obj.posicion_y, col: obj.posicion_x }
        };
        setObjetos(prev => {
          const actualizados = [...prev, nuevo];
          recalcularOcupadas(actualizados);
          return actualizados;
        });
        agregarAlerta('success', 'Objeto insertado correctamente', nuevo);
        // Limpiar formulario tras insertar
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
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} creó objeto
ID: ${nuevo.id ?? nuevo.identificador ?? ""}
Nombre: ${nuevo.nombre ?? ""}
Tipo: ${nuevo.tipo ?? ""}
Datos: ${JSON.stringify(nuevo)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  function editarObjeto(objetoEditado) {
    console.log("EDITANDO:", objetoEditado); // <-- Esto debe mostrar el identificador real
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
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} editó objeto
ID: ${objetoEditado.id ?? objetoEditado.identificador ?? ""}
Nombre: ${objetoEditado.nombre ?? ""}
Tipo: ${objetoEditado.tipo ?? ""}
Datos: ${JSON.stringify(objetoEditado)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  function pedirConfirmEliminar(id) {
    setConfirmEliminar({ visible: true, id });
  }

  function eliminarObjeto() {
    const id = confirmEliminar.id;
    // Busca el objeto antes de eliminarlo
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
        agregarAlerta('delete', 'Objeto eliminado correctamente', objetoEliminado); // <-- Aquí pasas el objeto completo
        setFrontendLogs(logs => [
          `${new Date().toISOString().replace('T', ' ').substring(0, 19)} INFO: Usuario ${usuarioActual} eliminó objeto
ID: ${objetoEliminado.id ?? objetoEliminado.identificador ?? ""}
Nombre: ${objetoEliminado.nombre ?? ""}
Tipo: ${objetoEliminado.tipo ?? ""}
Datos: ${JSON.stringify(objetoEliminado)}`,
          ...logs,
        ]);
      })
      .catch(err => agregarAlerta('error', err.message));
  }

  function toggleAlertDropdown() {
    setShowAlertDropdown(!showAlertDropdown);
    if (!showAlertDropdown) {
      setAlertasVistas(true);
    }
  }

  function handleMenuOption(option) {
    let texto = '';
    switch (option) {
      case 'todos': texto = 'Todas'; break;
      case 'capa1': texto = 'Capa 1'; break;
      case 'capa2': texto = 'Capa 2'; break;
      case 'capa3': texto = 'Capa 3'; break;
      default: texto = 'Todas';
    }
    setCapaSeleccionada(texto);
    setMenuVisible(false);
  }

  function getTipoClase(id) {
    const obj = objetos.find(o => o.identificador === id);
    if (!obj) return '';
    switch (obj.tipo) {
      case 'Palets': return 'tipo-palets';
      case 'Cajas': return 'tipo-cajas';
      case 'Contenedores': return 'tipo-contenedores';
      case 'Equipos': return 'tipo-equipos';
      default: return '';
    }
  }

  function isSalida(r, c) {
    return (
      (pasillos.some(p => p.row === r && p.col === c)) &&
      (r === 0 || r === gridSize.rows - 1 || c === 0 || c === gridSize.columns - 1)
    );
  }

  function getSalidaBorde(r, c) {
    if (pasillos.some(p => p.row === r && p.col === c)) {
      if (r === 0) return 'top';
      if (r === gridSize.rows - 1) return 'bottom';
      if (c === 0) return 'left';
      if (c === gridSize.columns - 1) return 'right';
    }
    return null;
  }

  function isBordeExteriorCelda(obj, r, c) {
    if (!obj) return false;
    const { posicion, alto, ancho } = obj;
    if (
      r === posicion.row ||
      r === posicion.row + alto - 1 ||
      c === posicion.col ||
      c === posicion.col + ancho - 1
    ) {
      return (
        r >= posicion.row &&
        r < posicion.row + alto &&
        c >= posicion.col &&
        c < posicion.col + ancho
      );
    }
    return false;
  }

  function getBordesExteriores(obj, r, c) {
    if (!obj) return {};
    const { posicion, alto, ancho } = obj;
    if (
      r < posicion.row ||
      r >= posicion.row + alto ||
      c < posicion.col ||
      c >= posicion.col + ancho
    ) return {};
    return {
      top:    r === posicion.row || r > posicion.row && (r - 1 < posicion.row),
      bottom: r === posicion.row + alto - 1 || r < posicion.row + alto - 1 && (r + 1 >= posicion.row + alto),
      left:   c === posicion.col || c > posicion.col && (c - 1 < posicion.col),
      right:  c === posicion.col + ancho - 1 || c < posicion.col + ancho - 1 && (c + 1 >= posicion.col + ancho)
    };
  }

  function buscarHueco(nuevoObjeto, ocupadasCapa, pasillos) {
    for (let r = 0; r <= gridSize.rows - nuevoObjeto.alto; r++) {
      for (let c = 0; c <= gridSize.columns - nuevoObjeto.ancho; c++) {
        let espacioLibre = true;
        for (let rr = 0; rr < nuevoObjeto.alto; rr++) {
          for (let cc = 0; cc < nuevoObjeto.ancho; cc++) {
            const row = r + rr;
            const col = c + cc;
            const esPasillo = pasillos.some(p => p.row === row && p.col === col);
            const ocupado = ocupadasCapa.find(o => o.row === row && o.col === col);
            if (ocupado || esPasillo) {
              espacioLibre = false;
              break;
            }
          }
          if (!espacioLibre) break;
        }
        if (espacioLibre) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  const capaNum = capaSeleccionada === 'Todas'
    ? null
    : Number(capaSeleccionada.replace('Capa ', ''));

  const objetosFiltrados = objetos
    .filter(obj => (capaNum ? obj.capa === capaNum : true))
    .filter(obj =>
      obj.identificador.toLowerCase().includes(busqueda.toLowerCase()) ||
      obj.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
      obj.proveedor.toLowerCase().includes(busqueda.toLowerCase())
    );

  const ocupadasFiltradas = capaNum
    ? (ocupadasPorCapa[capaNum] || [])
    : [
        ...ocupadasPorCapa[1].map(o => ({ ...o, capa: 1 })),
        ...ocupadasPorCapa[2].map(o => ({ ...o, capa: 2 })),
        ...ocupadasPorCapa[3].map(o => ({ ...o, capa: 3 }))
      ];

  let ocupadasParaGrid = [];
  if (capaSeleccionada === 'Todas') {
    ocupadasParaGrid = [
      ...ocupadasPorCapa[1].map(o => ({ ...o, capa: 1 })),
      ...ocupadasPorCapa[2].map(o => ({ ...o, capa: 2 })),
      ...ocupadasPorCapa[3].map(o => ({ ...o, capa: 3 }))
    ];
  } else {
    ocupadasParaGrid = ocupadasFiltradas;
  }

  const capaIndicador = objetoSeleccionado
    ? `Capa ${objetoSeleccionado.capa}`
    : capaSeleccionada;

  const salidas = pasillos.filter(
    p =>
      p.row === 0 ||
      p.row === gridSize.rows - 1 ||
      p.col === 0 ||
      p.col === gridSize.columns - 1
  );

  const navigate = useNavigate();

  function handleIconClick() {
    const now = Date.now();
    if (now - lastClick.current > 2000) clickCount.current = 0; // reinicia si pasa mucho tiempo
    clickCount.current += 1;
    lastClick.current = now;
    if (clickCount.current >= 5) {
      navigate("/admin");
      clickCount.current = 0;
    }
  }

  return (
    <>
      {loading && <Loader onFinish={() => setLoading(false)} />}
      {!loading && (
        <div className="App">
          <audio ref={sonidoAlertaRef} src="/alerta.mp3" preload="auto" />
          <div className="topbar">
            <div className="topbar-left">
              <img src={logo} alt="Logo" className="logo" onClick={handleIconClick} />
              <span className="hora">{hora.toLocaleTimeString()}</span>
            </div>
            <div className="topbar-center">
              <div className="busqueda-wrapper">
                <input
                  className={`busqueda-objetos${sugerencias.length > 0 ? ' abierto' : ''}`}
                  type="text"
                  placeholder="Buscar por referencia, tipo o proveedor..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  autoComplete="off"
                />
                <span className="icono-lupa">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="#0a2a5c" strokeWidth="2"/>
                    <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#0a2a5c" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                {sugerencias.length > 0 && (
                  <ul className="sugerencias-lista">
                    {sugerencias.map((s, i) => (
                      <li
                        key={i}
                        onMouseDown={() => {
                          setBusqueda(s);
                          setSugerencias([]);
                        }}
                        className="sugerencia-item"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="topbar-right">
              <div style={{ position: "relative" }} ref={capaBtnRef}>
                <button
                  className="capa-btn"
                  onClick={() => setMenuVisible(v => !v)}
                  aria-label="Mostrar opciones de capa"
                  style={{ marginRight: '10px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="5" width="14" height="2" rx="1" fill="#fff"/>
                    <rect x="3" y="9" width="14" height="2" rx="1" fill="#fff"/>
                    <rect x="3" y="13" width="14" height="2" rx="1" fill="#fff"/>
                  </svg>
                </button>
                {menuVisible && (
                  <div className="capa-menu">
                    <div className="capa-menu-item" onClick={() => handleMenuOption('todos')}>Todos</div>
                    <div className="capa-menu-item" onClick={() => handleMenuOption('capa1')}>Capa 1</div>
                    <div className="capa-menu-item" onClick={() => handleMenuOption('capa2')}>Capa 2</div>
                    <div className="capa-menu-item" onClick={() => handleMenuOption('capa3')}>Capa 3</div>
                  </div>
                )}
              </div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg className="bell" viewBox="0 0 24 24" onClick={toggleAlertDropdown} style={{ cursor: 'pointer' }}>
                  <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-5-5.91V5a1 1 0 1 0-2 0v.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" />
                </svg>
                {!alertasVistas && alertas.length > 0 && (
                  <span className="badge">{alertas.length}</span>
                )}
              </div>
              <div className={`dropdown ${showAlertDropdown ? 'show' : ''}`}>
                <div className="alertas-dropdown-header">
                  <button
                    className="alertas-clear-btn"
                    onClick={() => setAlertas([])}
                    disabled={alertas.length === 0}
                    title="Limpiar historial"
                  >
                    &#10006;
                  </button>
                </div>
                {alertas.length === 0 ? (
                  <div className="alertas-vacio">No hay alertas</div>
                ) : (
                  <ul className="alertas-lista">
                    {alertas.map(a => {
                      let label = 'Insertado', labelClass = 'alerta-label-insertado';
                      if (a.tipo === 'error' || a.tipo === 'delete') { label = 'Eliminado'; labelClass = 'alerta-label-eliminado'; }
                      if (a.tipo === 'edit' || a.tipo === 'warning') { label = 'Editado'; labelClass = 'alerta-label-editado'; }
                      return (
                        <li key={a.id} className="alertas-item">
                          <span className={`alerta-label ${labelClass}`}>{label}</span>
                          {a.objeto && (
                            <div className="alerta-detalles">
                              <b>ID:</b> {a.objeto.identificador || a.objeto.id}<br />
                              <b>Tipo:</b> {a.objeto.tipo}<br />
                              <b>Proveedor:</b> {a.objeto.proveedor}<br />
                              <b>Largo:</b> {a.objeto.alto || a.objeto.largo} &nbsp; <b>Ancho:</b> {a.objeto.ancho}<br />
                              <b>Posición:</b> {a.objeto.posicion ? `${a.objeto.posicion.col + 1},${a.objeto.posicion.row + 1}` : (a.objeto.posicion_x !== undefined ? `${a.objeto.posicion_x + 1},${a.objeto.posicion_y + 1}` : '')}<br />
                              <b>Capa:</b> {a.objeto.capa}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <h2>Insertar Objeto</h2>
            <form onSubmit={e => {
              e.preventDefault();
              let objetoAInsertar = { ...nuevoObjeto };
              // Determina la capa
              let capaFinal = 1;
              if (objetoAInsertar.capa && objetoAInsertar.capa !== 'auto') {
                capaFinal = Number(objetoAInsertar.capa);
              }
              objetoAInsertar.capa = capaFinal;
              if (!objetoAInsertar.posicion) {
                const hueco = buscarHueco(objetoAInsertar, ocupadasPorCapa[capaFinal], pasillos);
                if (!hueco) {
                  agregarAlerta('error', 'No hay espacio disponible');
                  return;
                }
                objetoAInsertar.posicion = hueco;
              }
              agregarObjeto(objetoAInsertar);
            }}>
              <input
                type="text"
                placeholder="Identificador"
                value={nuevoObjeto.identificador}
                onChange={e => setNuevoObjeto({ ...nuevoObjeto, identificador: e.target.value })}
              />
              <select
                value={nuevoObjeto.tipo}
                onChange={e => setNuevoObjeto({ ...nuevoObjeto, tipo: e.target.value })}
              >
                <option value="">Tipo</option>
                {tiposConPrioridad.map(t => (
                  <option key={t.tipo} value={t.tipo}>{t.tipo} (Prioridad: {t.prioridad})</option>
                ))}
              </select>
              <select
                value={nuevoObjeto.proveedor}
                onChange={e => setNuevoObjeto({ ...nuevoObjeto, proveedor: e.target.value })}
              >
                <option value="">Proveedor</option>
                {proveedores.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Observaciones"
                value={nuevoObjeto.observaciones}
                onChange={e => setNuevoObjeto({ ...nuevoObjeto, observaciones: e.target.value })}
              />
              <div className="medidas">
                <div className="medidas-row">
                  <label className="medida-label">
                    Largo:
                    <input
                      type="number"
                      min="1"
                      max={gridSize.rows}
                      placeholder="Largo"
                      value={nuevoObjeto.alto}
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val >= 1 && val <= gridSize.rows) setNuevoObjeto({ ...nuevoObjeto, alto: val });
                      }}
                    />
                    <span className="unidad">m</span>
                  </label>
                  <label className="medida-label">
                    Ancho:
                    <input
                      type="number"
                      min="1"
                      max={gridSize.columns}
                      placeholder="Ancho"
                      value={nuevoObjeto.ancho}
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val >= 1 && val <= gridSize.columns) setNuevoObjeto({ ...nuevoObjeto, ancho: val });
                      }}
                    />
                    <span className="unidad">m</span>
                  </label>
                </div>
                <div className="medidas-max">
                  <em>
                    Máximo: {gridSize.rows} m de largo, {gridSize.columns} m de ancho
                  </em>
                </div>
              </div>
              <select
                value={nuevoObjeto.capa}
                onChange={e => setNuevoObjeto({ ...nuevoObjeto, capa: e.target.value })}
              >
                <option value="auto">Automático</option>
                <option value={1}>Capa 1</option>
                <option value={2}>Capa 2</option>
                <option value={3}>Capa 3</option>
              </select>
              <button className="button" type="submit">Insertar</button>
            </form>

            <div className="object-list">
              <h3 style={{ color: "#00205b" }}>Objetos en almacén</h3>
              <ul>
                {objetosFiltrados.map(obj => (
                  <li
                    key={obj.identificador}
                    className={`obj-list-item${objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? ' selected-obj' : ''}`}
                    onClick={() => setObjetoSeleccionado(objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? null : obj)}
                    onDoubleClick={() => {
                      setObjetoEditando(obj);
                      setMostrarModalEditar(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="obj-identificador"><b>{obj.identificador}</b></div>
                    <div className="obj-info">
                      Tipo: {obj.tipo} (Prioridad: {tiposConPrioridad.find(t => t.tipo === obj.tipo)?.prioridad || 'N/A'})<br />
                      Proveedor: {obj.proveedor}<br />
                      Observaciones: {obj.observaciones || '-'}<br />
                      Largo: {obj.alto} &nbsp; Ancho: {obj.ancho}<br />
                      Posición: {obj.posicion.col + 1},{obj.posicion.row + 1}
                    </div>
                    <div className="obj-actions">
                      <button
                        className="button sacar-btn"
                        onClick={() => pedirConfirmEliminar(obj.identificador)}
                      >Sacar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid-container" style={{ position: 'relative' }}>
            <div className="seleccion-indicador">
              Capa actual: <b>{capaIndicador}</b>
              <br />
              {objetoSeleccionado
                ? <>Seleccionado: <b>{objetoSeleccionado.identificador}</b> ({objetoSeleccionado.tipo})</>
                : <>Ningún objeto seleccionado</>
              }
            </div>
            <div className="grid">
              {Array(gridSize.rows).fill(null).flatMap((_, r) =>
                Array(gridSize.columns).fill(null).map((_, c) => {
                  const ocupado = ocupadasFiltradas.find(o => o.row === r && o.col === c);
                  const isPasillo = pasillos.some(p => p.row === r && p.col === c);
                  const salidaBorde = getSalidaBorde(r, c);

                  let bordeClases = '';
                  if (objetoSeleccionado && ocupado && ocupado.id === objetoSeleccionado.identificador) {
                    const bordes = getBordesExteriores(objetoSeleccionado, r, c);
                    if (bordes.top) bordeClases += ' selected-obj-border-top';
                    if (bordes.bottom) bordeClases += ' selected-obj-border-bottom';
                    if (bordes.left) bordeClases += ' selected-obj-border-left';
                    if (bordes.right) bordeClases += ' selected-obj-border-right';
                  }

                  const ocupadosEnCelda = ocupadasParaGrid.filter(o => o.row === r && o.col === c);
                  const capaCelda = ocupadosEnCelda.length ? ocupadosEnCelda[0].capa : null;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={
                        `grid-item
                        ${ocupado ? 'occupied' : ''}
                        ${ocupado ? getTipoClase(ocupado.id) : ''}
                        ${isPasillo ? 'pasillo' : ''}
                        ${salidaBorde ? `salida-${salidaBorde}` : ''}
                        ${bordeClases}
                        ${capaCelda ? `capa-${capaCelda}` : ''}
                        `
                      }
                      title={
                        salidaBorde
                          ? 'Salida'
                          : isPasillo
                          ? 'Pasillo'
                          : ocupado
                          ? `Ocupado por ID: ${ocupado.id}`
                          : ''
                      }
                      onClick={() => {
                        if (ocupado) {
                          const obj = objetos.find(o => o.identificador === ocupado.id);
                          if (obj) {
                            setObjetoSeleccionado(objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? null : obj);
                          } else {
                            setObjetoSeleccionado(null);
                          }
                        } else {
                          setObjetoSeleccionado(null);
                        }
                      }}
                    >
                    </div>
                  );
                })
              )}
            </div>

            {!vista3D && (
              <button
                className="btn-vista-3d"
                onClick={() => setVista3D(true)}
              >
                3D
              </button>
            )}
          </div>

          {confirmEliminar.visible && (
            <div className="confirm-overlay">
              <div className="confirm-box">
                <p>¿Está seguro que desea sacar este objeto, señor Stark?</p>
                <button onClick={eliminarObjeto} className="button danger">Sí, sacar</button>
                <button onClick={() => setConfirmEliminar({ visible: false, id: null })} className="button">Cancelar</button>
              </div>
            </div>
          )}

          {/* Solo deja este bloque para el toast */}
          {toast && (
            <div className={`alerta-global alerta-${toast.tipo}`} style={{
              position: 'fixed',
              top: 70,
              right: 20,
              zIndex: 9999,
              minWidth: 220,
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0,32,91,0.08)',
              background: '#fff',
              color: '#00205b',
              borderLeft: `6px solid ${toast.tipo === 'success' ? '#388e3c' : toast.tipo === 'error' ? '#b71c1c' : '#1976d2'}`
            }}>
              {toast.mensaje}
            </div>
          )}

          {vista3D && (
            <Almacen3D
              capas={getCapasPara3D(ocupadasPorCapa)}
              gridSize={gridSize}
              pasillos={pasillos}
              salidas={salidas}
              capaSeleccionada={capaSeleccionada}
              objetos={objetosFiltrados}  
              onClose={() => setVista3D(false)}
            />
          )}

          <footer className="footer-demo">
            Demo Técnica desarrollada por AKKODIS SPAIN
          </footer>

          {mostrarModalEditar && objetoEditando && (
            <div className="modal-editar-objeto">
              <div className="modal-contenido edit-modal">
                <h2>Editar Objeto</h2>
                <form onSubmit={handleEditarObjeto}>
                  <label>
                    Identificador:
                    <input
                      name="identificador"
                      defaultValue={objetoEditando.identificador}
                      required
                      readOnly
                      style={{ background: "#f0f2f7", color: "#888" }}
                    />
                  </label>
                  <label>
                    Tipo:
                    <select name="tipo" defaultValue={objetoEditando.tipo} required>
                      <option value="">Selecciona tipo</option>
                      <option value="Cajas">Cajas</option>
                      <option value="Palets">Palets</option>
                      <option value="Contenedores">Contenedores</option>
                      <option value="Equipos">Equipos</option>
                    </select>
                  </label>
                  <label>
                    Proveedor:
                    <select name="proveedor" defaultValue={objetoEditando.proveedor} required>
                      <option value="">Selecciona proveedor</option>
                      <option value="INDUSTRIALTECH">INDUSTRIALTECH</option>
                      <option value="GALVATEC">GALVATEC</option>
                      <option value="LOGISERVE">LOGISERVE</option>
                      <option value="PROQUIMIA">PROQUIMIA</option>
                    </select>
                  </label>
                  <label>
                    Observaciones:
                    <input
                      name="observaciones"
                      defaultValue={objetoEditando.observaciones || ""}
                      placeholder="Observaciones"
                    />
                  </label>
                  <div className="medidas-row">
                    <div className="medida-label">
                      <span>Largo:</span>
                      <input
                        name="largo"
                        type="number"
                        min="1"
                        max={gridSize.rows}
                        defaultValue={objetoEditando.alto}
                        required
                      />
                      <span className="unidad">m</span>
                    </div>
                    <div className="medida-label">
                      <span>Ancho:</span>
                      <input
                        name="ancho"
                        type="number"
                        min="1"
                        max={gridSize.columns}
                        defaultValue={objetoEditando.ancho}
                        required
                      />
                      <span className="unidad">m</span>
                    </div>
                  </div>
                  <label>
                    Capa:
                    <select name="capa" defaultValue={objetoEditando.capa}>
                      <option value={1}>Capa 1</option>
                      <option value={2}>Capa 2</option>
                      <option value={3}>Capa 3</option>
                    </select>
                  </label>
                  <div className="edit-actions">
                    <button type="submit">Guardar</button>
                    <button type="button" className="cancel" onClick={() => setMostrarModalEditar(false)}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Y exporta así:
export default function AppWithRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPanelPage />} />
      </Routes>
    </Router>
  );
}