import { useEffect, useState, type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { CurrentUserContext, type CurrentUser } from "../services/authContext";

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ user: CurrentUser }>("/auth/me")
      .then((response) => {
        if (cancelled) return;
        setUser(response.data.user ?? null);
        setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  // Remember where the user was going so login can send them back there.
  if (state === "denied") return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />;

  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}
