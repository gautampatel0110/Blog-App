import { useEffect, useState, type PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";

/** Pages like login and sign-up: already signed-in users are sent straight to the dashboard. */
export default function GuestRoute({ children }: PropsWithChildren) {
  const [state, setState] = useState<"checking" | "guest" | "signedIn">("checking");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/auth/me")
      .then(() => !cancelled && setState("signedIn"))
      .catch(() => !cancelled && setState("guest"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") return <div className="min-h-screen bg-gray-50" />;
  if (state === "signedIn") return <Navigate to="/dashboard" replace />;
  return children;
}
