import { useCallback, useEffect, useState, type CSSProperties } from "react";
import "../styles/trip-ticket.css";

const PREFIX = "ddtt_";

const FIELD_IDS: string[] = [
  "driver_name", "date", "destination", "vehicle", "purpose", "passengers",
  "chk_diesel", "liters_diesel", "chk_super", "liters_super", "chk_unleaded", "liters_unleaded", "chk_others", "liters_others",
  "km_reading_departure", "time_departure", "km_reading_arrived", "time_arrived",
  "conforme", "driver_sig", "released_sig", "noted_sig", "approved_sig",
  "gp1_control_no", "gp1_date", "gp1_time_out", "gp1_time_in", "gp1_personnel", "gp1_position", "gp1_division", "gp1_destination", "gp1_purpose", "gp1_employee", "gp1_responsible", "gp1_approved",
  "gp2_control_no", "gp2_date", "gp2_time_out", "gp2_time_in", "gp2_personnel", "gp2_position", "gp2_division", "gp2_destination", "gp2_purpose", "gp2_employee", "gp2_responsible", "gp2_approved",
];

function readField(id: string): string {
  try { return localStorage.getItem(PREFIX + id) ?? ""; } catch { return ""; }
}
function writeField(id: string, value: string): void {
  try {
    if (value) localStorage.setItem(PREFIX + id, value);
    else localStorage.removeItem(PREFIX + id);
  } catch { /* ignore */ }
}

export function readTripTicketDraft(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of FIELD_IDS) out[id] = readField(id);
  return out;
}
export function clearTripTicketDraft(): void {
  try { for (const id of FIELD_IDS) localStorage.removeItem(PREFIX + id); } catch { /* ignore */ }
}

interface Props { defaults?: Record<string, string>; }

const inp: CSSProperties = {
  width: "100%", border: "none", borderBottom: "1px solid #000",
  background: "transparent", fontFamily: "Times New Roman, Times, serif",
  fontSize: 10, padding: "0 2px", outline: "none",
};
const chk: CSSProperties = { accentColor: "#000", margin: 0 };

function F({ id, values, handle, style }: { id: string; values: Record<string, string>; handle: (id: string, v: string) => void; style?: CSSProperties }) {
  return (
    <input
      id={id}
      type="text"
      value={values[id] ?? ""}
      onChange={(e) => handle(id, e.target.value)}
      style={{ ...inp, ...style }}
    />
  );
}

