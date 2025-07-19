import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null | undefined; // undefined = loading
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api.getCurrentUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
