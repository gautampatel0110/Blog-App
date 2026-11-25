import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { apiErrorMessage } from "../utils/errors";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is invalid");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/auth/reset/${encodeURIComponent(token)}`, { password });
      toast.success("Password updated. Please log in.");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Password reset failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Reset links are valid for 15 minutes."
      footer={
        <>
          Link expired?{" "}
          <Link to="/forgot" className="font-semibold text-brand-500 hover:underline">
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <label className="block">
          <span className="label">New password</span>
          <div className="mt-1">
            <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 6 characters" autoFocus />
          </div>
        </label>
        <label className="block">
          <span className="label">Confirm password</span>
          <div className="mt-1">
            <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Repeat your password" />
          </div>
        </label>
        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
