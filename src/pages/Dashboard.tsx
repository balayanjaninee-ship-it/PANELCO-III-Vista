import { useMemo, useState, useEffect, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/dashboard.css";
import "../styles/typography.css";
import { useAuth, UserRole } from "../context/AuthContext";
import {
  Bell,
  CalendarClock,
  CarFront,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TicketCheck,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

type VehicleStatus = "Available" | "Reserved" | "In Use" | "Under Maintenance";
type OrderStatus =
  | "Pending Approval"
  | "Approved"
  | "Scheduled"
  | "Departed"
  | "Returned"
  | "Completed"
  | "Rejected";
type TripStatus = "Awaiting Departure" | "Departed" | "Returned" | "Completed";

const fullSummary = [
  {
    label: "Total Vehicles",
    value: "24",
    note: "All registered company vehicles",
    icon: Truck,
    tone: "navy",
  },
  {
    label: "Available Vehicles",
    value: "14",
    note: "Ready for scheduling",
    icon: CarFront,
    tone: "green",
  },
  {
    label: "Reserved Vehicles",
    value: "3",
    note: "Approved upcoming schedules",
    icon: CalendarClock,
    tone: "purple",
  },
  {
    label: "Currently In Use",
    value: "7",
    note: "On active trips",
    icon: Gauge,
    tone: "blue",
  },
];

const personnelSummary = [
  {
    label: "Available Vehicles",
    value: "14",
    note: "Ready for scheduling",
    icon: CarFront,
    tone: "green",
  },
  {
    label: "Currently In Use",
    value: "7",
    note: "On active trips",
    icon: Gauge,
    tone: "blue",
  },
];

const fullVehicles: {
  vehicle: string;
  plate: string;
  department: string;
  status: VehicleStatus;
  driver: string;
  schedule: string;
}[] = [
  {
    vehicle: "Toyota HiAce GL",
    plate: "NCE 4721",
    department: "General Services",
    status: "Available",
    driver: "—",
    schedule: "Open today",
  },
  {
    vehicle: "Mitsubishi Strada",
    plate: "NCI 8534",
    department: "Engineering",
    status: "In Use",
    driver: "Ramon Dela Cruz",
    schedule: "Returns 4:30 PM",
  },
  {
    vehicle: "Toyota Innova",
    plate: "NCR 2186",
    department: "Finance",
    status: "Reserved",
    driver: "Joel Mendoza",
    schedule: "Today, 1:00 PM",
  },
  {
    vehicle: "Isuzu D-Max",
    plate: "NCO 6912",
    department: "Operations",
    status: "Under Maintenance",
    driver: "—",
    schedule: "Until Jun 20",
  },
];

const fullTravelOrders: {
  number: string;
  department: string;
  destination: string;
  vehicle: string;
  date: string;
  status: OrderStatus;
}[] = [
  {
    number: "TO-2025-0618-014",
    department: "Engineering",
    destination: "Calatrava Substation",
    vehicle: "Toyota Innova",
    date: "Jun 18, 2025",
    status: "Approved",
  },
  {
    number: "TO-2025-0618-015",
    department: "Operations",
    destination: "San Carlos Service Area",
    vehicle: "Toyota HiAce GL",
    date: "Jun 18, 2025",
    status: "Pending Approval",
  },
  {
    number: "TO-2025-0619-003",
    department: "Finance",
    destination: "Bacolod Main Office",
    vehicle: "Mitsubishi Strada",
    date: "Jun 19, 2025",
    status: "Scheduled",
  },
];

const personnelTravelOrders = fullTravelOrders.filter(
  (o) => o.status === "Pending Approval" || o.status === "Approved",
);

const fullGatePasses: {
  pass: string;
  order: string;
  vehicle: string;
  plate: string;
  driver: string;
  scheduled: string;
  departure: string;
  arrival: string;
  status: TripStatus;
}[] = [
  {
    pass: "GP-2025-0187",
    order: "TO-2025-0618-009",
    vehicle: "Mitsubishi Strada",
    plate: "NCI 8534",
    driver: "Ramon Dela Cruz",
    scheduled: "Jun 18 · 7:30 AM",
    departure: "7:42 AM",
    arrival: "—",
    status: "Departed",
  },
  {
    pass: "GP-2025-0186",
    order: "TO-2025-0618-006",
    vehicle: "Toyota Hilux",
    plate: "NCP 7482",
    driver: "Ernesto Villanueva",
    scheduled: "Jun 18 · 6:45 AM",
    departure: "6:48 AM",
    arrival: "11:36 AM",
    status: "Returned",
  },
];

const fullUpcomingSchedules = [
  {
    vehicle: "Toyota Innova",
    plate: "NCR 2186",
    driver: "Joel Mendoza",
    department: "Finance",
    scheduleDate: "Jun 18, 2025",
    expectedReturn: "Jun 18, 5:00 PM",
    status: "Reserved" as const,
  },
  {
    vehicle: "Toyota HiAce GL",
    plate: "NCE 4721",
    driver: "Ramon Dela Cruz",
    department: "General Services",
    scheduleDate: "Jun 19, 2025",
    expectedReturn: "Jun 19, 4:00 PM",
    status: "Scheduled" as const,
  },
];

const fullActiveTrips = [
  {
    vehicle: "Mitsubishi Strada",
    plate: "NCI 8534",
    driver: "Ramon Dela Cruz",
    destination: "Calatrava Substation",
    actualDeparture: "7:42 AM",
    expectedReturn: "4:30 PM",
    status: "Departed" as const,
  },
];

const fullPendingTasks = [
  { label: "Pending scheduling requests", count: 2, icon: ClipboardList, tone: "orange" },
  { label: "Incomplete trip documents", count: 1, icon: FileText, tone: "orange" },
  { label: "Overdue vehicle returns", count: 1, icon: CalendarClock, tone: "red" },
  { label: "Upcoming vehicle maintenance", count: 3, icon: Wrench, tone: "blue" },
];

const personnelPendingTasks = [
  { label: "Pending scheduling requests", count: 2, icon: ClipboardList, tone: "orange" },
  { label: "Incomplete trip documents", count: 1, icon: FileText, tone: "orange" },
];

const fullActions = [
  { label: "Check Vehicle Availability", icon: CalendarClock },
  { label: "Create Trip Ticket", icon: TicketCheck },
  { label: "Generate Gate Pass", icon: ShieldCheck },
  { label: "Submit Vehicle Inspection", icon: ClipboardCheck },
];

function StatusBadge({ status }: { status: VehicleStatus | OrderStatus | TripStatus }) {
  return (
    <span className={`status-badge typo-label-sm status-${status.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
  onLink,
}: {
  title: string;
  subtitle?: string;
  link?: string;
  onLink?: () => void;
}) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-4">
      <div>
        <h2 className="typo-title-sm text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 typo-label-sm text-slate-400">{subtitle}</p>}
      </div>
      {link && (
        <button className="section-link" onClick={onLink}>
          {link}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

function ActionMenu({ onAction }: { onAction: (message: string) => void }) {
  return (
    <button
      className="table-action"
      onClick={() => onAction("Record details opened")}
      aria-label="Open details"
    >
      <MoreHorizontal size={16} />
    </button>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userRole = user?.role;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  // Role-based data selection
  const summary = userRole === "Personnel" ? personnelSummary : fullSummary;
  const travelOrders =
    userRole === "Personnel" ? personnelTravelOrders : fullTravelOrders;
  const upcomingSchedules =
    userRole === "Personnel" ? fullUpcomingSchedules : fullUpcomingSchedules;
  const activeTrips =
    userRole === "Personnel" ? fullActiveTrips : fullActiveTrips;
  const pendingTasks =
    userRole === "Personnel" ? personnelPendingTasks : fullPendingTasks;
  const dashboardActions: {
    label: string;
    icon: ElementType;
  }[] =
    userRole === "Personnel"
      ? fullActions.filter((a) => a.label !== "Generate Gate Pass")
      : fullActions;

  const filteredVehicles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return fullVehicles;
    return fullVehicles.filter((item) =>
      Object.values(item).some((value) => value.toLowerCase().includes(term)),
    );
  }, [query]);

  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <header className="topbar">
        <button
          className="mobile-menu"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 typo-label-sm text-slate-400">
            VISTA <ChevronRight size={10} /> Overview
          </div>
          <h1 className="mt-0.5 typo-headline-sm text-slate-900">Dashboard</h1>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <label className="search-box">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicles, orders..."
              aria-label="Search dashboard"
            />
          </label>

          <div className="relative">
            <button
              className="topbar-icon"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="notification-dot" />
            </button>
            {notificationOpen && (
              <div className="dropdown-panel right-0 w-72">
                <div className="dropdown-heading">Notifications</div>
                <div className="p-2">
                  <button
                    className="notification-card"
                    onClick={() => notify("Travel order opened")}
                  >
                    <span className="notification-icon">
                      <FileText size={15} />
                    </span>
                    <span>
                      <b>Travel order needs approval</b>
                      <small>TO-2025-0618-015 · 8 minutes ago</small>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="profile-button"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationOpen(false);
              }}
            >
              <div className="avatar">JB</div>
              <div className="hidden text-left sm:block">
                <p className="typo-label-sm text-slate-800">
                  {user?.fullName || "Janine Balayan"}
                </p>
                <p className="typo-label-sm text-slate-400">
                  {userRole || "Administrator"}
                </p>
              </div>
              <ChevronDown size={13} className="hidden text-slate-400 sm:block" />
            </button>
            {profileOpen && (
              <div className="dropdown-panel right-0 w-48 p-1.5">
                <button className="dropdown-item">
                  <UserRound size={15} /> My profile
                </button>
                <button className="dropdown-item">
                  <Settings size={15} /> Account settings
                </button>
                <button
                  className="dropdown-item text-red-600"
                  onClick={() => {
                    navigate("/");
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="typo-title-sm text-slate-900">
              Welcome back, {user?.fullName || "Janine Ganda"}!
            </h2>
            <p className="mt-1 typo-label-sm text-slate-500">
              Here&apos;s an overview of your vehicle operations today.
            </p>
          </div>
          <p className="typo-label-sm text-slate-400">
            {currentDateTime.toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })} ·{" "}
            {currentDateTime.toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <section className="summary-grid" aria-label="Vehicle operations summary">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <article
                className="stat-card cursor-pointer"
                key={item.label}
                onClick={() => {
                  if (item.label === "Total Vehicles") {
                    if (userRole === "Administrator") {
                      notify("Vehicle Management opened");
                    } else {
                      notify("Vehicle Management is restricted to Administrators.");
                    }
                    return;
                  }
                  notify(`${item.label} opened`);
                }}
                role="button"
                tabIndex={0}
              >
                <div className={`stat-icon stat-${item.tone}`}>
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="typo-label-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 typo-headline-sm text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1.5 truncate typo-label-sm text-slate-400">{item.note}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
          <article className="panel min-w-0">
            <SectionHeader
              title="Upcoming Schedules"
              subtitle={
                userRole === "Personnel"
                  ? "Your upcoming vehicle schedules"
                  : "Approved vehicle schedules that have not yet departed"
              }
              link="View All Schedules"
              onLink={() => navigate("/vehicle-availability")}
            />
            <div className="table-scroll">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Plate Number</th>
                    <th>Driver</th>
                    <th>Department</th>
                    <th>Schedule Date</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSchedules.map((item) => (
                    <tr key={item.plate + item.scheduleDate}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="vehicle-icon">
                            <CarFront size={16} />
                          </span>
                          <b className="typo-label-sm">{item.vehicle}</b>
                        </div>
                      </td>
                      <td className="typo-label-sm">{item.plate}</td>
                      <td className="typo-label-sm">{item.driver}</td>
                      <td className="typo-label-sm">{item.department}</td>
                      <td className="typo-label-sm">{item.scheduleDate}</td>
                      <td className="typo-label-sm">{item.expectedReturn}</td>
                      <td>
                        <StatusBadge status={item.status as any} />
                      </td>
                    </tr>
                  ))}
                  {upcomingSchedules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="!py-8 text-center text-slate-400">
                        No upcoming schedules.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <SectionHeader title="Quick Actions" subtitle="Frequently used vehicle operations" />
            <div className="quick-actions-list">
              {dashboardActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    className={`quick-action-row ${"primary" in action && action.primary ? "quick-action-primary" : ""}`}
                    key={action.label}
                    onClick={() => notify(`${action.label} opened`)}
                  >
                    <span className="quick-action-icon">
                      <Icon size={16} />
                    </span>
                    <span className="typo-label-sm">{action.label}</span>
                    <ChevronRight size={13} className="ml-auto opacity-50" />
                  </button>
                );
              })}
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_.9fr]">
          <article className="panel min-w-0">
            <SectionHeader
              title="Active Vehicle Trips"
              subtitle={
                userRole === "Personnel"
                  ? "Your active trips"
                  : "Vehicles that have departed and not yet returned"
              }
              link="View All Trips"
              onLink={() => notify("Vehicle Monitoring opened")}
            />
            <div className="table-scroll">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Plate Number</th>
                    <th>Driver</th>
                    <th>Destination</th>
                    <th>Actual Departure</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrips.map((item) => (
                    <tr key={item.plate + item.actualDeparture}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="vehicle-icon">
                            <CarFront size={16} />
                          </span>
                          <b className="typo-label-sm">{item.vehicle}</b>
                        </div>
                      </td>
                      <td className="typo-label-sm">{item.plate}</td>
                      <td className="typo-label-sm">{item.driver}</td>
                      <td className="typo-label-sm">{item.destination}</td>
                      <td className="typo-label-sm">{item.actualDeparture}</td>
                      <td className="typo-label-sm">{item.expectedReturn}</td>
                      <td>
                        <StatusBadge status={item.status as any} />
                      </td>
                    </tr>
                  ))}
                  {activeTrips.length === 0 && (
                    <tr>
                      <td colSpan={7} className="!py-8 text-center text-slate-400">
                        No active trips.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <SectionHeader title="Pending Tasks & Notifications" subtitle="Items requiring attention" />
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div
                    key={task.label}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="quick-action-icon">
                        <Icon size={16} />
                      </span>
                      <span className="typo-label-sm text-slate-600">{task.label}</span>
                    </div>
                    <span className="status-badge status-pending-approval">{task.count}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </main>
    </Layout>
  );
}