export default function TripTicketForm({ defaults }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const draft = readTripTicketDraft();
    const merged = { ...draft };
    if (defaults) for (const [k, v] of Object.entries(defaults)) if (!merged[k]) merged[k] = v;
    return merged;
  });
  useEffect(() => {
    if (!defaults) return;
    setValues((prev) => {
      const next = { ...prev }; let changed = false;
      for (const [k, v] of Object.entries(defaults)) if (!next[k]) { next[k] = v; changed = true; }
      return changed ? next : prev;
    });
  }, [defaults]);

  const handle = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    writeField(id, value);
  }, []);

  const C = (id: string) => (
    <input type="checkbox" style={chk} checked={values[id] === "on"} onChange={(e) => handle(id, e.target.checked ? "on" : "")} />
  );

  return (
    <div className="tt-drawn" style={{ background: "#fff", padding: "12mm 14mm", fontFamily: "Times New Roman, Times, serif", color: "#000" }}>
      {/* Letterhead */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "2.5px solid #1a3a5c", marginBottom: 6 }}>
        <div style={{ width: 26, height: 26, border: "2px solid #1a3a5c", borderRadius: 4, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16, color: "#1a3a5c", fontFamily: "Arial, sans-serif" }}>P</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", lineHeight: 1.15 }}>PANGASINAN III ELECTRIC COOPERATIVE, INC.</div>
          <div style={{ fontSize: 8.5, color: "#334155" }}>PANELCO III · VehicleHub</div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "10px 0" }}>Daily Driver's Trip Ticket</div>

      {/* Header info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 8, fontSize: 10 }}>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Driver's Name</span><F id="driver_name" values={values} handle={handle} /></label>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Date</span><F id="date" values={values} handle={handle} /></label>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Destination</span><F id="destination" values={values} handle={handle} /></label>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Vehicle</span><F id="vehicle" values={values} handle={handle} /></label>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Purpose / Travel</span><F id="purpose" values={values} handle={handle} /></label>
        <label style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Passenger/s</span><F id="passengers" values={values} handle={handle} /></label>
      </div>

      {/* Fuel + Trip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Fuel Consumption</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}>Particulars</th>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}>Checked</th>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}>Liters</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Diesel", "chk_diesel", "liters_diesel"],
                ["Super", "chk_super", "liters_super"],
                ["Unleaded", "chk_unleaded", "liters_unleaded"],
                ["Others", "chk_others", "liters_others"],
              ].map(([name, c, l]) => (
                <tr key={name}>
                  <td style={{ border: "0.6px solid #000", padding: "3px 4px" }}>{name}</td>
                  <td style={{ border: "0.6px solid #000", padding: "3px 4px", textAlign: "center" }}>{C(c)}</td>
                  <td style={{ border: "0.6px solid #000", padding: "2px 4px" }}><F id={l} values={values} handle={handle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Trip</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}></th>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}>KM Reading</th>
                <th style={{ border: "0.6px solid #000", padding: "3px 4px", borderTop: "1px solid #000", borderBottom: "1.4px solid #000", fontWeight: 700, textTransform: "uppercase" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "0.6px solid #000", padding: "3px 4px" }}>Departure</td>
                <td style={{ border: "0.6px solid #000", padding: "2px 4px" }}><F id="km_reading_departure" values={values} handle={handle} /></td>
                <td style={{ border: "0.6px solid #000", padding: "2px 4px" }}><F id="time_departure" values={values} handle={handle} /></td>
              </tr>
              <tr>
                <td style={{ border: "0.6px solid #000", padding: "3px 4px" }}>Arrived</td>
                <td style={{ border: "0.6px solid #000", padding: "2px 4px" }}><F id="km_reading_arrived" values={values} handle={handle} /></td>
                <td style={{ border: "0.6px solid #000", padding: "2px 4px" }}><F id="time_arrived" values={values} handle={handle} /></td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6, fontSize: 10 }}>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Conforme:</span>
            <F id="conforme" values={values} handle={handle} />
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
        {[
          ["driver_sig", "Driver's Signature over Printed Name"],
          ["released_sig", "Released By"],
          ["noted_sig", "Noted By"],
          ["approved_sig", "Approved By"],
        ].map(([id, cap]) => (
          <div key={id}>
            <F id={id} values={values} handle={handle} />
            <div style={{ fontSize: 7.5, color: "#334155", textAlign: "center", marginTop: 3, lineHeight: 1.1 }}>{cap}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#334155", paddingTop: 6, borderTop: "1px solid #999", marginTop: 10 }}>Same Printed Sheet</div>

      {/* Gate passes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        {[1, 2].map((n) => {
          const p = `gp${n}_`;
          return (
            <div key={n} style={{ border: "1px solid #000", padding: "6px 8px" }}>
              <div style={{ textAlign: "center", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, borderBottom: "1px solid #000", paddingBottom: 3 }}>Gate Pass</div>
              {[
                ["Control No.", `${p}control_no`],
                ["Date", `${p}date`],
              ].map(([lbl, id]) => (
                <div key={id} style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 8.5, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{lbl}</span>
                  <F id={id} values={values} handle={handle} style={{ fontSize: 8.5 }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 4, fontSize: 8.5, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Time Out</span>
                <F id={`${p}time_out`} values={values} handle={handle} style={{ fontSize: 8.5 }} />
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Time In</span>
                <F id={`${p}time_in`} values={values} handle={handle} style={{ fontSize: 8.5 }} />
              </div>
              {[
                ["Personnel", `${p}personnel`],
                ["Position", `${p}position`],
                ["Division", `${p}division`],
                ["Destination", `${p}destination`],
                ["Purpose", `${p}purpose`],
              ].map(([lbl, id]) => (
                <div key={id} style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 8.5, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{lbl}</span>
                  <F id={id} values={values} handle={handle} style={{ fontSize: 8.5 }} />
                </div>
              ))}
              {[
                ["Employee's Signature", `${p}employee`],
                ["Responsible Person", `${p}responsible`],
                ["Approved By", `${p}approved`],
              ].map(([lbl, id]) => (
                <div key={id} style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 8.5, marginBottom: 3, marginTop: lbl === "Employee's Signature" ? 6 : 0 }}>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{lbl}</span>
                  <F id={id} values={values} handle={handle} style={{ fontSize: 8.5 }} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
