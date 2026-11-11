import { useState, type ElementType } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/typography.css";
import { useAuth } from "../context/AuthContext";
import logoImg from "../panelco 3 logo.png";
import {
  CalendarClock,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Printer,
  Settings,
  ShieldCheck,
  TicketCheck,
  Truck,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

type NavEntry =
  | { label: string; icon: ElementType }
  | { label: string; icon: ElementType; children: { label: string; icon: ElementType }[] };

const fullNavigation: NavEntry[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Vehicle Availability",
    icon: CalendarClock,
    children: [
      { label: "Vehicle Selection", icon: CarFront },
      { label: "Schedule Vehicle", icon: CalendarClock },
      { label: "Trip Documents", icon: FileText },
      { label: "Review & Print", icon: Printer },
    ],
  },
  { label: "Vehicle Monitoring", icon: Gauge },
  { label: "Vehicle Management", icon: Truck },
  { label: "User Management", icon: UsersRound },
  { label: "Settings", icon: Settings },
];

// Routes accessible by each role
const ROLE_ROUTES: Record<string, string[]> = {
  Administrator: [
    "/dashboard",
    "/vehicle-availability",
    "/vehicle-management",
    "/vehicle-monitoring",
    "/user-management",
    "/settings",
  ],
  Personnel: [
    "/dashboard",
    "/vehicle-availability",
    "/vehicle-monitoring",
    "/settings",
  ],
};

// Map top-level nav labels to their actual routes
const LABEL_TO_ROUTE: Record<string, string> = {
  Dashboard: "/dashboard",
  "Vehicle Availability": "/vehicle-availability",
  "Vehicle Monitoring": "/vehicle-monitoring",
  "Vehicle Management": "/vehicle-management",
  "User Management": "/user-management",
  Settings: "/settings",
};

function isRouteAllowed(role: string | undefined, route: string): boolean {
  if (!role) return false;
  return ROLE_ROUTES[role]?.includes(route) ?? false;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
        <img
          src={logoImg}
          alt="PANELCO III logo"
          className="-ml-4 h-8 w-auto object-contain mix-blend-multiply"
        />
      </div>
      <div className="flex flex-col justify-center">
        <p className="typo-label-sm text-white/80 uppercase tracking-[0.18em]">
          PANELCO III
        </p>
        <p className="mt-1 typo-title-md text-white leading-none tracking-[-0.02em]">
          VISTA
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
  stage,
  maxStage,
  onStageChange,
}: {
  open: boolean;
  onClose: () => void;
  stage?: number;
  maxStage?: number;
  onStageChange?: (stage: number) => void;
}) {
  const { user } = useAuth();
  const location = useLocation();
  const onVehiclePage = location.pathname === "/vehicle-availability";
  const userRole = user?.role;
  const [active, setActive] = useState(
    onVehiclePage ? "Vehicle Selection" : "Dashboard",
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Vehicle Availability": false,
  });
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // Filter navigation items based on user role
  const navigation = fullNavigation.filter((item) => {
    if ("children" in item) {
      // Show group if the parent route is accessible (children are steps within the page)
      return isRouteAllowed(userRole, LABEL_TO_ROUTE[item.label] || "");
    }
    return isRouteAllowed(userRole, LABEL_TO_ROUTE[item.label] || "");
  });

  const selectPage = (label: string) => {
    setActive(label);
    onClose();
    const pathMap: Record<string, string> = {
      Dashboard: "/dashboard",
      "Vehicle Monitoring": "/vehicle-monitoring",
      "Vehicle Management": "/vehicle-management",
      "User Management": "/user-management",
      Settings: "/settings",
    };
    if (pathMap[label]) {
      navigate(pathMap[label]);
    }
  };

  return (
    <>
      {open && (
        <button className="sidebar-overlay" onClick={onClose} aria-label="Close navigation" />
      )}
      <aside
        className={`sidebar bg-[#00923F] ${open ? "sidebar-open" : ""}`}
        style={{ zIndex: open ? 60 : 50, backgroundColor: "#00923F" }}
      >
        <div className="flex h-[70px] items-center bg-[#00923F] px-5">
          <Logo />
          <button
            className="ml-auto text-white/70 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">

          {navigation.map((item) => {
            const Icon = item.icon;
            if ("children" in item) {
              const isExpanded = expanded[item.label] || hovered;
              const groupActive = item.children.some((child) => child.label === active);
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                >
                  <button
                    className={`nav-item ${groupActive ? "nav-group-active" : ""}`}
                    onClick={() => {
                      if (item.label === "Vehicle Availability") {
                        setActive("Vehicle Selection");
                        setExpanded((current) => ({ ...current, [item.label]: !expanded[item.label] }));
                        if (!onVehiclePage) {
                          navigate("/vehicle-availability");
                        }
                        onClose();
                        return;
                      }
                      setExpanded((current) => ({ ...current, [item.label]: !isExpanded }));
                    }}
                    aria-expanded={isExpanded}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="typo-label-sm">{item.label}</span>
                    <ChevronDown
                      size={13}
                      className={`ml-auto transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="nav-children">
                      {item.children.map((child, index) => {
                        const ChildIcon = child.icon;
                        const locked = onVehiclePage ? index > (maxStage ?? 0) : false;
                        const complete = onVehiclePage
                          ? index < (stage ?? 0) || (index < (maxStage ?? 0) && index !== (stage ?? 0))
                          : false;
                        return (
                          <button
                            key={child.label}
                            disabled={locked}
                            className={`nav-child ${active === child.label ? "nav-child-active" : ""} ${locked ? "opacity-40" : ""}`}
                            onClick={() => {
                              if (onVehiclePage && onStageChange && !locked) {
                                onStageChange(index);
                                setActive(child.label);
                              } else {
                                navigate("/vehicle-availability");
                              }
                              onClose();
                            }}
                          >
                            {complete ? (
                              <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check size={10} />
                              </span>
                            ) : (
                              <ChildIcon size={14} strokeWidth={1.7} />
                            )}
                            <span className="typo-label-sm">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.label}
                className={`nav-item ${active === item.label ? "nav-item-active" : ""}`}
                onClick={() => selectPage(item.label)}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="typo-label-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
