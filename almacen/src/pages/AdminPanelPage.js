import React, { useEffect, useState } from "react";
import AdminPanel from "../components/AdminPanel";
import logo from "../assets/img/logo.png";
import { Link } from "react-router-dom";
import "../styles/adminPanel.css";

export default function AdminPanelPage(props) {
  const [objetos, setObjetos] = useState([]);
  const [backendStatus, setBackendStatus] = useState("OK");
  const [backendLogs, setBackendLogs] = useState([]);
  const [frontendLogs, setFrontendLogs] = useState(() => {
    // Si quieres persistencia en localStorage:
    const saved = localStorage.getItem("frontendLogs");
    return saved ? JSON.parse(saved) : [];
  });
  const [dbStats, setDbStats] = useState({ total_consultas: 0, errores: 0, tiempo_medio_ms: 0 });

  // Carga objetos y logs reales
  useEffect(() => {
    fetch("http://localhost:8000/objetos")
      .then(res => res.json())
      .then(data => setObjetos(data));

    fetch("http://localhost:8000/logs")
      .then(res => res.json())
      .then(data => setBackendLogs(data.logs || []));

    setBackendStatus("OK");

    fetch("http://localhost:8000/db_stats")
      .then(res => res.json())
      .then(data => setDbStats(data));
  }, []);

  // Guarda logs frontend en localStorage si quieres persistencia
  useEffect(() => {
    localStorage.setItem("frontendLogs", JSON.stringify(frontendLogs));
  }, [frontendLogs]);

  useEffect(() => {
    // Escucha cambios en localStorage (por si hay varias pestañas)
    const syncLogs = () => {
      const saved = localStorage.getItem("frontendLogs");
      setFrontendLogs(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener("storage", syncLogs);
    // También recarga al montar la página
    syncLogs();
    return () => window.removeEventListener("storage", syncLogs);
  }, []);

  return (
    <div className="adminpage-bg">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/">
            <img src={logo} alt="Logo" className="logo" style={{ cursor: "pointer" }} />
          </Link>
        </div>
        <div className="topbar-right">
          <Link to="/" className="adminpanel-btn adminpanel-btn-rect">Volver</Link>
        </div>
      </div>
      <div className="adminpage-content">
        <AdminPanel
          objetos={objetos}
          backendLogs={backendLogs}
          frontendLogs={frontendLogs}
          setFrontendLogs={setFrontendLogs}
          backendStatus={backendStatus}
          stats={{
            tiempoMedio: dbStats.tiempo_medio_ms,
            peticiones: dbStats.total_consultas,
            errores: dbStats.errores,
            latencia: dbStats.tiempo_medio_ms,
            anchoBanda: "N/A",
            estadoRed: "OK"
          }}
          {...props}
        />
      </div>
    </div>
  );
}