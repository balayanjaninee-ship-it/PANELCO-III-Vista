import { useState } from "react";
import Layout from "../components/Layout";
import { Printer, Eraser } from "lucide-react";
import TripTicketForm, { clearTripTicketDraft } from "../components/TripTicketForm";
import "../styles/typography.css";

export default function DailyDriversTripTicket() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Remount the form so it re-reads the draft after clearing.
  const [seed, setSeed] = useState(0);

  const handlePrint = () => window.print();

  const handleClear = () => {
    clearTripTicketDraft();
    setSeed((s) => s + 1);
  };

  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .tt-drawn { padding: 0 !important; box-shadow: none !important; width: 100% !important; }
          body { background: #fff !important; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>
      <div style={{ padding: "16px 24px" }}>
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Daily Driver's Trip Ticket</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Fill in the blanks directly on the form — your entries are saved automatically.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleClear}
              style={{
                padding: "8px 14px",
                background: "#fff",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Eraser size={16} /> Clear draft
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 14px",
                background: "#00923F",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
        </div>

        <div
          className="print-area"
          style={{ maxWidth: 1000, margin: "0 auto", background: "#fff" }}
        >
          <TripTicketForm key={seed} />
        </div>
      </div>
    </Layout>
  );
}
