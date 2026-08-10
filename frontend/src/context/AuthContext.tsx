import React, { createContext, useContext, useState, useEffect } from "react";

// USER TYPE:
interface User {
  id: string;
  name: string;
  email: string;
  favoriteTeamId: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  updateFavoriteTeam: (teamId: number) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("ali_score_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string, name: string) => {
    const mockUser: User = {
      id: "user-123",
      name: name || "Fan",
      email: email,
      favoriteTeamId: null, // initially, with no team selected
    };
    setUser(mockUser);
    localStorage.setItem("ali_score_user", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ali_score_user");
  };

  const updateFavoriteTeam = (teamId: number) => {
    if (!user) return;

    const updatedUser = { ...user, favoriteTeamId: teamId };
    setUser(updatedUser);
    localStorage.setItem("ali_score_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateFavoriteTeam, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
