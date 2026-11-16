import { useCallback, useState } from "react";
import "../styles/trip-ticket.css";

const PREFIX = "ddtt_";

type FieldType = "text" | "checkbox";

interface FieldDef {
  id: string;
  label?: string; // printed label shown next to the field
  l: number; // left  (% of the A4 sheet width)
  t: number; // top  (% of the A4 sheet height)
  w: number; // width (%)
  h: number; // height (%)
  type?: FieldType;
  underline?: boolean; // draw a bottom border line instead of a box
}

/**
 * Field coordinates measured from the official scan proportions.
 * Each field is absolutely positioned over the drawn form so typed text
 * lands on the pre-printed lines exactly like the real form.
 */
const FIELDS: FieldDef[] = [
  // --- Header block ---
  { id: "driver_name", label: "Driver's Name", l: 18.76, t: 12.79, w: 34.73, h: 1.19, underline: true },
  { id: "date", label: "Date", l: 58.54, t: 12.87, w: 31.37, h: 1.19, underline: true },
  { id: "destination", label: "Destination", l: 18.76, t: 14.37, w: 34.73, h: 1.39, underline: true },
  { id: "vehicle", label: "Vehicle", l: 62.5, t: 14.37, w: 29, h: 1.39, underline: true },
  { id: "purpose", label: "Purpose / Travel", l: 18.48, t: 15.72, w: 34.73, h: 1.19, underline: true },
  { id: "passengers", label: "Passenger/s", l: 67.79, t: 15.68, w: 25.21, h: 1.19, underline: true },

  // --- Fuel block (checkboxes + liters) ---
  { id: "chk_diesel", l: 11.48, t: 22.88, w: 1.01, h: 0.71, type: "checkbox" },
  { id: "liters_diesel", l: 23.53, t: 22.88, w: 6.72, h: 0.99, underline: true },
  { id: "chk_super", l: 11.48, t: 24.35, w: 1.01, h: 0.71, type: "checkbox" },
  { id: "liters_super", l: 23.53, t: 24.35, w: 6.72, h: 0.99, underline: true },
  { id: "chk_unleaded", l: 11.48, t: 25.58, w: 1.01, h: 0.71, type: "checkbox" },
  { id: "liters_unleaded", l: 23.53, t: 25.58, w: 6.72, h: 0.99, underline: true },
  { id: "chk_others", l: 11.48, t: 26.88, w: 1.01, h: 0.71, type: "checkbox" },
  { id: "liters_others", l: 23.53, t: 26.88, w: 6.72, h: 0.99, underline: true },

  // --- Trip table (right): Particulars | KM Reading | Time ---
  { id: "km_reading_departure", l: 60.8, t: 21.6, w: 10.4, h: 1.1, underline: true },
  { id: "time_departure", l: 72, t: 21.6, w: 10.5, h: 1.1, underline: true },
  { id: "km_reading_arrived", l: 60.8, t: 22.9, w: 10.4, h: 1.1, underline: true },
  { id: "time_arrived", l: 72, t: 22.9, w: 10.5, h: 1.1, underline: true },

  { id: "conforme", l: 62.13, t: 27.12, w: 31.37, h: 1.19, underline: true },
  { id: "driver_sig", l: 70.76, t: 32.66, w: 26.89, h: 1.78, underline: true },
  { id: "released_sig", l: 5.6, t: 36.82, w: 16.81, h: 2.38, underline: true },
  { id: "noted_sig", l: 34.23, t: 36.82, w: 16.81, h: 2.38, underline: true },
  { id: "approved_sig", l: 62.13, t: 36.82, w: 16.81, h: 2.38, underline: true },

  // --- Gate Pass 1 ---
  { id: "gp1_control_no", l: 10.92, t: 55.42, w: 15.69, h: 0.99, underline: true },
  { id: "gp1_date", l: 30.53, t: 55.42, w: 15.69, h: 0.99, underline: true },
  { id: "gp1_time_out", l: 8.96, t: 56.81, w: 8.4, h: 0.99, underline: true },
  { id: "gp1_time_in", l: 30.25, t: 56.81, w: 8.4, h: 0.99, underline: true },
  { id: "gp1_personnel", l: 12.32, t: 58.19, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_position", l: 11.2, t: 60.77, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_division", l: 10.92, t: 62.15, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_destination", l: 11.77, t: 63.78, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_purpose", l: 10.92, t: 66.33, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_employee", l: 41.46, t: 71.02, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_responsible", l: 13.45, t: 72.64, w: 14.56, h: 0.99, underline: true },
  { id: "gp1_approved", l: 33.61, t: 77.4, w: 14.56, h: 0.99, underline: true },

  // --- Gate Pass 2 ---
  { id: "gp2_control_no", l: 60.22, t: 55.62, w: 15.69, h: 0.99, underline: true },
  { id: "gp2_date", l: 79.27, t: 55.62, w: 15.69, h: 0.99, underline: true },
  { id: "gp2_time_out", l: 58.77, t: 57.01, w: 8.4, h: 0.99, underline: true },
  { id: "gp2_time_in", l: 78.65, t: 57.01, w: 8.4, h: 0.99, underline: true },
  { id: "gp2_personnel", l: 62.13, t: 58.39, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_position", l: 61.01, t: 60.97, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_division", l: 61.01, t: 62.48, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_destination", l: 61.85, t: 64.06, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_purpose", l: 61.01, t: 66.41, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_employee", l: 88.97, t: 70.86, w: 11.2, h: 0.99, underline: true },
  { id: "gp2_responsible", l: 70.03, t: 72.64, w: 14.56, h: 0.99, underline: true },
  { id: "gp2_approved", l: 82.35, t: 77.95, w: 14.56, h: 0.99, underline: true },
];

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
    /* storage unavailable — keep the value in memory only */
  }
}

