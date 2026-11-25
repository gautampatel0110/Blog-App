import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheckCircle } from "react-icons/fi";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import { apiErrorMessage } from "../utils/errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) {
      toast.error("Please enter your email");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/auth/forgot", { email: value });
      setSentTo(value);
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Could not send reset link"));
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = (
    <Link to="/" state={{ email: sentTo ?? email }} className="font-semibold text-brand-500 hover:underline">
      Back to login
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" footer={backToLogin}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={26} />
          </span>
          <p className="text-sm leading-relaxed text-gray-600">
            If an account exists for <strong className="text-gray-800">{sentTo}</strong>, we’ve sent a link to reset your password. It’s valid for 15 minutes.
          </p>
          <button onClick={() => setSentTo(null)} className="text-sm font-medium text-brand-500 hover:underline">
            Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we’ll send you a reset link." footer={<>Remembered it? {backToLogin}</>}>
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
        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
