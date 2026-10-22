import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import type { PropsWithChildren } from "react";

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
