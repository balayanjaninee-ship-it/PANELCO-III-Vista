import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import "../styles/typography.css";

export default function Layout({
  children,
  sidebarOpen,
  setSidebarOpen,
  stage,
  maxStage,
  onStageChange,
}: {
  children: ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  stage?: number;
  maxStage?: number;
  onStageChange?: (stage: number) => void;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-700" style={{ "--sidebar-width": "248px" }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        stage={stage}
        maxStage={maxStage}
        onStageChange={onStageChange}
      />
      <div className="lg:pl-[var(--sidebar-width)]">{children}</div>
    </div>
  );
}
