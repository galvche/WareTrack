import React from "react";

export default function ChartCard({ title, children }) {
  return (
    <div className="dashboard-card chart">
      <div className="dashboard-card-title">{title}</div>
      {children}
    </div>
  );
}