import React from 'react';
import '../styles/App.css';
import Almacen3D from './Almacen3D';
import Loader from './Loader';
import AdminPanelPage from '../pages/AdminPanelPage';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import useAlmacen from '../hooks/useAlmacen';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Grid from './Grid';
import EditModal from './EditModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from './Toast';
import logo from '../assets/img/logo.png';

/**
 * App - Componente principal de la aplicación. Gestiona rutas, layout y estado global.
 *
 * @returns {JSX.Element}
 *
 * @example
 * <App />
 */
function App() {
  const almacen = useAlmacen();
  const navigate = useNavigate();

  // Derivados para Grid y Sidebar
  const capaNum = almacen.capaSeleccionada === 'Todas'
    ? null
    : Number(almacen.capaSeleccionada.replace('Capa ', ''));

  const objetosFiltrados = almacen.objetos
    .filter(obj => (capaNum ? obj.capa === capaNum : true))
    .filter(obj =>
      obj.identificador.toLowerCase().includes(almacen.busqueda.toLowerCase()) ||
      obj.tipo.toLowerCase().includes(almacen.busqueda.toLowerCase()) ||
      obj.proveedor.toLowerCase().includes(almacen.busqueda.toLowerCase())
    );

  const ocupadasFiltradas = capaNum
    ? (almacen.ocupadasPorCapa[capaNum] || [])
    : [
        ...almacen.ocupadasPorCapa[1].map(o => ({ ...o, capa: 1 })),
        ...almacen.ocupadasPorCapa[2].map(o => ({ ...o, capa: 2 })),
        ...almacen.ocupadasPorCapa[3].map(o => ({ ...o, capa: 3 }))
      ];

  let ocupadasParaGrid = [];
  if (almacen.capaSeleccionada === 'Todas') {
    ocupadasParaGrid = [
      ...almacen.ocupadasPorCapa[1].map(o => ({ ...o, capa: 1 })),
      ...almacen.ocupadasPorCapa[2].map(o => ({ ...o, capa: 2 })),
      ...almacen.ocupadasPorCapa[3].map(o => ({ ...o, capa: 3 }))
    ];
  } else {
    ocupadasParaGrid = ocupadasFiltradas;
  }

  const capaIndicador = almacen.objetoSeleccionado
    ? `Capa ${almacen.objetoSeleccionado.capa}`
    : almacen.capaSeleccionada;

  // Handlers específicos
  function handleIconClick() {
    const now = Date.now();
    if (now - almacen.lastClick.current > 2000) almacen.clickCount.current = 0;
    almacen.clickCount.current += 1;
    almacen.lastClick.current = now;
    if (almacen.clickCount.current >= 5) {
      navigate("/admin");
      almacen.clickCount.current = 0;
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
    almacen.setCapaSeleccionada(texto);
    almacen.setMenuVisible(false);
  }

  function toggleAlertDropdown() {
    almacen.setShowAlertDropdown(!almacen.showAlertDropdown);
    if (!almacen.showAlertDropdown) {
      almacen.setAlertasVistas(true);
    }
  }

  function pedirConfirmEliminar(id) {
    almacen.setConfirmEliminar({ visible: true, id });
  }

  return (
    <>
      {almacen.loading && <Loader onFinish={() => almacen.setLoading(false)} />}
      {!almacen.loading && (
        <div className="App">
          <Topbar
            logo={logo}
            hora={almacen.hora}
            handleIconClick={handleIconClick}
            busqueda={almacen.busqueda}
            setBusqueda={almacen.setBusqueda}
            sugerencias={almacen.sugerencias}
            setSugerencias={almacen.setSugerencias}
            capaBtnRef={almacen.capaBtnRef}
            menuVisible={almacen.menuVisible}
            setMenuVisible={almacen.setMenuVisible}
            handleMenuOption={handleMenuOption}
            showAlertDropdown={almacen.showAlertDropdown}
            toggleAlertDropdown={toggleAlertDropdown}
            alertasVistas={almacen.alertasVistas}
            alertas={almacen.alertas}
            setAlertas={almacen.setAlertas}
          />
          <Sidebar
            nuevoObjeto={almacen.nuevoObjeto}
            setNuevoObjeto={almacen.setNuevoObjeto}
            tiposConPrioridad={almacen.tiposConPrioridad}
            proveedores={almacen.proveedores}
            gridSize={almacen.gridSize}
            buscarHueco={almacen.buscarHueco}
            ocupadasPorCapa={almacen.ocupadasPorCapa}
            pasillos={almacen.pasillos}
            agregarAlerta={almacen.agregarAlerta}
            agregarObjeto={almacen.agregarObjeto}
            objetosFiltrados={objetosFiltrados}
            objetoSeleccionado={almacen.objetoSeleccionado}
            setObjetoSeleccionado={almacen.setObjetoSeleccionado}
            setObjetoEditando={almacen.setObjetoEditando}
            setMostrarModalEditar={almacen.setMostrarModalEditar}
            pedirConfirmEliminar={pedirConfirmEliminar}
          />
          <Grid
            gridSize={almacen.gridSize}
            ocupadasFiltradas={ocupadasFiltradas}
            pasillos={almacen.pasillos}
            getSalidaBorde={almacen.getSalidaBorde}
            ocupadasParaGrid={ocupadasParaGrid}
            objetoSeleccionado={almacen.objetoSeleccionado}
            getBordesExteriores={almacen.getBordesExteriores}
            getTipoClase={almacen.getTipoClase}
            objetos={almacen.objetos}
            setObjetoSeleccionado={almacen.setObjetoSeleccionado}
            capaIndicador={capaIndicador}
            vista3D={almacen.vista3D}
            setVista3D={almacen.setVista3D}
          />
          <ConfirmDeleteModal
            confirmEliminar={almacen.confirmEliminar}
            eliminarObjeto={almacen.eliminarObjeto}
            setConfirmEliminar={almacen.setConfirmEliminar}
          />
          <EditModal
            mostrarModalEditar={almacen.mostrarModalEditar}
            objetoEditando={almacen.objetoEditando}
            gridSize={almacen.gridSize}
            tiposConPrioridad={almacen.tiposConPrioridad}
            proveedores={almacen.proveedores}
            handleEditarObjeto={e => {
              e.preventDefault();
              const form = e.target;
              const datosEditados = {
                ...almacen.objetoEditando,
                tipo: form.tipo.value,
                proveedor: form.proveedor.value,
                alto: Number(form.largo.value),
                ancho: Number(form.ancho.value),
                capa: Number(form.capa.value),
                observaciones: form.observaciones.value,
              };
              // Validación: comprobar que no pisa pasillos ni otros objetos
              let hayPasillo = false;
              let haySolape = false;
              for (let rr = 0; rr < datosEditados.alto; rr++) {
                for (let cc = 0; cc < datosEditados.ancho; cc++) {
                  const row = datosEditados.posicion.row + rr;
                  const col = datosEditados.posicion.col + cc;
                  if (almacen.pasillos.some(p => p.row === row && p.col === col)) {
                    hayPasillo = true;
                  }
                  if (
                    almacen.ocupadasPorCapa[datosEditados.capa]
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
                almacen.agregarAlerta('error', 'No puedes colocar el objeto sobre un pasillo');
                return;
              }
              if (haySolape) {
                almacen.agregarAlerta('error', 'No puedes solapar con otro objeto');
                return;
              }
              almacen.editarObjeto(datosEditados);
            }}
            setMostrarModalEditar={almacen.setMostrarModalEditar}
          />
          <Toast toast={almacen.toast} />
          {almacen.vista3D && (
            <Almacen3D
              capas={almacen.getCapasPara3D(almacen.ocupadasPorCapa)}
              gridSize={almacen.gridSize}
              pasillos={almacen.pasillos}
              salidas={almacen.pasillos.filter(
                p =>
                  p.row === 0 ||
                  p.row === almacen.gridSize.rows - 1 ||
                  p.col === 0 ||
                  p.col === almacen.gridSize.columns - 1
              )}
              capaSeleccionada={almacen.capaSeleccionada}
              objetos={objetosFiltrados}
              onClose={() => almacen.setVista3D(false)}
            />
          )}
          <footer className="footer-demo">
            Demo Técnica desarrollada por AKKODIS SPAIN
          </footer>
          {/* Audio de alerta para notificaciones sonoras */}
          <audio
            ref={almacen.sonidoAlertaRef}
            src={require('../assets/audio/alerta.mp3')}
            preload="auto"
            style={{ display: 'none' }}
          />
        </div>
      )}
    </>
  );
}

// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
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