import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { apiErrorMessage } from "../utils/errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (!form.firstName.trim() || !email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post<{ message: string; emailSent: boolean }>("/auth/signup", {
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email,
        password: form.password,
      });
      if (data.emailSent) toast.success("Account created! Check your email for the code.");
      else toast.error(data.message);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start writing and publishing in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/" className="font-semibold text-brand-500 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">
              First name <span className="text-red-500">*</span>
            </span>
            <input className="input mt-1" name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} autoFocus />
          </label>
          <label className="block">
            <span className="label">Last name</span>
            <input className="input mt-1" name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} />
          </label>
        </div>

        <label className="block">
          <span className="label">
            Email <span className="text-red-500">*</span>
          </span>
          <input type="email" className="input mt-1" name="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={handleChange} />
        </label>

        <label className="block">
          <span className="label">
            Password <span className="text-red-500">*</span>
          </span>
          <div className="mt-1">
            <PasswordInput name="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password} onChange={handleChange} />
          </div>
        </label>

        <label className="block">
          <span className="label">
            Confirm password <span className="text-red-500">*</span>
          </span>
          <div className="mt-1">
            <PasswordInput name="confirmPassword" placeholder="Repeat your password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} />
          </div>
        </label>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs leading-relaxed text-gray-500">
          We’ll email you a 6-digit code to verify your address.
        </p>
      </form>
    </AuthLayout>
  );
}
