import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { JSX } from 'react';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();

  if (user === undefined) return <div>Loading...</div>; // waiting for auth check
  if (user === null) return <Navigate to="/login" replace />;

  return children;
}
