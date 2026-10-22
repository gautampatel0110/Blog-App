import { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/api";
import { isAxiosError } from "axios";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

   const [showPassword, setShowPassword] = useState(false);

   const navigate = useNavigate();

   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({...form, [e.target.name]: e.target.value});

   };

   const submit = async () => {
  if (!form.email || !form.password) {
    toast.error("Please enter email and password");
    return;
  }

  try {
    await api.post("/auth/login", form);

    toast.success("Login successful");


    setTimeout(() => {
      navigate("/dashboard");
    }, 500);

  } catch (err: unknown) {
    toast.error(
      (isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined) || "Invalid Login credentials"
    );
  }
};


   return(
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 mt-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">
          Rapid Page Generator
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Login
        </h2>


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
        <div className="mb-6">
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

                  {/* Button */}
        <button
          className="btn-primary w-fit px-6"
          onClick={submit}
        >
          Login
        </button>

        <p className="text-sm text-gray-600 mt-4">
          <Link to="/forgot" className="text-[#5B4CF5] font-medium">Forgot password?</Link>
        </p>

{/* Footer */}
       <p className="text-sm text-gray-600 mt-4 ">
        Don't have account? {""}
        <Link to={"/signup"} className="text-[#5B4CF5] font medium">
          create account.
          </Link>
       </p>
       </div>
       </div>
   )

  }