export function readTripTicketDraft(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of FIELDS) out[f.id] = readField(f.id);
  return out;
}

export function clearTripTicketDraft(): void {
  try {
    for (const f of FIELDS) localStorage.removeItem(PREFIX + f.id);
  } catch {
    /* ignore */
  }
}

/**
 * Daily Driver's Trip Ticket — drawn form with fillable fields.
 * No scanned image is used; the form layout is built with CSS borders
 * and lines so typed text lands on the pre-printed fields.
 */
export default function TripTicketForm() {
  const [values, setValues] = useState<Record<string, string>>(() =>
    readTripTicketDraft()
  );

  const handle = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    writeField(id, value);
  }, []);

  return (
    <div className="trip-ticket-form">
      {/* Letterhead */}
      <div className="tt-letterhead">
        <div className="tt-brand-mark">P</div>
        <div className="tt-brand-text">
          <div className="tt-coop">PANGASINAN III ELECTRIC COOPERATIVE, INC.</div>
          <div className="tt-sub">PANELCO III · VehicleHub</div>
        </div>
      </div>

      {/* Title */}
      <div className="tt-title">DAILY DRIVER'S TRIP TICKET</div>

      {/* Main info section */}
      <div className="tt-section tt-info">
        <div className="tt-field-row">
          <span className="tt-label">Driver's Name</span>
          <input
            id="driver_name"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "18.76%",
              top: "12.79%",
              width: "34.73%",
              height: "1.19%",
            }}
            value={values["driver_name"] ?? ""}
            onChange={(e) => handle("driver_name", e.target.value)}
          />
          <span className="tt-label tt-label-right">Date</span>
          <input
            id="date"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "58.54%",
              top: "12.87%",
              width: "31.37%",
              height: "1.19%",
            }}
            value={values["date"] ?? ""}
            onChange={(e) => handle("date", e.target.value)}
          />
        </div>
        <div className="tt-field-row">
          <span className="tt-label">Destination</span>
          <input
            id="destination"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "18.76%",
              top: "14.37%",
              width: "34.73%",
              height: "1.39%",
            }}
            value={values["destination"] ?? ""}
            onChange={(e) => handle("destination", e.target.value)}
          />
          <span className="tt-label tt-label-right">Vehicle</span>
          <input
            id="vehicle"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "62.5%",
              top: "14.37%",
              width: "29%",
              height: "1.39%",
            }}
            value={values["vehicle"] ?? ""}
            onChange={(e) => handle("vehicle", e.target.value)}
          />
        </div>
        <div className="tt-field-row">
          <span className="tt-label">Purpose / Travel</span>
          <input
            id="purpose"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "18.48%",
              top: "15.72%",
              width: "34.73%",
              height: "1.19%",
            }}
            value={values["purpose"] ?? ""}
            onChange={(e) => handle("purpose", e.target.value)}
          />
          <span className="tt-label tt-label-right">Passenger/s</span>
          <input
            id="passengers"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "67.79%",
              top: "15.68%",
              width: "25.21%",
              height: "1.19%",
            }}
            value={values["passengers"] ?? ""}
            onChange={(e) => handle("passengers", e.target.value)}
          />
        </div>
      </div>

      {/* Fuel consumption block */}
      <div className="tt-section tt-fuel">
        <div className="tt-fuel-header">FUEL CONSUMPTION</div>
        <div className="tt-fuel-table">
          <div className="tt-fuel-row tt-fuel-head">
            <span className="tt-fuel-col c1">Particulars</span>
            <span className="tt-fuel-col c2">KM Reading</span>
            <span className="tt-fuel-col c3">Time</span>
          </div>
          <div className="tt-fuel-row">
            <span className="tt-fuel-col c1">
              <input
                type="checkbox"
                className="tt-checkbox"
                checked={values["chk_diesel"] === "on"}
                onChange={(e) =>
                  handle("chk_diesel", e.target.checked ? "on" : "")
                }
              />
              </span>
            <span className="tt-fuel-col c2">Diesel</span>
            <span className="tt-fuel-col c3">
              <input
                id="liters_diesel"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "23.53%",
                  top: "22.88%",
                  width: "6.72%",
                  height: "0.99%",
                }}
                value={values["liters_diesel"] ?? ""}
                onChange={(e) => handle("liters_diesel", e.target.value)}
              />
            </span>
          </div>
          <div className="tt-fuel-row">
            <span className="tt-fuel-col c1">
              <input
                type="checkbox"
                className="tt-checkbox"
                checked={values["chk_super"] === "on"}
                onChange={(e) =>
                  handle("chk_super", e.target.checked ? "on" : "")
                }
              />
              </span>
            <span className="tt-fuel-col c2">Super</span>
            <span className="tt-fuel-col c3">
              <input
                id="liters_super"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "23.53%",
                  top: "24.35%",
                  width: "6.72%",
                  height: "0.99%",
                }}
                value={values["liters_super"] ?? ""}
                onChange={(e) => handle("liters_super", e.target.value)}
              />
            </span>
          </div>
          <div className="tt-fuel-row">
            <span className="tt-fuel-col c1">
              <input
                type="checkbox"
                className="tt-checkbox"
                checked={values["chk_unleaded"] === "on"}
                onChange={(e) =>
                  handle("chk_unleaded", e.target.checked ? "on" : "")
                }
              />
              </span>
            <span className="tt-fuel-col c2">Unleaded</span>
            <span className="tt-fuel-col c3">
              <input
                id="liters_unleaded"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "23.53%",
                  top: "25.58%",
                  width: "6.72%",
                  height: "0.99%",
                }}
                value={values["liters_unleaded"] ?? ""}
                onChange={(e) => handle("liters_unleaded", e.target.value)}
              />
            </span>
          </div>
          <div className="tt-fuel-row">
            <span className="tt-fuel-col c1">
              <input
                type="checkbox"
                className="tt-checkbox"
                checked={values["chk_others"] === "on"}
                onChange={(e) =>
                  handle("chk_others", e.target.checked ? "on" : "")
                }
              />
              </span>
            <span className="tt-fuel-col c2">Others</span>
            <span className="tt-fuel-col c3">
              <input
                id="liters_others"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "23.53%",
                  top: "26.88%",
                  width: "6.72%",
                  height: "0.99%",
                }}
                value={values["liters_others"] ?? ""}
                onChange={(e) => handle("liters_others", e.target.value)}
              />
            </span>
          </div>
        </div>

        {/* Trip table: Departure / Arrived */}
        <div className="tt-trip-table">
          <div className="tt-trip-row tt-trip-head">
            <span className="tt-trip-col c1"></span>
            <span className="tt-trip-col c2">KM Reading</span>
            <span className="tt-trip-col c3">Time</span>
          </div>
          <div className="tt-trip-row">
            <span className="tt-trip-col c1">Departure</span>
            <span className="tt-trip-col c2">
              <input
                id="km_reading_departure"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "60.8%",
                  top: "21.6%",
                  width: "10.4%",
                  height: "1.1%",
                }}
                value={values["km_reading_departure"] ?? ""}
                onChange={(e) => handle("km_reading_departure", e.target.value)}
              />
            </span>
            <span className="tt-trip-col c3">
              <input
                id="time_departure"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "72%",
                  top: "21.6%",
                  width: "10.5%",
                  height: "1.1%",
                }}
                value={values["time_departure"] ?? ""}
                onChange={(e) => handle("time_departure", e.target.value)}
              />
            </span>
          </div>
          <div className="tt-trip-row">
            <span className="tt-trip-col c1">Arrived</span>
            <span className="tt-trip-col c2">
              <input
                id="km_reading_arrived"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "60.8%",
                  top: "22.9%",
                  width: "10.4%",
                  height: "1.1%",
                }}
                value={values["km_reading_arrived"] ?? ""}
                onChange={(e) => handle("km_reading_arrived", e.target.value)}
              />
            </span>
            <span className="tt-trip-col c3">
              <input
                id="time_arrived"
                type="text"
                className="tt-field tt-underline tt-tight"
                style={{
                  left: "72%",
                  top: "22.9%",
                  width: "10.5%",
                  height: "1.1%",
                }}
                value={values["time_arrived"] ?? ""}
                onChange={(e) => handle("time_arrived", e.target.value)}
              />
            </span>
          </div>
        </div>

        <div className="tt-conforme-row">
          <span className="tt-label-small">Conforme:</span>
          <input
            id="conforme"
            type="text"
            className="tt-field tt-underline"
            style={{
              left: "62.13%",
              top: "27.12%",
              width: "31.37%",
              height: "1.19%",
            }}
            value={values["conforme"] ?? ""}
            onChange={(e) => handle("conforme", e.target.value)}
          />
        </div>
      </div>

      {/* Signatures */}
      <div className="tt-section tt-signatures">
        <div className="tt-sig-row">
          <div className="tt-sig-cell">
            <input
              id="driver_sig"
              type="text"
              className="tt-field tt-underline tt-sig"
              style={{
                left: "70.76%",
                top: "32.66%",
                width: "26.89%",
                height: "1.78%",
              }}
              value={values["driver_sig"] ?? ""}
              onChange={(e) => handle("driver_sig", e.target.value)}
            />
            <div className="tt-sig-caption">Driver's Signature over Printed Name</div>
          </div>
          <div className="tt-sig-cell">
            <input
              id="released_sig"
              type="text"
              className="tt-field tt-underline tt-sig"
              style={{
                left: "5.6%",
                top: "36.82%",
                width: "16.81%",
                height: "2.38%",
              }}
              value={values["released_sig"] ?? ""}
              onChange={(e) => handle("released_sig", e.target.value)}
            />
            <div className="tt-sig-caption">Released By</div>
          </div>
          <div className="tt-sig-cell">
            <input
              id="noted_sig"
              type="text"
              className="tt-field tt-underline tt-sig"
              style={{
                left: "34.23%",
                top: "36.82%",
                width: "16.81%",
                height: "2.38%",
              }}
              value={values["noted_sig"] ?? ""}
              onChange={(e) => handle("noted_sig", e.target.value)}
            />
            <div className="tt-sig-caption">Noted By</div>
          </div>
          <div className="tt-sig-cell">
            <input
              id="approved_sig"
              type="text"
              className="tt-field tt-underline tt-sig"
              style={{
                left: "62.13%",
                top: "36.82%",
                width: "16.81%",
                height: "2.38%",
              }}
              value={values["approved_sig"] ?? ""}
              onChange={(e) => handle("approved_sig", e.target.value)}
            />
            <div className="tt-sig-caption">Approved By</div>
          </div>
        </div>
      </div>

      {/* Gate Pass dividers */}
      <div className="tt-gp-divider">SAME PRINTED SHEET</div>

      {/* Gate Pass 1 */}
      <div className="tt-section tt-gatepass tt-gp1">
        <div className="tt-gp-title">GATE PASS</div>
        <div className="tt-gp-grid">
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Control No.</span>
            <input
              id="gp1_control_no"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "10.92%",
                top: "55.42%",
                width: "15.69%",
                height: "0.99%",
              }}
              value={values["gp1_control_no"] ?? ""}
              onChange={(e) => handle("gp1_control_no", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Date</span>
            <input
              id="gp1_date"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "30.53%",
                top: "55.42%",
                width: "15.69%",
                height: "0.99%",
              }}
              value={values["gp1_date"] ?? ""}
              onChange={(e) => handle("gp1_date", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Time Out</span>
            <input
              id="gp1_time_out"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "8.96%",
                top: "56.81%",
                width: "8.4%",
                height: "0.99%",
              }}
              value={values["gp1_time_out"] ?? ""}
              onChange={(e) => handle("gp1_time_out", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Time In</span>
            <input
              id="gp1_time_in"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "30.25%",
                top: "56.81%",
                width: "8.4%",
                height: "0.99%",
              }}
              value={values["gp1_time_in"] ?? ""}
              onChange={(e) => handle("gp1_time_in", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Personnel</span>
            <input
              id="gp1_personnel"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "12.32%",
                top: "58.19%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_personnel"] ?? ""}
              onChange={(e) => handle("gp1_personnel", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Position</span>
            <input
              id="gp1_position"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "11.2%",
                top: "60.77%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_position"] ?? ""}
              onChange={(e) => handle("gp1_position", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Division</span>
            <input
              id="gp1_division"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "10.92%",
                top: "62.15%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_division"] ?? ""}
              onChange={(e) => handle("gp1_division", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Destination</span>
            <input
              id="gp1_destination"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "11.77%",
                top: "63.78%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_destination"] ?? ""}
              onChange={(e) => handle("gp1_destination", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Purpose</span>
            <input
              id="gp1_purpose"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "10.92%",
                top: "66.33%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_purpose"] ?? ""}
              onChange={(e) => handle("gp1_purpose", e.target.value)}
            />
          </div>
        </div>
        <div className="tt-gp-sigs">
          <div className="tt-gp-sig-cell">
            <input
              id="gp1_employee"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "41.46%",
                top: "71.02%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_employee"] ?? ""}
              onChange={(e) => handle("gp1_employee", e.target.value)}
            />
            <div className="tt-sig-caption-small">Employee's Signature</div>
          </div>
          <div className="tt-gp-sig-cell">
            <input
              id="gp1_responsible"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "13.45%",
                top: "72.64%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_responsible"] ?? ""}
              onChange={(e) => handle("gp1_responsible", e.target.value)}
            />
            <div className="tt-sig-caption-small">Responsible Person</div>
          </div>
          <div className="tt-gp-sig-cell">
            <input
              id="gp1_approved"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "33.61%",
                top: "77.4%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp1_approved"] ?? ""}
              onChange={(e) => handle("gp1_approved", e.target.value)}
            />
            <div className="tt-sig-caption-small">Approved By</div>
          </div>
        </div>
      </div>

      {/* Gate Pass 2 */}
      <div className="tt-section tt-gatepass tt-gp2">
        <div className="tt-gp-title">GATE PASS</div>
        <div className="tt-gp-grid">
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Control No.</span>
            <input
              id="gp2_control_no"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "60.22%",
                top: "55.62%",
                width: "15.69%",
                height: "0.99%",
              }}
              value={values["gp2_control_no"] ?? ""}
              onChange={(e) => handle("gp2_control_no", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Date</span>
            <input
              id="gp2_date"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "79.27%",
                top: "55.62%",
                width: "15.69%",
                height: "0.99%",
              }}
              value={values["gp2_date"] ?? ""}
              onChange={(e) => handle("gp2_date", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Time Out</span>
            <input
              id="gp2_time_out"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "58.77%",
                top: "57.01%",
                width: "8.4%",
                height: "0.99%",
              }}
              value={values["gp2_time_out"] ?? ""}
              onChange={(e) => handle("gp2_time_out", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Time In</span>
            <input
              id="gp2_time_in"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "78.65%",
                top: "57.01%",
                width: "8.4%",
                height: "0.99%",
              }}
              value={values["gp2_time_in"] ?? ""}
              onChange={(e) => handle("gp2_time_in", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Personnel</span>
            <input
              id="gp2_personnel"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "62.13%",
                top: "58.39%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_personnel"] ?? ""}
              onChange={(e) => handle("gp2_personnel", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Position</span>
            <input
              id="gp2_position"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "61.01%",
                top: "60.97%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_position"] ?? ""}
              onChange={(e) => handle("gp2_position", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Division</span>
            <input
              id="gp2_division"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "61.01%",
                top: "62.48%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_division"] ?? ""}
              onChange={(e) => handle("gp2_division", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Destination</span>
            <input
              id="gp2_destination"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "61.85%",
                top: "64.06%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_destination"] ?? ""}
              onChange={(e) => handle("gp2_destination", e.target.value)}
            />
          </div>
          <div className="tt-gp-cell">
            <span className="tt-gp-label">Purpose</span>
            <input
              id="gp2_purpose"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "61.01%",
                top: "66.41%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_purpose"] ?? ""}
              onChange={(e) => handle("gp2_purpose", e.target.value)}
            />
          </div>
        </div>
        <div className="tt-gp-sigs">
          <div className="tt-gp-sig-cell">
            <input
              id="gp2_employee"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "88.97%",
                top: "70.86%",
                width: "11.2%",
                height: "0.99%",
              }}
              value={values["gp2_employee"] ?? ""}
              onChange={(e) => handle("gp2_employee", e.target.value)}
            />
            <div className="tt-sig-caption-small">Employee's Signature</div>
          </div>
          <div className="tt-gp-sig-cell">
            <input
              id="gp2_responsible"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "70.03%",
                top: "72.64%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_responsible"] ?? ""}
              onChange={(e) => handle("gp2_responsible", e.target.value)}
            />
            <div className="tt-sig-caption-small">Responsible Person</div>
          </div>
          <div className="tt-gp-sig-cell">
            <input
              id="gp2_approved"
              type="text"
              className="tt-field tt-underline tt-small"
              style={{
                left: "82.35%",
                top: "77.95%",
                width: "14.56%",
                height: "0.99%",
              }}
              value={values["gp2_approved"] ?? ""}
              onChange={(e) => handle("gp2_approved", e.target.value)}
            />
            <div className="tt-sig-caption-small">Approved By</div>
          </div>
        </div>
      </div>
    </div>
  );
}
