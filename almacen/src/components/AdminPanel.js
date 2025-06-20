/**
 * AdminPanel - Panel de administración principal del almacén.
 *
 * Muestra estadísticas, gráficos, logs, endpoints y controles de asignación manual de objetos.
 *
 * @param {Object} props
 * @param {Array} props.objetos - Lista de objetos del almacén.
 * @param {string} props.backendStatus - Estado del backend ("OK" o "ERROR").
 * @param {Object} props.stats - Estadísticas de red y base de datos.
 * @param {Array} props.backendLogs - Logs del backend.
 * @param {Array} props.frontendLogs - Logs del frontend.
 * @param {Function} props.setFrontendLogs - Setter para logs del frontend.
 * @param {Array} props.celdasSeleccionadas - Celdas seleccionadas para asignación manual.
 * @param {Function} props.onAsignarObjeto - Callback para asignar objeto a celdas.
 * @returns {JSX.Element}
 *
 * @example
 * <AdminPanel objetos={objetos} stats={stats} backendLogs={logs} ... />
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import "../styles/adminPanelComponent.css";

Chart.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6F91"];

function AdminPanel({
  objetos = [],
  backendStatus = "OK",
  stats = {},
  backendLogs = [],
  frontendLogs = [],
  setFrontendLogs,
  celdasSeleccionadas = [],
  onAsignarObjeto
}) {
  const [logFilter, setLogFilter] = useState("");
  const [activeTab, setActiveTab] = useState("frontend");
  const [objetoAAsignar, setObjetoAAsignar] = useState(null);
  const usuarioActual = "Admin"; // Simulación de usuario actual

  // Estadísticas
  const totalObjetos = objetos.length;
  const porTipo = objetos.reduce((acc, o) => {
    acc[o.tipo] = (acc[o.tipo] || 0) + 1;
    return acc;
  }, {});
  const porProveedor = objetos.reduce((acc, o) => {
    acc[o.proveedor] = (acc[o.proveedor] || 0) + 1;
    return acc;
  }, {});
  const porCapa = objetos.reduce((acc, o) => {
    acc[o.capa] = (acc[o.capa] || 0) + 1;
    return acc;
  }, {});

  // Para gráficos
  const dataPorTipo = Object.entries(porTipo).map(([name, value]) => ({ name, value }));
  const dataPorProveedor = Object.entries(porProveedor).map(([name, value]) => ({ name, value }));
  const dataPorCapa = Object.entries(porCapa).map(([name, value]) => ({ name: `Capa ${name}`, value }));

  // Chart.js datasets
  const pieData = (data, label) => ({
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: COLORS,
      label
    }]
  });
  const barData = (data, label) => ({
    labels: data.map(d => d.name),
    datasets: [{
      label,
      data: data.map(d => d.value),
      backgroundColor: COLORS[0]
    }]
  });

  // Estadísticas de red y BBDD
  const tiempoMedio = stats.tiempoMedio || 0;
  const peticiones = stats.peticiones || 0;
  const errores = stats.errores || 0;
  const latencia = stats.latencia || tiempoMedio;
  const anchoBanda = stats.anchoBanda || "N/A";
  const estadoRed = stats.estadoRed || "OK";

  // --- Exportar CSV para ambos logs ---
  const exportCSV = (logs, filename) => {
    const header = "Fecha,Tipo,Mensaje\n";
    const rows = logs.map(l => `"${l.datetime}","${l.level.toUpperCase()}","${l.msg.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Transformador y filtro avanzado ---
  const parseLogs = (logs) => (logs || [])
    .map(line => line.replace(/\u0000/g, '').trim())
    .filter(line => line.length > 0)
    .map(line => {
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      let datetime = dateMatch ? dateMatch[1] : "";
      let rest = dateMatch ? line.slice(dateMatch[0].length).trim() : line;
      const match = rest.match(/(INFO|WARNING|ERROR)/i);
      const level = match ? match[1].toLowerCase() : "info";
      let msg = rest.replace(/^(INFO|WARNING|ERROR):?\s*/i, "");
      msg = msg.replace(/[.]+/g, " ").replace(/\s+/g, " ").trim();
      if (!datetime) {
        const now = new Date();
        datetime = now.toISOString().replace('T', ' ').substring(0, 19);
      }
      return { level, msg, datetime, raw: line };
    });

  // --- Filtro avanzado ---
  function advancedFilter(log) {
    if (!logFilter.trim()) return true;
    const parts = logFilter.trim().split(/\s+/);
    return parts.every(part => {
      if (part.startsWith("level:")) {
        return log.level.toLowerCase().includes(part.slice(6).toLowerCase());
      }
      if (part.startsWith("date:")) {
        return log.datetime.startsWith(part.slice(5));
      }
      if (part.startsWith("msg:")) {
        return log.msg.toLowerCase().includes(part.slice(4).toLowerCase());
      }
      if (part.startsWith("hora:")) {
        return log.datetime.slice(11, 16).includes(part.slice(5));
      }
      // Búsqueda global
      return (
        log.msg.toLowerCase().includes(part.toLowerCase()) ||
        log.level.toLowerCase().includes(part.toLowerCase()) ||
        log.datetime.toLowerCase().includes(part.toLowerCase())
      );
    });
  }

  // --- Selección de logs según pestaña ---
  const logs = activeTab === "frontend" ? frontendLogs : backendLogs;
  const parsed = parseLogs(logs);
  const filtered = parsed.filter(advancedFilter);

  return (
    <div className="dashboard-main">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">Panel de Administración</h2>
        <Link
          to="/documentacion"
          className="adminpanel-btn adminpanel-btn-doc"
        >
          Documentación
        </Link>
      </div>
      {/* Aviso y acción de asignación manual */}
      {celdasSeleccionadas && celdasSeleccionadas.length > 0 && (
        <div className="aviso-asignacion" style={{
          background: '#fffbe6',
          color: '#b26a00',
          border: '1px solid #ffe082',
          borderRadius: 8,
          padding: '14px 28px',
          marginBottom: 18,
          fontWeight: 600,
          fontSize: 16
        }}>
          <b>¡Atención!</b> Vas a asignar manualmente un objeto a las celdas seleccionadas ({celdasSeleccionadas.length}).
          <br />
          {celdasSeleccionadas.some(c => !c.capa) && (
            <span style={{color: 'red'}}>Debes indicar la capa antes de asignar.</span>
          )}
          <div style={{marginTop: 10}}>
            <label>Objeto a asignar:&nbsp;
              <input
                type="text"
                value={objetoAAsignar || ''}
                onChange={e => setObjetoAAsignar(e.target.value)}
                placeholder="ID o nombre del objeto"
                style={{marginRight: 10}}
              />
            </label>
            <button
              onClick={() => onAsignarObjeto && onAsignarObjeto(objetoAAsignar)}
              disabled={!objetoAAsignar || celdasSeleccionadas.length === 0}
              style={{marginLeft: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer'}}
            >
              Asignar objeto a selección
            </button>
          </div>
        </div>
      )}
      <div className="dashboard-row">
        <div className="dashboard-card stats">
          <div><b>Total objetos:</b> {totalObjetos}</div>
          <div><b>Peticiones:</b> {peticiones}</div>
          <div><b>Errores:</b> {errores}</div>
          <div><b>Backend:</b> <span style={{ color: backendStatus === "OK" ? "green" : "red" }}>{backendStatus}</span></div>
        </div>
        <div className="dashboard-card stats">
          <div><b>Latencia BBDD:</b> {tiempoMedio} ms</div>
          <div><b>Latencia red:</b> {latencia} ms</div>
          <div><b>Ancho banda:</b> {anchoBanda}</div>
          <div><b>Red:</b> <span style={{ color: estadoRed === "OK" ? "green" : "red" }}>{estadoRed}</span></div>
        </div>
      </div>
      <div className="dashboard-row">
        <div className="dashboard-card chart" style={{minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
          <div className="dashboard-card-title">Objetos por tipo</div>
          <div className="dashboard-card-content" style={{height: 180}}>
            {dataPorTipo.length === 0 ? (
              <div style={{color: '#888', textAlign: 'center', padding: 24}}>Sin datos para mostrar</div>
            ) : (
              <Pie data={pieData(dataPorTipo, "Objetos por tipo")} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} height={180} />
            )}
          </div>
        </div>
        <div className="dashboard-card chart" style={{minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
          <div className="dashboard-card-title">Objetos por proveedor</div>
          <div className="dashboard-card-content" style={{height: 180}}>
            {dataPorProveedor.length === 0 ? (
              <div style={{color: '#888', textAlign: 'center', padding: 24}}>Sin datos para mostrar</div>
            ) : (
              <Bar data={barData(dataPorProveedor, "Objetos por proveedor")} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} height={180} />
            )}
          </div>
        </div>
        <div className="dashboard-card chart" style={{minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
          <div className="dashboard-card-title">Objetos por capa</div>
          <div className="dashboard-card-content" style={{height: 180}}>
            {dataPorCapa.length === 0 ? (
              <div style={{color: '#888', textAlign: 'center', padding: 24}}>Sin datos para mostrar</div>
            ) : (
              <Pie data={pieData(dataPorCapa, "Objetos por capa")} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} height={180} />
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-card section-card" style={{flex: 2, minWidth: 0}}>
          <h3>Endpoints</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Método</th>
                <th>Ruta</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>GET</td><td>/objetos</td><td>Lista todos los objetos</td></tr>
              <tr><td>POST</td><td>/objetos</td><td>Crea un objeto</td></tr>
              <tr><td>PUT</td><td>/objetos/&#123;id&#125;</td><td>Edita un objeto</td></tr>
              <tr><td>DELETE</td><td>/objetos/&#123;id&#125;</td><td>Elimina un objeto</td></tr>
            </tbody>
          </table>
        </div>
        <div className="dashboard-card section-card" style={{flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
          <div>
            <h3>Seguridad</h3>
            <ul>
              <li>CORS habilitado para frontend</li>
              <li>No hay autenticación (ejemplo)</li>
              <li>No hay HTTPS en local</li>
            </ul>
          </div>
          <div>
            <h3 style={{marginTop:16}}>Base de Datos</h3>
            <ul>
              <li>SQLite en disco</li>
              <li>Tablas: objetos, usuarios (si tienes)</li>
              <li>ORM: SQLAlchemy</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="dashboard-row">
        <div className="dashboard-card section-card" style={{width: "100%", minWidth: 0}}>
          <h3>Log</h3>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <div className="log-tabs" style={{ marginBottom: 0 }}>
              <button
                className={activeTab === "frontend" ? "active" : ""}
                onClick={() => setActiveTab("frontend")}
              >
                Frontend
              </button>
              <button
                className={activeTab === "backend" ? "active" : ""}
                onClick={() => setActiveTab("backend")}
              >
                Backend
              </button>
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => exportCSV(
                (activeTab === "frontend"
                  ? parseLogs(frontendLogs).filter(advancedFilter)
                  : parseLogs(backendLogs).filter(advancedFilter)
                ),
                `${activeTab}_logs.csv`
              )}
              style={{
                background: "#005a9e",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 18px",
                fontSize: "1em",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.18s",
                marginLeft: 12
              }}
              onMouseOver={e => e.currentTarget.style.background = "#00205b"}
              onMouseOut={e => e.currentTarget.style.background = "#005a9e"}
            >
              Exportar CSV
            </button>
          </div>
          <input
            className="log-filter"
            placeholder="Filtra: texto, level:error, date:2025-06-19, hora:11:24, msg:palabra..."
            value={logFilter}
            onChange={e => setLogFilter(e.target.value)}
            style={{ width: "100%", marginBottom: 10, fontSize: "1em" }}
          />
          <div className="log-list" style={{ width: "100%", minHeight: 180, maxHeight: 320, overflowY: "auto" }}>
            {(() => {
              // Selección de logs según pestaña
              const logs = activeTab === "frontend" ? frontendLogs : backendLogs;
              const parsed = parseLogs(logs);
              const filtered = parsed.filter(advancedFilter);
              const toShow = logFilter.trim() ? filtered : filtered.slice(-20).reverse();

              return (
                <>
                  {toShow.length === 0 && (
                    <div style={{ color: "#888" }}>No hay logs para mostrar.</div>
                  )}
                  {toShow.map((l, i) => (
                    <div key={i} className={`log-item log-${l.level}`} style={{ display: "flex", gap: 10, alignItems: "baseline", width: "100%" }}>
                      <span className="log-date" style={{ minWidth: 120 }}>{l.datetime}</span>
                      <span className="log-level" style={{ minWidth: 60 }}>{l.level.toUpperCase()}:</span>
                      <span className="log-msg" style={{ flex: 1, wordBreak: "break-word" }}>{l.msg}</span>
                    </div>
                  ))}
                  {logFilter.trim() && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      Mostrando {filtered.length} resultado(s) de {parsed.length} log(s) totales.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;