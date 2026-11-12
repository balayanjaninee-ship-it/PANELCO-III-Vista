import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../panelco 3 logo.png";
import vehiclePhoto from "../Grab-2.jpg";
import "../styles/typography.css";
import { useAuth } from "../context/AuthContext";

<img src={vehiclePhoto} alt="PANELCO Vehicle" />

function Logo() {
  return (
    <div className="flex items-center justify-start gap-4 whitespace-nowrap">
      <img
        src={logoImg}
        alt="PANELCO III logo"
        className="-ml-6 -mr-6 h-16 w-auto object-contain mix-blend-multiply sm:h-28 lg:h-32"
      />
      <div className="flex flex-col justify-center">
        <p className="typo-label-sm text-[#0d3448] uppercase tracking-[0.18em] sm:text-[14px]">
          PANELCO III
        </p>
        <p className="mt-2 typo-title-md text-[#168f78] leading-none tracking-[-0.02em] sm:text-[30px]">
          VIST<span className="text-[#168f78]">A</span>
        </p>
      </div>
    </div>
  );
}

function Icon({ name }: { name: "user" | "lock" | "eye" | "eye-off" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden="true"
    >
      {name === "user" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" />
        </>
      )}
      {name === "eye" && (
        <>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === "eye-off" && (
        <>
          <path d="m3 3 18 18M10.6 6.15A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.7 9.7 0 0 0 3-.46M9.9 9.9A3 3 0 0 0 14.1 14.1" />
        </>
      )}
    </svg>
  );
}

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "request">("signin");

  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (mode === "signin") {
      // Admin sign-in: authenticate, then go straight to the dashboard.
      const ok = login(username, password, "Administrator");
      if (ok) {
        navigate("/dashboard");
        return;
      } else {
        setLoginError("Invalid username, password, or role selection.");
      }
      return;
    }

    // User sign-in: authenticate, then force a password change on first login.
    const ok = login(username, password, "Personnel");
    if (ok) {
      setShowChangePassword(true);
      return;
    } else {
      setLoginError("Invalid username, password, or role selection.");
    }
  }

  function changeMode(nextMode: "signin" | "request") {
    setMode(nextMode);
    setSubmitted(false);
    setLoginError("");
  }

  return (
    <main className="login-canvas h-screen overflow-hidden px-4 py-1 text-[#112f3d] sm:px-7 sm:py-4 flex items-center justify-center lg:px-12">
      <div className="login-card mx-auto grid w-full max-w-[1100px] overflow-hidden rounded-[28px] bg-white shadow-[0_28px_70px_rgba(28,53,66,.22)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[52%_48%]">
        <section className="flex flex-col px-5 py-1 sm:px-12 sm:py-4 lg:min-h-0 lg:px-16 lg:py-10 xl:px-[78px]">
          <header>
            <Logo />
          </header>

          <div className="flex flex-1 items-center py-2 lg:py-6">
            <div className="w-full max-w-[440px]">
              <div className="mb-1">
                
                <h1 className="typo-headline-sm text-[#102e3d] leading-[1.08] tracking-[-0.045em] sm:text-[2.4rem]">
                  Welcome back.
                  <br />
                  <span className="text-[#F5C518]">
                    Sign in
                  </span>{" "}
                  to continue.
                </h1>
                
              </div>

              <div
                className="mb-1 grid grid-cols-2 rounded-[14px] bg-[#eef3f3] p-1.5"
                role="tablist"
                aria-label="Account access options"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => changeMode("signin")}
                  className={`flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-white text-[#123b4c] shadow-[0_3px_10px_rgba(21,55,68,.09)]"
                      : "text-[#71858c] hover:text-[#254a57]"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "request"}
                  onClick={() => changeMode("request")}
                  className={`flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold transition ${
                    mode === "request"
                      ? "bg-white text-[#123b4c] shadow-[0_3px_10px_rgba(21,55,68,.09)]"
                      : "text-[#71858c] hover:text-[#254a57]"
                  }`}
                >
                  User
                </button>
              </div>

              <p className="mb-1 typo-label-sm leading-5 text-[#6b8086] text-center">
                Note: Your username is your ID number. Default password is
                <span className="font-semibold text-[#102e3d]"> 12345</span>. You
                will be asked to change it after signing in.
              </p>

              {showChangePassword ? (
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-1 block typo-label-sm text-[#24434f]"
                    >
                      New Password
                    </label>
                    <div className="group relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aabb0] transition group-focus-within:text-[#168f78]">
                        <Icon name="lock" />
                      </span>
                      <input
                        id="new-password"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="Enter your new password"
                        className="h-[40px] sm:h-[44px] w-full rounded-lg border border-transparent bg-[#f2f5f5] pl-11 pr-12 typo-body-sm text-[#153744] outline-none transition placeholder:text-[#99a8ad] focus:border-[#4bb5a3] focus:bg-white focus:ring-4 focus:ring-[#4bb5a3]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-1 block typo-label-sm text-[#24434f]"
                    >
                      Confirm Password
                    </label>
                    <div className="group relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aabb0] transition group-focus-within:text-[#168f78]">
                        <Icon name="lock" />
                      </span>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="Confirm your new password"
                        className="h-[40px] sm:h-[44px] w-full rounded-lg border border-transparent bg-[#f2f5f5] pl-11 pr-12 typo-body-sm text-[#153744] outline-none transition placeholder:text-[#99a8ad] focus:border-[#4bb5a3] focus:bg-white focus:ring-4 focus:ring-[#4bb5a3]/10"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <p className="typo-label-sm text-red-600 text-center">
                      {loginError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const newPassword = (
                        document.getElementById("new-password") as HTMLInputElement
                      ).value;
                      const confirmPassword = (
                        document.getElementById("confirm-password") as HTMLInputElement
                      ).value;
                      if (!newPassword || newPassword !== confirmPassword) {
                        setLoginError("Passwords do not match.");
                        return;
                      }
                      setLoginError("");
                      navigate("/dashboard");
                    }}
                    className="mt-2 h-[40px] sm:h-[44px] w-full rounded-lg bg-[#176B3A] typo-label-sm text-white shadow-[0_2px_4px_rgba(23,107,58,.3)] transition colors-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#168f78] hover:bg-[#F5C518] active:bg-[#F5C518] active:text-[color:var(--panelco-white)] active:shadow-[0_2px_4px_rgba(245,197,24,.3)]"
                  >
                    Update Password
                  </button>

                  <p className="text-center typo-label-sm leading-5 text-[#6b8086] mt-2">
                    Already changed your password?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowChangePassword(false);
                      }}
                      className="text-[#16816d] underline-offset-4 transition hover:underline"
                    >
                      Sign in again
                    </a>
                  </p>
                </div>
              ) : (
                <form className="space-y-2" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-1 block typo-label-sm text-[#24434f]"
                    >
                      Username
                    </label>
                    <div className="group relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aabb0] transition group-focus-within:text-[#168f78]">
                        <Icon name="user" />
                      </span>
                      <input
                        id="username"
                        name="username"
                        autoComplete="username"
                        required
                        placeholder="Enter your username"
                        className="h-[40px] sm:h-[44px] w-full rounded-lg border border-transparent bg-[#f2f5f5] pl-11 pr-4 typo-body-sm text-[#153744] outline-none transition placeholder:text-[#99a8ad] focus:border-[#4bb5a3] focus:bg-white focus:ring-4 focus:ring-[#4bb5a3]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block typo-label-sm text-[#24434f]"
                    >
                      Password
                    </label>
                    <div className="group relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aabb0] transition group-focus-within:text-[#168f78]">
                        <Icon name="lock" />
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        placeholder="Enter your password"
                        className="h-[40px] sm:h-[44px] w-full rounded-lg border border-transparent bg-[#f2f5f5] pl-11 pr-12 typo-body-sm text-[#153744] outline-none transition placeholder:text-[#99a8ad] focus:border-[#4bb5a3] focus:bg-white focus:ring-4 focus:ring-[#4bb5a3]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#91a2a8] transition hover:bg-white hover:text-[#16816d] focus-visible:outline-2 focus-visible:outline-[#168f78]"
                      >
                        <Icon name={showPassword ? "eye-off" : "eye"} />
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <p className="typo-label-sm text-red-600 text-center">
                      {loginError}
                    </p>
                  )}

                  <div className="flex h-5 items-center justify-between gap-4 typo-label-sm">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[#6c8087]">
                      <input
                        type="checkbox"
                        name="remember"
                        className="size-4 rounded border-[#c6d1d4] accent-[#168f78]"
                      />
                      Remember Me
                    </label>
                    <a
                      href="#forgot-password"
                      className="typo-label-sm text-[#16816d] underline-offset-4 transition hover:text-[#0f5e51] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#168f78]"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 h-[40px] sm:h-[44px] w-full rounded-lg bg-[#176B3A] typo-label-sm text-white shadow-[0_2px_4px_rgba(23,107,58,.3)] transition colors-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#168f78] hover:bg-[#F5C518] active:bg-[#F5C518] active:text-[color:var(--panelco-white)] active:shadow-[0_2px_4px_rgba(245,197,24,.3)]"
                  >
                    Sign In
                  </button>

                  {submitted && (
                    <p
                      role="status"
                      className="rounded-lg border border-[#cde7e1] bg-[#eff8f6] px-4 py-3 typo-label-sm leading-5 text-[#176653]"
                    >
                      Demo sign-in submitted. Connect the company authentication service to continue.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
          <footer className="hidden sm:flex flex-col gap-1 border-t border-[#e9eff0] pt-2 typo-label-sm leading-4 text-[#8b9ba0] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 PANELCO III. All Rights Reserved.</span>
            <span className="flex items-center gap-1.5">
            </span>
          </footer>
        </section>

        <section className="relative order-first m-1 min-h-[80px] overflow-hidden rounded-[20px] bg-[#143d4d] shadow-[0_18px_34px_rgba(13,52,66,.2)] sm:m-4 sm:min-h-[160px] lg:order-none lg:m-5 lg:ml-0 lg:min-h-0 hidden sm:block">
          <img
            src={vehiclePhoto}
            alt="A company utility pickup truck ready for service"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,35,48,.06)_35%,rgba(6,35,48,.86)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(6,35,48,.35),transparent)]" />

          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-[#0a3041]/70 px-3 py-2 typo-label-sm font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:left-8 sm:top-8">
          </div>
  
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white sm:p-9 lg:p-11">
            
            <h2 className="mt-3 max-w-md typo-headline-sm leading-tight tracking-[-0.03em] sm:text-[30px] text-[#F5C518]">
              Manage Smarter.
              <br />
              Move Better.
            </h2>
            
          </div>
        </section>
      </div>
    </main>
  );
}
