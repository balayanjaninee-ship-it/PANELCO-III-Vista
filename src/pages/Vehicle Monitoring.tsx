import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/dashboard.css";
import "../styles/typography.css";
import { useAuth } from "../context/AuthContext";
import {
  CarFront,
  ChevronRight,
  Menu,
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

const upcomingSchedules = [
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

const activeTrips = [
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

export default function VehicleMonitoring() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <button
        className="mobile-menu fixed left-3 top-3 z-40 lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <span className="text-slate-600">☰</span>
      </button>
      <main className="dashboard-main">
        <section className="grid gap-4 xl:grid-cols-[1fr_330px]">
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

        </section>

        <section className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_.9fr]">
          <article className="panel min-w-0">
            <SectionHeader
              title="Active Vehicle Trips"
              subtitle="Vehicles that have departed and not yet returned"
              link="View All Trips"
              onLink={() => {}}
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
        </section>
      </main>
    </Layout>
  );
}