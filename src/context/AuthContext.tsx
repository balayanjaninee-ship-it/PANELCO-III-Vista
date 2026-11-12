import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type UserRole = "Administrator" | "Personnel";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  contactNumber?: string;
  lastPasswordChange?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  hasAccess: (path: string) => boolean;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for testing — replace with real authentication later
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "123": {
    password: "12345",
    user: {
      id: "1",
      username: "123",
      fullName: "Admin User",
      role: "Administrator",
      email: "admin@panelco3.com",
      employeeId: "EMP-001",
      department: "General Services",
      position: "Administrator",
      contactNumber: "0917-123-4567",
      lastPasswordChange: "Jan 15, 2026",
      lastLogin: "Nov 12, 2026, 9:42 AM",
    },
  },
  "345": {
    password: "12345",
    user: {
      id: "2",
      username: "345",
      fullName: "Personnel User",
      role: "Personnel",
      email: "user@panelco3.com",
      employeeId: "EMP-002",
      department: "Operations",
      position: "Personnel",
      contactNumber: "0917-345-6789",
      lastPasswordChange: "Oct 3, 2026",
      lastLogin: "Nov 12, 2026, 10:15 AM",
    },
  },
};

// Routes accessible by each role
const ROLE_ROUTES: Record<UserRole, string[]> = {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(
    (username: string, password: string, role: UserRole): boolean => {
      const record = MOCK_USERS[username];
      if (!record) return false;
      if (record.password !== password) return false;
      if (record.user.role !== role) return false;
      const now = new Date();
      const lastLogin = now.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setUser({ ...record.user, lastLogin });
      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const hasAccess = useCallback(
    (path: string): boolean => {
      if (!user) return false;
      const allowed = ROLE_ROUTES[user.role];
      return allowed.includes(path);
    },
    [user],
  );

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    hasAccess,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
