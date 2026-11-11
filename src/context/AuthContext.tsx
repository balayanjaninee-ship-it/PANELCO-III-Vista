import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type UserRole = "Administrator" | "Personnel";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  hasAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for testing — replace with real authentication later
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      fullName: "Janine Balayan",
      role: "Administrator",
      email: "admin@panelco3.com",
    },
  },
  personnel: {
    password: "personnel123",
    user: {
      id: "2",
      username: "personnel",
      fullName: "Personnel User",
      role: "Personnel",
      email: "personnel@panelco3.com",
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
      setUser(record.user);
      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
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
