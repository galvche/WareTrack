import React, { useState } from "react";
import DocumentationExplorer from "./DocumentationExplorer";
import Topbar from "../components/Topbar";
import logo from "../assets/img/logo.png";
import { useNavigate } from "react-router-dom";
import "../styles/doc.css";

export default function DocumentationPage() {
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();
  // Topbar con botón volver y buscador funcional
  return (
    <div className="doc-bg">
      <Topbar
        logo={logo}
        hora={new Date()}
        handleIconClick={() => navigate("/admin")}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        sugerencias={[]}
        setSugerencias={() => {}}
        capaBtnRef={null}
        menuVisible={false}
        setMenuVisible={() => {}}
        handleMenuOption={() => {}}
        showAlertDropdown={false}
        toggleAlertDropdown={() => {}}
        alertasVistas={true}
        alertas={[]}
        setAlertas={() => {}}
        volverBtn={true}
        onVolver={() => navigate("/admin")}
        buscadorDoc={true}
      />
      <div className="doc-header">
        <h1 className="doc-title">Documentación Técnica de la Aplicación</h1>
        <p className="doc-desc">Explora la documentación generada automáticamente de todos los componentes, funciones, hooks y clases de la app. Siempre actualizada y organizada.</p>
      </div>
      <DocumentationExplorer busqueda={busqueda} setBusqueda={setBusqueda} />
    </div>
  );
}
