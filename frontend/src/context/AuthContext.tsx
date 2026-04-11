import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchCurrentUserProfile, logoutFromBackend } from '../services/authApi';

interface User {
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        if (!mounted) return;

        const syncedUser: User = {
          email: profile.email,
          name: profile.display_name,
        };

        setUser(syncedUser);
        localStorage.setItem('auth_user', JSON.stringify(syncedUser));
      } catch {
        if (!mounted) return;

        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    localStorage.setItem('auth_token', newToken);
  };

  const logout = () => {
    void logoutFromBackend().catch(() => {
      // Local cleanup still proceeds when backend session revocation fails.
    });
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
