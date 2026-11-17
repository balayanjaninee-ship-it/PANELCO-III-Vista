const fs = require("fs");
const body = fs.readFileSync("C:/Users/Janine/Desktop/PANELCO-VehicleHub/scratchpad/inputs.txt", "utf8");

const checkboxes = [
  { id: "chk_diesel", t: 22.88 },
  { id: "chk_super", t: 24.35 },
  { id: "chk_unleaded", t: 25.58 },
  { id: "chk_others", t: 26.88 },
];

const lines = body.split("\n").filter((l) => !l.includes('type="checkbox"'));
const cbInputs = checkboxes
  .map(
    (c) =>
      `      <input id="${c.id}" type="checkbox" className="tt-field tt-checkbox" style={{ left: "11.48%", top: "${c.t}%", width: "1.01%", height: "0.71%", }} checked={values["${c.id}"] === "on"} onChange={(e) => handle("${c.id}", e.target.checked ? "on" : "")} />`
  )
  .join("\n");

const finalInputs = cbInputs + "\n" + lines.join("\n");

const fieldIds = [
  "driver_name","date","destination","vehicle","purpose","passengers",
  "chk_diesel","liters_diesel","chk_super","liters_super","chk_unleaded","liters_unleaded","chk_others","liters_others",
  "km_reading_departure","time_departure","km_reading_arrived","time_arrived",
  "conforme","driver_sig","released_sig","noted_sig","approved_sig",
  "gp1_control_no","gp1_date","gp1_time_out","gp1_time_in","gp1_personnel","gp1_position","gp1_division","gp1_destination","gp1_purpose","gp1_employee","gp1_responsible","gp1_approved",
  "gp2_control_no","gp2_date","gp2_time_out","gp2_time_in","gp2_personnel","gp2_position","gp2_division","gp2_destination","gp2_purpose","gp2_employee","gp2_responsible","gp2_approved",
];

const component = `import { useCallback, useEffect, useState } from "react";
import "../styles/trip-ticket.css";

const PREFIX = "ddtt_";

function readField(id: string): string {
  try {
    return localStorage.getItem(PREFIX + id) ?? "";
  } catch {
    return "";
  }
}

function writeField(id: string, value: string): void {
  try {
    if (value) localStorage.setItem(PREFIX + id, value);
    else localStorage.removeItem(PREFIX + id);
  } catch {
    /* storage unavailable */
  }
}

const FIELD_IDS: string[] = ${JSON.stringify(fieldIds)};

export function readTripTicketDraft(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of FIELD_IDS) out[id] = readField(id);
  return out;
}

export function clearTripTicketDraft(): void {
  try {
    for (const id of FIELD_IDS) localStorage.removeItem(PREFIX + id);
  } catch {
    /* ignore */
  }
}

export default function TripTicketForm({ defaults }: { defaults?: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const draft = readTripTicketDraft();
    const merged = { ...draft };
    if (defaults) {
      for (const [k, v] of Object.entries(defaults)) {
        if (!merged[k]) merged[k] = v;
      }
    }
    return merged;
  });

  useEffect(() => {
    if (!defaults) return;
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(defaults)) {
        if (!next[k]) { next[k] = v; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [defaults]);

  const handle = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    writeField(id, value);
  }, []);

  return (
    <div className="trip-ticket-form">
      <img className="tt-paper" src="/ddtt.png" alt="Daily Driver's Trip Ticket" draggable={false} />
${finalInputs.split("\n").map((l) => "      " + l.trim()).join("\n")}
    </div>
  );
}
`;

fs.writeFileSync("C:/Users/Janine/Desktop/PANELCO-VehicleHub/src/components/TripTicketForm.tsx", component);
console.log("written");
