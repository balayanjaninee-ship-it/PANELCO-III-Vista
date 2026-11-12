import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Menu } from "lucide-react";
import "../styles/vehicle availability.css";
import "../styles/dashboard.css";
import "../styles/typography.css"; 

type Stage = 0 | 1 | 2 | 3;
type IconName =
  | "grid"
  | "calendar"
  | "car"
  | "clock"
  | "file"
  | "printer"
  | "activity"
  | "settings"
  | "users"
  | "search"
  | "bell"
  | "chevron"
  | "check"
  | "arrow"
  | "map"
  | "download"
  | "eye"
  | "edit"
  | "shield"
  | "menu"
  | "x";

const Icon = ({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) => {
  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    car: (
      <>
        <path d="M5 17h14l-1.5-6.2A2.4 2.4 0 0 0 15.2 9H8.8a2.4 2.4 0 0 0-2.3 1.8L5 17Z" />
        <path d="M4 17v2a1 1 0 0 0 1 1h1M20 17v2a1 1 0 0 1-1 1h-1M7 14h.01M17 14h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h4M9 13h6M9 17h6" />
      </>
    ),
    printer: (
      <>
        <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M7 14h10v7H7z" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    map: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    edit: (
      <>
        <path d="m14 4 6 6L8 22H2v-6L14 4Z" />
        <path d="m12 6 6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
};

const stages = ["Vehicle Selection", "Schedule Vehicle", "Trip Documents", "Review & Print"];
const vehicles = [
  {
    id: 1,
    name: "Toyota Hilux",
    model: "2.4 G 4×2 A/T",
    plate: "NBO 4831",
    type: "Pickup Truck",
    department: "ASD",
    status: "Available",
    statusClass: "green",
    image:
      "https://images.unsplash.com/photo-1661098970259-d89ea2105d72?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Toyota Hiace",
    model: "Commuter Deluxe",
    plate: "NCR 7218",
    type: "Passenger Van",
    department: "ISD",
    status: "Reserved",
    statusClass: "orange",
    image:
      "https://images.unsplash.com/photo-1587813369290-091c9d432daf?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Mitsubishi Montero",
    model: "Sport GLS 2WD",
    plate: "NIA 3056",
    type: "SUV",
    department: "FSD",
    status: "Currently In Use",
    statusClass: "blue",
    image:
      "https://images.unsplash.com/photo-1699143992194-500105ac412a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Isuzu D-Max",
    model: "LS 4×2 M/T",
    plate: "NDR 9154",
    type: "Pickup Truck",
    department: "CSD",
    status: "Under Maintenance",
    statusClass: "red",
    image:
      "https://images.unsplash.com/photo-1526626607369-f89fe1ed77a9?auto=format&fit=crop&w=900&q=80",
  },
];

const documentData = [
  {
    title: "Daily Driver's Trip Ticket",
    desc: "Driver, vehicle, route, purpose, and trip schedule details.",
    icon: "file" as IconName,
    color: "blue",
  },
  {
    title: "Gate Pass",
    desc: "Printed on the same sheet directly after the Daily Driver's Trip Ticket.",
    icon: "map" as IconName,
    color: "purple",
  },
  {
    title: "Daily Vehicle Inspection Checklist",
    desc: "Pre-trip mechanical and safety condition inspection.",
    icon: "shield" as IconName,
    color: "green",
  },
  {
    title: "Four-View Vehicle Sketch",
    desc: "Record scratches, dents, and visible vehicle damage.",
    icon: "car" as IconName,
    color: "orange",
  },
];

type SignStatus = "Pending" | "Signed" | "Approved" | "Rejected";
type Signatory = {
  name: string;
  position: string;
  department: string;
  role: string;
  action: "sign" | "approve";
  status: SignStatus;
  timestamp?: string;
  signature?: string;
};

const initialSignatories: Signatory[][] = [
  [
    {
      name: "Juan M. Dela Cruz",
      position: "Fleet Coordinator",
      department: "ISD",
      role: "Fleet Coordinator",
      action: "sign",
      status: "Pending",
    },
    {
      name: "Roberto A. Santos",
      position: "Authorized Driver",
      department: "FSD",
      role: "Driver",
      action: "sign",
      status: "Pending",
    },
    {
      name: "Engr. Maria L. Reyes",
      position: "Fleet Supervisor",
      department: "General Services",
      role: "Fleet Supervisor",
      action: "approve",
      status: "Pending",
    },
  ],
  [
    {
      name: "Roberto A. Santos",
      position: "Authorized Driver / Inspector",
      department: "FSD",
      role: "Driver",
      action: "sign",
      status: "Pending",
    },
    {
      name: "Juan M. Dela Cruz",
      position: "Fleet Coordinator",
      department: "ISD",
      role: "Fleet Coordinator",
      action: "approve",
      status: "Pending",
    },
  ],
  [
    {
      name: "Roberto A. Santos",
      position: "Authorized Driver",
      department: "FSD",
      role: "Driver",
      action: "sign",
      status: "Pending",
    },
    {
      name: "Juan M. Dela Cruz",
      position: "Fleet Coordinator / Witness",
      department: "ISD",
      role: "Fleet Coordinator",
      action: "sign",
      status: "Pending",
    },
  ],
  [
    {
      name: "Juan M. Dela Cruz",
      position: "Requesting Employee",
      department: "FSD",
      role: "Fleet Coordinator",
      action: "sign",
      status: "Pending",
    },
    {
      name: "Engr. Maria L. Reyes",
      position: "Fleet Supervisor",
      department: "General Services",
      role: "Fleet Supervisor",
      action: "approve",
      status: "Pending",
    },
    {
      name: "Lea P. Mendoza",
      position: "Duty Security Officer",
      department: "Security",
      role: "Security Officer",
      action: "sign",
      status: "Pending",
    },
  ],
];

const orderedSignatories = [
  initialSignatories[0],
  initialSignatories[3],
  initialSignatories[1],
  initialSignatories[2],
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stage, setStage] = useState<Stage>(0);
  const [maxStage, setMaxStage] = useState<Stage>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [preparedDocs, setPreparedDocs] = useState<boolean[]>([false, false, false, false]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [vehicleType, setVehicleType] = useState("All Types");
  const [availability, setAvailability] = useState("All Statuses");
  const [departureDate, setDepartureDate] = useState("2025-06-18");
  const [returnDate, setReturnDate] = useState("2025-06-18");
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState<number | null>(null);
  const [reservationSubmitted, setReservationSubmitted] = useState(false);
  const [toast, setToast] = useState("");

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selected) || vehicles[0];
  const completedDocs = preparedDocs;
  const hasConflict = departureDate === "2025-06-20" || returnDate === "2025-06-20";
  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) => {
        const term = search.toLowerCase();
        return (
          (!term || `${v.name} ${v.model} ${v.plate}`.toLowerCase().includes(term)) &&
          (department === "All Departments" || v.department === department) &&
          (vehicleType === "All Types" || v.type === vehicleType) &&
          (availability === "All Statuses" || v.status === availability)
        );
      }),
    [search, department, vehicleType, availability],
  );

  const goStage = (next: Stage) => {
    if (next <= maxStage) setStage(next);
  };
  const selectVehicle = (id: number) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle || vehicle.status !== "Available") return;
    setSelected(id);
    setMaxStage((current) => Math.max(current, 1) as Stage);
    setTimeout(() => setStage(1), 220);
  };
  const continueSchedule = () => {
    if (hasConflict) return;
    setMaxStage((current) => Math.max(current, 2) as Stage);
    setStage(2);
  };
  const prepareDocument = (index: number) => {
    setPreparedDocs((current) => {
      const next = current.map((value, i) => (i === index ? true : value));
      if (next.every(Boolean)) setMaxStage(3);
      return next;
    });
    setActiveModal(null);
    showToast("Document saved and ready for printing.");
  };
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  return (
    <Layout
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      stage={stage}
      maxStage={maxStage}
      onStageChange={(s) => goStage(s as Stage)}
    >
      <button
        className="mobile-menu fixed left-3 top-3 z-40 lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <main className="availability-content floating-menu">
        <section className="page-heading">
          <div>
            <div className="title-row">
              <h1 className="typo-headline-sm text-slate-900">Vehicle Availability</h1>
            </div>
            <p className="typo-label-sm text-slate-500">
              Select a vehicle, schedule your trip, and complete the required documents.
            </p>
          </div>
          <div className="reservation-id">
            <span>Reservation reference</span>
            <strong>VH-2025-0618-024</strong>
          </div>
        </section>

        <Progress stage={stage} maxStage={maxStage} goStage={goStage} />

        <section className="content-area">
          {stage === 0 && (
            <VehicleSelection
              selected={selected}
              filteredVehicles={filteredVehicles}
              search={search}
              setSearch={setSearch}
              department={department}
              setDepartment={setDepartment}
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              availability={availability}
              setAvailability={setAvailability}
              selectVehicle={selectVehicle}
              selectedVehicle={selectedVehicle}
              onContinue={() => selected && selectVehicle(selected)}
            />
          )}
          {stage === 1 && (
            <Schedule
              vehicle={selectedVehicle}
              departureDate={departureDate}
              setDepartureDate={setDepartureDate}
              returnDate={returnDate}
              setReturnDate={setReturnDate}
              conflict={hasConflict}
              onPrevious={() => setStage(0)}
              onContinue={continueSchedule}
            />
          )}
          {stage === 2 && (
            <Documents
              completed={completedDocs}
              prepared={preparedDocs}
              onOpen={setActiveModal}
              onPreview={setPreviewModal}
              onPrevious={() => setStage(1)}
              onContinue={() => completedDocs.every(Boolean) && setStage(3)}
            />
          )}
          {stage === 3 && (
            <Review
              vehicle={selectedVehicle}
              onEdit={() => setStage(1)}
              onPrevious={() => setStage(2)}
              showToast={showToast}
              signatories={orderedSignatories}
              submitted={reservationSubmitted}
              onSubmit={() => {
                setReservationSubmitted(true);
                showToast("Reservation record and PDF package created.");
              }}
            />
          )}
        </section>
      </main>
      {activeModal !== null && (
        <DocumentModal
          index={activeModal}
          onClose={() => setActiveModal(null)}
          onComplete={() => prepareDocument(activeModal)}
        />
      )}
      {previewModal !== null && (
        <PreviewModal
          index={previewModal}
          signatories={
            previewModal < 2
              ? [...orderedSignatories[0], ...orderedSignatories[1]]
              : orderedSignatories[previewModal]
          }
          onClose={() => setPreviewModal(null)}
        />
      )}
      {toast && (
        <div className="toast">
          <span className="toast-check">
            <Icon name="check" size={15} />
          </span>
          {toast}
        </div>
      )}
    </Layout>
  );
}

