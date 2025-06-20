import React, { useEffect, useState } from "react";
import logo from "../assets/img/logo.png";
import "../styles/loader.css";

const azulBarra = "#0a3570";

/**
 * Loader - Pantalla de carga animada de la app.
 *
 * @param {Object} props
 * @param {Function} props.onFinish - Callback al finalizar la animación.
 * @returns {JSX.Element}
 *
 * @example
 * <Loader onFinish={() => ...} />
 */
export default function Loader({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading, done

  useEffect(() => {
    if (phase === "loading") {
      if (progress < 100) {
        const timer = setTimeout(() => setProgress(progress + 2), 13);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setPhase("done"), 600);
      }
    }
    if (phase === "done") {
      setTimeout(() => onFinish && onFinish(), 400);
    }
  }, [progress, phase, onFinish]);

  return (
    <div className={`loader-bg${phase === "done" ? " loader-fade" : ""}`}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <img
          src={logo}
          alt="Logo"
          className={`loader-logo${
            phase === "done" ? " loader-logo-expand" : ""
          }`}
        />
        <div
          className="loader-bar-outer"
          style={{
            opacity: phase === "done" ? 0 : 1,
            transition: "opacity 0.5s",
          }}
        >
          <div
            className="loader-bar-inner"
            style={{
              width: `${progress}%`,
              background: azulBarra,
            }}
          />
        </div>
      </div>
      <div className="loader-footer">Demo Técnica desarrollada por AKKODIS SPAIN</div>
    </div>
  );
}