import { useState } from "react";
import Layout from "../components/Layout";
import Header from "../components/Header";
import "../styles/dashboard.css";
import "../styles/typography.css";

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Header title="User Management" description="Manage system users and roles." breadcrumb="VISTA / User Management" showSearch={false} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="dashboard-main">
        <h2 className="typo-title-lg text-slate-900 mb-4">User Management</h2>
        <p className="typo-body-lg text-slate-500">Manage system users and roles.</p>
      </main>
    </Layout>
  );
}