function Sidebar({
  stage,
  maxStage,
  goStage,
}: {
  stage: Stage;
  maxStage: Stage;
  goStage: (s: Stage) => void;
}) {
  const navigate = useNavigate();
  const nav = [
    ["Dashboard", "grid"],
    ["Vehicle Selection", "car"],
    ["Schedule Vehicle", "calendar"],
    ["Trip Documents", "file"],
    ["Review & Print", "printer"],
    ["Vehicle Monitoring", "activity"],
    ["Vehicle Management", "car"],
    ["User Management", "users"],
    ["Settings", "settings"],
  ] as [string, IconName][];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span>P</span>
          <i />
        </div>
        <div>
          <strong>PANELCO</strong>
          <span>VehicleHub</span>
        </div>
      </div>
      <div className="company-pill">
        <div className="company-icon">P3</div>
        <div>
          <span>Company workspace</span>
          <strong>PANELCO III</strong>
        </div>
      </div>
      <nav>
        <p className="nav-label">MAIN MENU</p>
        <button className="nav-item" onClick={() => navigate("/dashboard")}>
          <Icon name="grid" />
          <span>Dashboard</span>
        </button>
        <div className="nav-group">
          <button className="nav-item group-active">
            <Icon name="calendar" />
            <span>Vehicle Availability</span>
            <Icon name="chevron" size={14} className="rotate-90" />
          </button>
          <div className="subnav">
            {nav.slice(1, 5).map(([label], index) => {
              const locked = index > maxStage;
              const complete = index < stage || (index < maxStage && index !== stage);
              return (
                <button
                  key={label}
                  disabled={locked}
                  onClick={() => goStage(index as Stage)}
                  className={`subnav-item ${stage === index ? "active" : ""} ${locked ? "locked" : ""}`}
                >
                  <span className={`sub-dot ${complete ? "complete" : ""}`}>
                    {complete ? <Icon name="check" size={10} /> : index + 1}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="nav-label nav-section">OPERATIONS</p>
        {nav.slice(5).map(([label, icon]) => (
          <button className="nav-item" key={label}>
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <Icon name="shield" />
        <div>
          <strong>Planning module</strong>
          <p>Departure and return are recorded under Vehicle Monitoring.</p>
        </div>
      </div>
      <div className="sidebar-footer">
        <div className="system-dot" />
        <div>
          <strong>System operational</strong>
          <span>v2.4.1 · Internal use</span>
        </div>
      </div>
    </aside>
  );
}

function Progress({
  stage,
  maxStage,
  goStage,
}: {
  stage: Stage;
  maxStage: Stage;
  goStage: (s: Stage) => void;
}) {
  return (
    <section className="progress-card">
      {stages.map((label, index) => {
        const complete = index < stage || (index < maxStage && index !== stage);
        const locked = index > maxStage;
        return (
          <div className="progress-step-wrap" key={label}>
            <button
              disabled={locked}
              onClick={() => goStage(index as Stage)}
              className={`progress-step ${stage === index ? "active" : ""} ${complete ? "complete" : ""}`}
            >
              <span className="step-circle">
                {complete ? <Icon name="check" size={17} /> : index + 1}
              </span>
              <span className="step-copy">
                <small>STEP {index + 1}</small>
                <strong>{label}</strong>
              </span>
            </button>
            {index < 3 && <span className={`connector ${index < maxStage ? "filled" : ""}`} />}
          </div>
        );
      })}
    </section>
  );
}

function VehicleSelection(props: {
  selected: number | null;
  filteredVehicles: typeof vehicles;
  search: string;
  setSearch: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  availability: string;
  setAvailability: (v: string) => void;
  selectVehicle: (v: number) => void;
  selectedVehicle: (typeof vehicles)[number];
  onContinue: () => void;
}) {
  return (
    <>
      <div className="section-header">
        <div>
          <span className="eyebrow">STEP 1 OF 4</span>
          <h2>Choose an available vehicle</h2>
          <p>Only vehicles cleared for reservation can be selected.</p>
        </div>
        <span className="fleet-count">
          <strong>12</strong> fleet vehicles
        </span>
      </div>
      <div className="filter-card">
        <label className="search-field">
          <Icon name="search" />
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="Search vehicle name, model, or plate number..."
          />
        </label>
        <Select
          value={props.department}
          onChange={props.setDepartment}
          options={[
            "All Departments",
            "ASD",
            "ISD",
            "FSD",
            "CSD",
            "SAD",
          ]}
        />
        <Select
          value={props.vehicleType}
          onChange={props.setVehicleType}
          options={["All Types", "SUV/AUV", "Pick-up", "Passenger Van","Light Duty Truck", 
            "Heavy Duty Truck", "Commercial Utility Vehicle", "Special Purpose Vehicle", "Motorcycle", "Other"]}
        />
        <Select
          value={props.availability}
          onChange={props.setAvailability}
          options={[
            "All Statuses",
            "Available",
            "Reserved",
            "Currently In Use",
            "Under Maintenance",
          ]}
        />
      </div>
      <div className="results-line">
        <span>
          Showing <strong>{props.filteredVehicles.length}</strong> vehicles
        </span>
        <span>
          <i className="legend-dot available" /> Available for new reservation
        </span>
      </div>
      <div className="vehicle-grid">
        {props.filteredVehicles.map((vehicle) => {
          const disabled = vehicle.status !== "Available";
          return (
            <article
              className={`vehicle-card ${props.selected === vehicle.id ? "selected" : ""}`}
              key={vehicle.id}
            >
              <div className="vehicle-image">
                <img src={vehicle.image} alt={`${vehicle.name} company vehicle`} />
                <span className={`status-badge ${vehicle.statusClass}`}>
                  <i />
                  {vehicle.status}
                </span>
                <span className="vehicle-number">UNIT {String(vehicle.id).padStart(2, "0")}</span>
              </div>
              <div className="vehicle-info">
                <div>
                  <h3>{vehicle.name}</h3>
                  <p>{vehicle.model}</p>
                </div>
                <div className="vehicle-meta">
                  <span>
                    <small>PLATE NUMBER</small>
                    <strong>{vehicle.plate}</strong>
                  </span>
                  <span>
                    <small>VEHICLE TYPE</small>
                    <strong>{vehicle.type}</strong>
                  </span>
                </div>
                <div className="department-row">
                  <span className="dept-icon">
                    <Icon name="grid" size={14} />
                  </span>
                  <span>
                    <small>Assigned department</small>
                    <strong>{vehicle.department}</strong>
                  </span>
                </div>
                <button
                  disabled={disabled}
                  onClick={() => props.selectVehicle(vehicle.id)}
                  className={`select-button ${disabled ? "disabled" : ""}`}
                >
                  {disabled ? (
                    vehicle.status === "Reserved" ? (
                      "View reservation"
                    ) : (
                      "Not available"
                    )
                  ) : (
                    <>
                      Select Vehicle <Icon name="arrow" size={16} />
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {props.selected && (
        <SelectedVehiclePanel vehicle={props.selectedVehicle} onContinue={props.onContinue} />
      )}
      <div className="policy-note">
        <Icon name="shield" />
        <div>
          <strong>Reservation policy</strong>
          <p>
            A selected vehicle is not considered dispatched. Actual departure and return must be
            recorded separately under Vehicle Monitoring.
          </p>
        </div>
      </div>
    </>
  );
}

function SelectedVehiclePanel({
  vehicle,
  onContinue,
}: {
  vehicle: (typeof vehicles)[number];
  onContinue: () => void;
}) {
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div className="selected-panel">
      <div className="selected-summary">
        <span className="eyebrow">SELECTED VEHICLE</span>
        <h3>{vehicle.name}</h3>
        <p>
          {vehicle.model} · {vehicle.plate}
        </p>
        <div className="summary-chip">
          <Icon name="check" size={14} /> Available for reservation
        </div>
      </div>
      <div className="mini-calendar">
        <div className="calendar-head">
          <div>
            <strong>June 2025</strong>
            <span>Vehicle availability</span>
          </div>
          <div className="calendar-legend">
            <span>
              <i className="available" />
              Available
            </span>
            <span>
              <i className="reserved" />
              Reserved
            </span>
            <span>
              <i className="unavailable" />
              Unavailable
            </span>
          </div>
        </div>
        <div className="calendar-grid weekday">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {dates.map((d) => (
            <span
              key={d}
              className={`${[7, 8, 14, 15, 21, 22, 28, 29].includes(d) ? "off" : ""} ${[12, 13, 20].includes(d) ? "booked" : ""}`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      <button className="primary-button" onClick={onContinue}>
        Continue to Schedule <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}

function Schedule({
  vehicle,
  departureDate,
  setDepartureDate,
  returnDate,
  setReturnDate,
  conflict,
  onPrevious,
  onContinue,
}: {
  vehicle: (typeof vehicles)[number];
  departureDate: string;
  setDepartureDate: (v: string) => void;
  returnDate: string;
  setReturnDate: (v: string) => void;
  conflict: boolean;
  onPrevious: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="section-header">
        <div>
          <span className="eyebrow">STEP 2 OF 4</span>
          <h2>Schedule vehicle reservation</h2>
          <p>Complete all required trip and schedule information.</p>
        </div>
        <span className="pending-badge">Pending reservation</span>
      </div>
      <div className="selected-vehicle-bar">
        <img src={vehicle.image} alt="Selected vehicle" />
        <div>
          <span>SELECTED VEHICLE</span>
          <h3>
            {vehicle.name} <small>{vehicle.model}</small>
          </h3>
          <p>
            {vehicle.plate} · {vehicle.type} · {vehicle.department}
          </p>
        </div>
        <span className="status-badge green">
          <i />
          Available
        </span>
        <button onClick={onPrevious}>Change vehicle</button>
      </div>
      <div className="form-layout">
        <div className="form-card">
          <FormTitle icon="users" title="Trip Information" subtitle="Who is traveling and why" />
          <div className="form-grid">
            <Field label="Requesting employee" required>
              <input defaultValue="Juan M. Dela Cruz" />
            </Field>
            <Field label="Department" required>
              <select defaultValue="Engineering">
                <option>ASD</option>
                <option>ISD</option>
                <option>FSD</option>
                <option>CSD</option>
                <option>SAD</option>
              </select> 
            </Field>
            <Field label="Driver's name" required>
              <input defaultValue="Roberto A. Santos" />
            </Field>
            <Field label="Destination" required>
              <div className="input-icon">
                <Icon name="map" size={16} />
                <input defaultValue="Urdaneta City Substation" />
              </div>
            </Field>
            <Field label="Purpose of travel" required wide>
              <textarea defaultValue="Routine inspection and maintenance coordination for distribution equipment." />
            </Field>
            <Field label="Number of passengers" required>
              <input type="number" defaultValue="3" min="1" />
            </Field>
          </div>
        </div>
        <div className="form-card">
          <FormTitle
            icon="calendar"
            title="Schedule Information"
            subtitle="Requested reservation period"
          />
          <div className="form-grid schedule-grid">
            <Field label="Departure date" required>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </Field>
            <Field label="Departure time" required>
              <input type="time" defaultValue="07:30" />
            </Field>
            <Field label="Expected return date" required>
              <input
                type="date"
                value={returnDate}
                min={departureDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </Field>
            <Field label="Expected return time" required>
              <input type="time" defaultValue="17:00" />
            </Field>
          </div>
          {conflict ? (
            <div className="conflict warning">
              <Icon name="clock" />
              <div>
                <strong>Schedule conflict detected</strong>
                <p>
                  This vehicle has an approved reservation on June 20. Select a different date or
                  vehicle to continue.
                </p>
              </div>
            </div>
          ) : (
            <div className="conflict success">
              <Icon name="check" />
              <div>
                <strong>No schedule conflicts found</strong>
                <p>The selected vehicle is available for the requested date and time.</p>
              </div>
            </div>
          )}
          <div className="approval-note">
            <strong>Approval reminder</strong>
            <p>
              Submitting a request creates a pending reservation. It must be approved before it
              blocks other pending requests.
            </p>
          </div>
        </div>
      </div>
      <div className="actions-bar">
        <button className="secondary-button" onClick={onPrevious}>
          <Icon name="arrow" size={16} className="flip" /> Previous
        </button>
        <div>
          <span>
            All fields marked <b>*</b> are required
          </span>
          <button disabled={conflict} className="primary-button" onClick={onContinue}>
            Continue to Documents <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function Documents({
  completed,
  prepared,
  onOpen,
  onPreview,
  onPrevious,
  onContinue,
}: {
  completed: boolean[];
  prepared: boolean[];
  onOpen: (i: number) => void;
  onPreview: (i: number) => void;
  onPrevious: () => void;
  onContinue: () => void;
}) {
  const count = completed.filter(Boolean).length;
  const [mobileDocument, setMobileDocument] = useState(0);
  const previousDocument = () => setMobileDocument((current) => Math.max(0, current - 1));
  const nextDocument = () =>
    setMobileDocument((current) => Math.min(documentData.length - 1, current + 1));
  return (
    <>
      <div className="section-header">
        <div>
          <span className="eyebrow">STEP 3 OF 4</span>
          <h2>Complete trip documents</h2>
          <p>Prepare each document for printing and handwritten signatures.</p>
        </div>
        <span className="pending-badge">Print-ready documents</span>
      </div>
      <div className="doc-progress-card">
        <div
          className="progress-ring"
          style={{ "--progress": `${count * 25}%` } as React.CSSProperties}
        >
          <span>
            {count}
            <small>/ 4</small>
          </span>
        </div>
        <div className="doc-progress-copy">
          <div>
            <h3>Document completion</h3>
            <strong>{count * 25}% complete</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${count * 25}%` }} />
          </div>
          <p>
            {count === 4
              ? "All required documents are ready for review."
              : `${4 - count} required document${4 - count === 1 ? "" : "s"} remaining`}
          </p>
        </div>
        <div className="document-tip">
          <Icon name="shield" />
          <span>
            <strong>Required before departure</strong>These records become part of the permanent
            trip file.
          </span>
        </div>
      </div>
      <div className="mobile-document-pager">
        <div>
          <span>
            DOCUMENT {mobileDocument + 1} OF {documentData.length}
          </span>
          <strong>{documentData[mobileDocument].title}</strong>
        </div>
        <div className="mobile-page-dots">
          {documentData.map((doc, index) => (
            <button
              key={doc.title}
              className={index === mobileDocument ? "active" : ""}
              onClick={() => setMobileDocument(index)}
              aria-label={`Open ${doc.title}`}
            />
          ))}
        </div>
      </div>
      <div className="documents-list">
        {documentData.map((doc, index) => (
          <article
            className={`document-card ${completed[index] ? "done" : ""} ${index === mobileDocument ? "mobile-active" : ""}`}
            key={doc.title}
          >
            <div className="document-main-row">
              <div className={`document-icon ${doc.color}`}>
                <Icon name={doc.icon} size={22} />
              </div>
              <div className="document-copy">
                <span>
                  DOCUMENT {index + 1}
                  {index < 2 && <i className="shared-sheet-label">ONE PRINTED SHEET</i>}
                </span>
                <h3>{doc.title}</h3>
                <p>{doc.desc}</p>
              </div>
              <div className={`completion-status ${completed[index] ? "complete" : ""}`}>
                {completed[index] ? (
                  <>
                    <Icon name="check" size={14} /> Ready to print
                  </>
                ) : (
                  <>
                    <span /> Draft
                  </>
                )}
              </div>
              <div className="document-actions">
                <button className="preview-button" onClick={() => onPreview(index)}>
                  <Icon name="eye" size={16} /> Preview
                </button>
                <button
                  className={prepared[index] ? "edit-button" : "complete-button"}
                  onClick={() => onOpen(index)}
                >
                  <Icon name={prepared[index] ? "edit" : "arrow"} size={16} />
                  {prepared[index] ? "Edit form" : "Prepare form"}
                </button>
              </div>
            </div>
            <div className="workflow-labels">
              <span className={prepared[index] ? "active" : ""}>
                <i>1</i> Document prepared
              </span>
              <b />
              <span className={prepared[index] ? "active" : ""}>
                <i>2</i> Ready for printing
              </span>
              <b />
              <span>
                <i>3</i> Signatures after print
              </span>
            </div>
            <div className="signatory-list">
              {orderedSignatories[index].map((signer) => (
                <div className="signatory-row print-only" key={`${signer.name}-${signer.position}`}>
                  <div className="signer-avatar">
                    {signer.name
                      .split(" ")
                      .filter((part) => part.length > 1)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div className="signer-identity">
                    <strong>{signer.name}</strong>
                    <span>{signer.position}</span>
                    <small>{signer.department}</small>
                  </div>
                  <div className="signature-field">
                    <span>Signature over printed name</span>
                    <strong className="print-line">&nbsp;</strong>
                  </div>
                  <div className="printed-date-field">
                    <span>Date signed</span>
                    <strong className="print-line">&nbsp;</strong>
                  </div>
                  <div className="signature-method">
                    <Icon name="printer" size={14} />
                    Sign after printing
                  </div>
                </div>
              ))}
            </div>
            {!prepared[index] && (
              <div className="signature-lock">
                <Icon name="printer" size={14} /> Signature and date fields remain blank for
                handwritten completion after printing.
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="mobile-document-navigation">
        <button
          className="mobile-back-button"
          disabled={mobileDocument === 0}
          onClick={previousDocument}
        >
          <Icon name="arrow" size={15} className="flip" /> Previous
        </button>
        {mobileDocument > 0 && (
          <button className="mobile-first-button" onClick={() => setMobileDocument(0)}>
            Back to first
          </button>
        )}
        <button
          className="mobile-next-button"
          disabled={mobileDocument === documentData.length - 1}
          onClick={nextDocument}
        >
          Next <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="actions-bar">
        <button className="secondary-button" onClick={onPrevious}>
          <Icon name="arrow" size={16} className="flip" /> Previous
        </button>
        <div>
          <span>
            {count < 4 ? "Complete all required documents to continue" : "All documents complete"}
          </span>
          <button disabled={count < 4} className="primary-button" onClick={onContinue}>
            Review Reservation <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function Review({
  vehicle,
  onEdit,
  onPrevious,
  showToast,
  signatories,
  submitted,
  onSubmit,
}: {
  vehicle: (typeof vehicles)[number];
  onEdit: () => void;
  onPrevious: () => void;
  showToast: (s: string) => void;
  signatories: Signatory[][];
  submitted: boolean;
  onSubmit: () => void;
}) {
  if (submitted) {
    return <ReservationRecord vehicle={vehicle} onBack={onPrevious} showToast={showToast} />;
  }
  return (
    <>
      <div className="section-header">
        <div>
          <span className="eyebrow">STEP 4 OF 4</span>
          <h2>Review & print reservation</h2>
          <p>Confirm the information below before submitting for approval.</p>
        </div>
        <span className="ready-badge">
          <Icon name="check" size={14} /> Ready for submission
        </span>
      </div>
      <div className="review-notice">
        <Icon name="shield" />
        <div>
          <strong>Final review</strong>
          <p>
            This will submit a <b>pending reservation</b> for approval. The vehicle is not yet
            authorized to depart.
          </p>
        </div>
      </div>
      <div className="review-grid">
        <div className="review-main">
          <ReviewSection title="Vehicle Information" icon="car" onEdit={onEdit}>
            <div className="vehicle-review">
              <img src={vehicle.image} alt={vehicle.name} />
              <div>
                <h3>{vehicle.name}</h3>
                <p>{vehicle.model}</p>
                <span className="status-badge green">
                  <i />
                  Available when scheduled
                </span>
              </div>
              <Info label="Plate number" value={vehicle.plate} />
              <Info label="Assigned department" value={vehicle.department} />
            </div>
          </ReviewSection>
          <ReviewSection title="Trip Information" icon="map" onEdit={onEdit}>
            <div className="info-grid">
              <Info label="Requesting employee" value="Juan M. Dela Cruz" />
              <Info label="Driver" value="Roberto A. Santos" />
              <Info label="Destination" value="Urdaneta City Substation" />
              <Info label="Purpose" value="Routine inspection and maintenance coordination" />
              <Info label="Departure" value="June 18, 2025 · 7:30 AM" />
              <Info label="Expected return" value="June 18, 2025 · 5:00 PM" />
            </div>
          </ReviewSection>
          <ReviewSection title="Document Summary" icon="file">
            <div className="summary-docs">
              {documentData.map((doc, i) => (
                <div key={doc.title}>
                  <span className="doc-check">
                    <Icon name="check" size={14} />
                  </span>
                  <span>
                    <small>DOCUMENT {i + 1}</small>
                    <strong>{doc.title}</strong>
                  </span>
                  <button onClick={() => showToast(`${doc.title} preview opened`)}>
                    <Icon name="eye" size={16} /> View
                  </button>
                </div>
              ))}
            </div>
          </ReviewSection>
          <ReviewSection title="Printable Signature Fields" icon="printer">
            <div className="review-signatures">
              {documentData.map((doc, docIndex) => (
                <div className="review-signature-group" key={doc.title}>
                  <div>
                    <span>DOCUMENT {docIndex + 1}</span>
                    <strong>{doc.title}</strong>
                  </div>
                  {signatories[docIndex].map((signer) => (
                    <div className="review-signer" key={`${doc.title}-${signer.name}`}>
                      <p>
                        <strong>{signer.name}</strong>
                        <small>
                          {signer.position} · {signer.department}
                        </small>
                      </p>
                      <span className="blank-review-line">Signature</span>
                      <span className="blank-review-line">Date</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ReviewSection>
        </div>
        <aside className="print-panel">
          <div className="print-heading">
            <span>
              <Icon name="file" size={21} />
            </span>
            <div>
              <h3>Submission package</h3>
              <p>The PDF and official record are created when you submit.</p>
            </div>
          </div>
          <button className="print-primary" onClick={() => showToast("Document preview prepared")}>
            <Icon name="eye" /> Preview Documents<span>4 documents</span>
          </button>
          <div className="submit-package-step">
            <span>
              <Icon name="file" size={15} />
            </span>
            <p>
              <strong>PDF package</strong>Generated automatically on submission
            </p>
          </div>
          <div className="submit-package-step">
            <span>
              <Icon name="shield" size={15} />
            </span>
            <p>
              <strong>Reservation record</strong>Saved to the permanent trip records
            </p>
          </div>
          <div className="printing-locked-note">
            <Icon name="printer" size={15} />
            Printing becomes available from the saved record.
          </div>
          <div className="packet-meta">
            <div>
              <span>Packet ID</span>
              <strong>VH-2025-0618-024</strong>
            </div>
            <div>
              <span>Pages</span>
              <strong>8 pages</strong>
            </div>
            <div>
              <span>Prepared</span>
              <strong>June 16, 2025</strong>
            </div>
          </div>
        </aside>
      </div>
      <div className="actions-bar final-actions">
        <div>
          <button className="secondary-button" onClick={onPrevious}>
            <Icon name="arrow" size={16} className="flip" /> Previous
          </button>
          <button className="secondary-button" onClick={onEdit}>
            <Icon name="edit" size={16} /> Edit Reservation
          </button>
        </div>
        <div>
          <span>Routes to Fleet Supervisor for approval</span>
          <button className="submit-button" onClick={onSubmit}>
            <Icon name="check" size={17} /> Submit & Create Record
          </button>
        </div>
      </div>
    </>
  );
}

function ReservationRecord({
  vehicle,
  onBack,
  showToast,
}: {
  vehicle: (typeof vehicles)[number];
  onBack: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <>
      <div className="record-success">
        <span className="record-success-icon">
          <Icon name="check" size={24} />
        </span>
        <div>
          <span>RESERVATION SUBMITTED</span>
          <h2>Record and PDF package created</h2>
          <p>
            The reservation has been saved to Trip Records. Documents can now be printed from this
            official record.
          </p>
        </div>
        <span className="pending-badge">Pending approval</span>
      </div>

      <div className="record-layout">
        <section className="saved-record-card">
          <div className="saved-record-head">
            <div>
              <span>OFFICIAL RESERVATION RECORD</span>
              <h3>VH-2025-0618-024</h3>
            </div>
            <span className="recorded-badge">
              <Icon name="shield" size={14} /> Recorded
            </span>
          </div>
          <div className="record-details-grid">
            <Info label="Vehicle" value={`${vehicle.name} · ${vehicle.plate}`} />
            <Info label="Driver" value="Roberto A. Santos" />
            <Info label="Destination" value="Urdaneta City Substation" />
            <Info label="Trip schedule" value="June 18, 2025 · 7:30 AM–5:00 PM" />
            <Info label="Submitted by" value="Juan M. Dela Cruz" />
            <Info label="Record created" value="June 16, 2025 · 2:42 PM" />
          </div>
          <div className="record-history">
            <div className="history-step done">
              <span>
                <Icon name="check" size={13} />
              </span>
              <p>
                <strong>Reservation submitted</strong>
                <small>June 16, 2025 · 2:42 PM</small>
              </p>
            </div>
            <i />
            <div className="history-step done">
              <span>
                <Icon name="file" size={13} />
              </span>
              <p>
                <strong>PDF package generated</strong>
                <small>4 documents · 8 pages</small>
              </p>
            </div>
            <i />
            <div className="history-step">
              <span>
                <Icon name="clock" size={13} />
              </span>
              <p>
                <strong>Awaiting approval</strong>
                <small>Fleet Supervisor</small>
              </p>
            </div>
          </div>
        </section>

        <aside className="record-file-card">
          <div className="pdf-file-preview">
            <span>
              <Icon name="file" size={26} />
            </span>
            <div>
              <small>GENERATED PDF</small>
              <strong>VH-2025-0618-024.pdf</strong>
              <p>8 pages · 1.8 MB · Archived</p>
            </div>
          </div>
          <div className="record-file-list">
            <span>
              <Icon name="check" size={13} /> Daily Driver’s Trip Ticket + Gate Pass
            </span>
            <span>
              <Icon name="check" size={13} /> Vehicle Inspection Checklist
            </span>
            <span>
              <Icon name="check" size={13} /> Four-View Vehicle Sketch
            </span>
          </div>
          <button
            className="record-print-button"
            onClick={() => {
              showToast("Opening saved record for printing.");
              window.setTimeout(() => window.print(), 350);
            }}
          >
            <Icon name="printer" size={17} /> Print Saved Documents
          </button>
          <button
            className="record-download-button"
            onClick={() => showToast("Saved PDF download started.")}
          >
            <Icon name="download" size={17} /> Download PDF Record
          </button>
          <p className="record-file-note">
            Printing and downloads use the archived PDF so the saved record always matches the
            physical documents.
          </p>
        </aside>
      </div>

      <div className="actions-bar record-actions">
        <button className="secondary-button" onClick={onBack}>
          <Icon name="arrow" size={16} className="flip" /> Back to Documents
        </button>
        <div>
          <span>Record location: Trip Records / 2025 / June</span>
          <button
            className="primary-button"
            onClick={() => showToast("Reservation record opened.")}
          >
            <Icon name="file" size={16} /> Open Record
          </button>
        </div>
      </div>
    </>
  );
}

function DocumentModal({
  index,
  onClose,
  onComplete,
}: {
  index: number;
  onClose: () => void;
  onComplete: () => void;
}) {
  const doc = documentData[index];
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className={`document-icon ${doc.color}`}>
            <Icon name={doc.icon} />
          </div>
          <div>
            <span>REQUIRED DOCUMENT {index + 1} OF 4</span>
            <h2>{doc.title}</h2>
          </div>
          <button onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          {index === 0 && (
            <div className="modal-form-grid">
              <Field label="Driver's name">
                <input defaultValue="Roberto A. Santos" />
              </Field>
              <Field label="Vehicle">
                <input defaultValue="Toyota Hilux · NBO 4831" />
              </Field>
              <Field label="Destination">
                <input defaultValue="Urdaneta City Substation" />
              </Field>
              <Field label="Trip purpose">
                <input defaultValue="Routine inspection" />
              </Field>
              <Field label="Departure schedule">
                <input defaultValue="June 18, 2025 · 7:30 AM" />
              </Field>
              <Field label="Expected return">
                <input defaultValue="June 18, 2025 · 5:00 PM" />
              </Field>
            </div>
          )}
          {index === 2 && (
            <div className="checklist">
              {[
                "Tire condition and pressure",
                "Brakes and parking brake",
                "Headlights, signals, and brake lights",
                "Horn and warning devices",
                "Side and rear-view mirrors",
                "Windshield and wipers",
                "Engine oil, coolant, and brake fluid",
                "Seatbelts and other safety conditions",
              ].map((item) => (
                <label key={item}>
                  <input type="checkbox" defaultChecked />
                  <span>
                    <Icon name="check" size={13} />
                  </span>
                  {item}
                  <select defaultValue="Good">
                    <option>Good</option>
                    <option>Needs attention</option>
                  </select>
                </label>
              ))}
            </div>
          )}
          {index === 3 && (
            <div>
              <div className="sketch-instruction">
                <Icon name="edit" /> Click a vehicle view to place a damage marker. No existing
                damage has been recorded.
              </div>
              <div className="sketch-grid">
                {["FRONT VIEW", "REAR VIEW", "LEFT-SIDE VIEW", "RIGHT-SIDE VIEW"].map((view) => (
                  <button key={view}>
                    <span className="car-sketch">
                      <Icon name="car" size={58} />
                    </span>
                    <strong>{view}</strong>
                    <small>Click to mark damage</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {index === 1 && (
            <div className="modal-form-grid">
              <Field label="Vehicle information">
                <input defaultValue="Toyota Hilux · NBO 4831" />
              </Field>
              <Field label="Driver information">
                <input defaultValue="Roberto A. Santos" />
              </Field>
              <Field label="Department">
                <input defaultValue="Engineering" />
              </Field>
              <Field label="Destination">
                <input defaultValue="Urdaneta City Substation" />
              </Field>
              <Field label="Trip date and time">
                <input defaultValue="June 18, 2025 · 7:30 AM" />
              </Field>
              <Field label="Authorizing supervisor">
                <input placeholder="To be signed upon approval" />
              </Field>
            </div>
          )}
          <label className="certify">
            <input type="checkbox" defaultChecked />
            <span>
              <Icon name="check" size={13} />
            </span>
            <p>I certify that the information provided is complete and accurate.</p>
          </label>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={onComplete}>
            <Icon name="check" size={16} /> Save Document
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  index,
  signatories,
  onClose,
}: {
  index: number;
  signatories: Signatory[];
  onClose: () => void;
}) {
  const isCombinedSheet = index < 2;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal preview-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="document-icon blue">
            <Icon name="eye" />
          </div>
          <div>
            <span>DOCUMENT PREVIEW</span>
            <h2>
              {isCombinedSheet
                ? "Daily Driver's Trip Ticket & Gate Pass"
                : documentData[index].title}
            </h2>
          </div>
          <button onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="paper-preview">
          <div className="paper-brand">
            <div className="brand-mark mini">
              <span>P</span>
            </div>
            <div>
              <strong>PANGASINAN III ELECTRIC COOPERATIVE</strong>
              <span>PANELCO III · VehicleHub</span>
            </div>
            <small>VH-2025-0618-024</small>
          </div>
          <h2>
            {isCombinedSheet
              ? "DAILY DRIVER'S TRIP TICKET"
              : documentData[index].title.toUpperCase()}
          </h2>
          <div className="preview-lines">
            {Array.from({ length: isCombinedSheet ? 4 : 9 }, (_, i) => (
              <div key={i}>
                <span />
                <span />
              </div>
            ))}
          </div>
          {isCombinedSheet && (
            <>
              <div className="combined-document-divider">
                <span>SAME PRINTED SHEET</span>
                <h2>GATE PASS</h2>
              </div>
              <div className="preview-lines compact">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i}>
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="signature-lines">
            {signatories.map((signer, signerIndex) => (
              <span key={`${signer.name}-${signerIndex}`}>
                <b>&nbsp;</b>
                {signer.name}
                <small>{signer.position} · Date: __________________</small>
              </span>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Close Preview
          </button>
          <button className="primary-button">
            <Icon name="printer" size={16} /> Print Document
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="select-field">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <Icon name="chevron" size={15} className="rotate-90" />
    </label>
  );
}
function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      {children}
    </label>
  );
}
function FormTitle({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return (
    <div className="form-title">
      <span>
        <Icon name={icon} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function ReviewSection({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: IconName;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="review-section">
      <div className="review-section-head">
        <div>
          <span>
            <Icon name={icon} size={18} />
          </span>
          <h3>{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit}>
            <Icon name="edit" size={15} /> Edit
          </button>
        )}
      </div>
      <div className="review-section-body">{children}</div>
    </section>
  );
}

export default App;
