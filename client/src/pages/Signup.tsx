import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/api";
import { isAxiosError } from "axios";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    subscribe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const submit = async () => {
    if (!form.firstName || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await api.post("/auth/signup", {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
      });

      toast.success("Account created successfully ");
    } catch (err: unknown) {
      toast.error((isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined) || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">
          Rapid Page Generator
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white border border-gray-200  p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Register
        </h2>

        {/* Name */}
        <div className="mb-4">
          <label className="label">
            Name<span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <input
              className="input"
              placeholder="First Name"
              name="firstName"
              onChange={handleChange}
            />
            <input
              className="input"
              placeholder="Last Name"
              name="lastName"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="label">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            className="input mt-1"
            placeholder="email@address.com"
            name="email"
            onChange={handleChange}
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="label">
            Password<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              className="input pr-10"
              placeholder="Enter your password"
              name="password"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="label">
            ConfirmPassword<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? "text" : "password"}
              className="input pr-10"
              placeholder="Confirm your password"
              name="confirmPassword"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            name="subscribe"
            className="h-4 w-4 rounded border-gray-300 text-[#5B4CF5] focus:ring-[#5B4CF5]"
            onChange={handleChange}
          />
          <span className="text-sm text-gray-700">
            Subscribe daily digest
          </span>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Your personal data will be used to support your experience
          throughout this website, to manage access to your account,
          and for other purposes described in our{" "}
          <span className="text-[#5B4CF5] cursor-pointer">
            privacy policy
          </span>.
        </p>

        {/* Button */}
        <button className="btn-primary w-fit px-6" onClick={submit}>
          Register
        </button>

        {/* Footer */}
        <p className="text-sm text-gray-600 mt-4">
          Already have account?{" "}
          <Link to="/" className="text-[#5B4CF5] font-medium">
            Login.
          </Link>
        </p>
      </div>
    </div>
  );
}
