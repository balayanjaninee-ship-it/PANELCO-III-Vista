import { useState } from "react";
import Layout from "../components/Layout";
import "../styles/dashboard.css";
import "../styles/typography.css";
import { useAuth } from "../context/AuthContext";
import { Save, Pencil, X, Eye, EyeOff, Lock, KeyRound, Bell } from "lucide-react";

type SettingsSection = "account" | "security" | "notifications";

const notifications = [
  { label: "Vehicle Reservation Confirmation", admin: false },
  { label: "Upcoming Vehicle Schedule", admin: false },
  { label: "Vehicle Return Reminder", admin: false },
  { label: "Overdue Vehicle Return Alert", admin: false },
  { label: "Pending Document Completion", admin: false },
  { label: "Vehicle Inspection Reminder", admin: false },
  { label: "New Vehicle Request (Admin)", admin: true },
  { label: "Vehicle Maintenance Reminder (Admin)", admin: true },
];

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("account");

  const { user, updateUser } = useAuth();

  // Profile form state
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [employeeId, setEmployeeId] = useState(user?.employeeId || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [position, setPosition] = useState(user?.position || "");
  const [email, setEmail] = useState(user?.email || "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleEdit = () => {
    setFullName(user?.fullName || "");
    setEmployeeId(user?.employeeId || "");
    setDepartment(user?.department || "");
    setPosition(user?.position || "");
    setEmail(user?.email || "");
    setContactNumber(user?.contactNumber || "");
    setEditing(true);
    setSaved(false);
  };

  const handleCancel = () => {
    setFullName(user?.fullName || "");
    setEmployeeId(user?.employeeId || "");
    setDepartment(user?.department || "");
    setPosition(user?.position || "");
    setEmail(user?.email || "");
    setContactNumber(user?.contactNumber || "");
    setEditing(false);
    setSaved(false);
  };

  const handleSave = () => {
    updateUser({
      fullName,
      employeeId,
      department,
      position,
      email,
      contactNumber,
    });
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 5) {
      setPasswordError("New password must be at least 5 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    // Mock: accept any current password that matches the stored one is not verified here;
    // in production this would be validated by the auth service.
    updateUser({
      lastPasswordChange: new Date().toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess(true);
    window.setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const inputClass =
    "h-[40px] w-full rounded-lg border border-[#e3e8ee] bg-[#f8fafc] px-3 typo-body-sm text-[#153744] outline-none transition focus:border-[#4bb5a3] focus:bg-white focus:ring-4 focus:ring-[#4bb5a3]/10 disabled:bg-slate-100 disabled:text-slate-500";

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
        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <button
            className={`flex items-center gap-2 px-4 py-2 typo-label-sm font-semibold transition border-b-2 ${
              section === "account"
                ? "border-[#176B3A] text-[#176B3A]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setSection("account")}
          >
            <Pencil size={15} />
            Account Settings
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 typo-label-sm font-semibold transition border-b-2 ${
              section === "security"
                ? "border-[#176B3A] text-[#176B3A]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setSection("security")}
          >
            <KeyRound size={15} />
            Account Security
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 typo-label-sm font-semibold transition border-b-2 ${
              section === "notifications"
                ? "border-[#176B3A] text-[#176B3A]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setSection("notifications")}
          >
            <Bell size={15} />
            Notifications
          </button>
        </div>

        {section === "account" && (
          <>
          <section className="panel max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="typo-title-sm text-slate-900">Account Settings</h3>
                <p className="mt-0.5 typo-label-sm text-slate-400">
                  View and update your profile information.
                </p>
              </div>
              {!editing && (
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-[#176B3A] px-4 py-2 typo-label-sm text-white shadow-sm transition hover:bg-[#12582f]"
                  onClick={handleEdit}
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
              )}
            </div>

            {saved && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 typo-label-sm text-emerald-700">
                Profile saved successfully.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Full Name</label>
                <input
                  className={inputClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Employee ID</label>
                <input
                  className={inputClass}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Department</label>
                <input
                  className={inputClass}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Position</label>
                <input
                  className={inputClass}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Email Address</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Contact Number</label>
                <input
                  className={inputClass}
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>

            {editing && (
              <div className="mt-5 flex gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-[#176B3A] px-5 py-2.5 typo-label-sm text-white shadow-sm transition hover:bg-[#12582f]"
                  onClick={handleSave}
                >
                  <Save size={14} />
                  Save Changes
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 typo-label-sm text-slate-600 transition hover:bg-slate-50"
                  onClick={handleCancel}
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            )}
          </section>
          </>
        )}

        {section === "security" && (
          <>
          {/* Account Security */}
          <section className="panel max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={18} className="text-[#176B3A]" />
              <div>
                <h3 className="typo-title-sm text-slate-900">Account Security</h3>
                <p className="mt-0.5 typo-label-sm text-slate-400">
                  Change your password and view security activity.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 typo-label-sm text-emerald-700">
                Password changed successfully.
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 typo-label-sm text-red-700">
                {passwordError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block typo-label-sm text-slate-500">Current Password</label>
                <div className="group relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb0]">
                    <Lock size={15} />
                  </span>
                  <input
                    className={inputClass + " pl-10 pr-10"}
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aabb0] hover:text-[#16816d]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">New Password</label>
                <div className="group relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb0]">
                    <Lock size={15} />
                  </span>
                  <input
                    className={inputClass + " pl-10"}
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block typo-label-sm text-slate-500">Confirm New Password</label>
                <div className="group relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb0]">
                    <Lock size={15} />
                  </span>
                  <input
                    className={inputClass + " pl-10"}
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-[#176B3A] px-5 py-2.5 typo-label-sm text-white shadow-sm transition hover:bg-[#12582f]"
                onClick={handleChangePassword}
              >
                <KeyRound size={14} />
                Change Password
              </button>
            </div>

            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="typo-label-sm text-slate-400">Last Password Change</p>
                <p className="mt-1 typo-body-sm font-semibold text-slate-700">
                  {user?.lastPasswordChange || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="typo-label-sm text-slate-400">Last Login</p>
                <p className="mt-1 typo-body-sm font-semibold text-slate-700">
                  {user?.lastLogin || "—"}
                </p>
              </div>
            </div>
          </section>
          </>
        )}

        {section === "notifications" && (
          <section className="panel max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={18} className="text-[#176B3A]" />
              <div>
                <h3 className="typo-title-sm text-slate-900">Notifications</h3>
                <p className="mt-0.5 typo-label-sm text-slate-400">
                  Manage which notifications you receive.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {notifications.map((item) => (
                <label
                  key={item.label}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="quick-action-icon">
                      <Bell size={16} />
                    </span>
                    <span className="typo-label-sm text-slate-600">{item.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[#c6d1d4] accent-[#168f78]"
                    defaultChecked
                    disabled={item.admin && user?.role !== "Administrator"}
                  />
                </label>
              ))}
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}