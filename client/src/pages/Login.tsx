import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { apiErrorCode, apiErrorMessage } from "../utils/errors";

interface LoginLocationState {
  from?: string;
  email?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;

  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/login", { email: email.trim(), password });
      toast.success("Welcome back!");
      // Return to the page the user originally tried to open, if any.
      const target = state.from && state.from !== "/" ? state.from : "/dashboard";
      navigate(target, { replace: true });
    } catch (error: unknown) {
      if (apiErrorCode(error) === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email first");
        navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        return;
      }
      toast.error(apiErrorMessage(error, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage and publish your pages."
      footer={
        <>
          Don’t have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand-500 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <label className="block">
          <span className="label">Email</span>
          <input
            type="email"
            className="input mt-1"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between">
            <span className="label">Password</span>
            <Link to="/forgot" className="text-xs font-medium text-brand-500 hover:underline">
              Forgot password?
            </Link>
          </span>
          <div className="mt-1">
            <PasswordInput
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
