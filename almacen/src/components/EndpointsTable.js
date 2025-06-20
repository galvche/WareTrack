import React from "react";

export default function EndpointsTable({ endpoints }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Método</th>
          <th>Ruta</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map((ep, i) => (
          <tr key={i}>
            <td>{ep.method}</td>
            <td>{ep.path}</td>
            <td>{ep.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}