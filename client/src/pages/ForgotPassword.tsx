import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const submit = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    try {
      await api.post("/auth/forgot", { email });
      toast.success("Password reset link sent");
    } catch (error: unknown) {
      toast.error(isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Could not send reset link" : "Could not send reset link");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Forgot Password?
        </h2>
        <p className="text-center text-gray-500 mt-2">
          No worries, we’ll help you reset it.
        </p>

        <div className="mt-6 space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn-primary" onClick={submit}>
            Send Reset Link
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Remembered your password?{" "}
          <Link to="/" className="link">
            Go back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
