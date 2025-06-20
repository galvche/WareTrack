import React from "react";

export default function LogList({ logs }) {
  if (!logs || logs.length === 0) {
    return <div style={{ color: "#888" }}>No hay logs para mostrar.</div>;
  }
  return (
    <div>
      {logs.map((l, i) => (
        <div key={i} className={`log-item log-${l.level}`}>
          <span className="log-date">{l.datetime}</span>
          <span className="log-level">{l.level.toUpperCase()}:</span>
          <span className="log-msg" style={{ flex: 1, wordBreak: "break-word" }}>{l.msg}</span>
        </div>
      ))}
    </div>
  );
}