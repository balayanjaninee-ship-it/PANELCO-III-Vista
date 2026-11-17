import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

export default function Header({
  title,
  description,
  breadcrumb,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  sidebarOpen,
  setSidebarOpen,
  onNotify,
}: {
  title: string;
  description?: string;
  breadcrumb?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNotify?: (message: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role;
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notify = (message: string) => {
    if (onNotify) onNotify(message);
  };

  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="min-w-0">
        {breadcrumb && (
          <div className="flex items-center gap-1.5 typo-label-lg text-slate-400">
            {breadcrumb}
          </div>
        )}
        <h1 className="mt-0.5 typo-headline-sm text-slate-900">{title}</h1>
        {description && (
          <p className="mt-0.5 typo-body-lg text-slate-500">{description}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {showSearch && (
          <label className="search-box">
            <Search size={15} />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </label>
        )}

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
              <p className="typo-label-lg text-slate-800">
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
              <button className="dropdown-item" onClick={() => navigate("/settings")}>
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
  );
}
