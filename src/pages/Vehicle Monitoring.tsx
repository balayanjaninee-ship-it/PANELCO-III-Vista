import { useState } from "react";
import Layout from "../components/Layout";
import "../styles/dashboard.css";
import "../styles/typography.css";

export default function VehicleMonitoring() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <span className="text-slate-600">☰</span>
        </button>
        <h1 className="typo-headline-sm text-slate-900">Vehicle Monitoring</h1>
      </header>
      <main className="dashboard-main">
        <h2 className="typo-title-sm text-slate-900 mb-4">Vehicle Monitoring</h2>
        <p className="typo-body-sm text-slate-500">Monitor active trips and vehicle status in real time.</p>
      </main>
    </Layout>
  );
}