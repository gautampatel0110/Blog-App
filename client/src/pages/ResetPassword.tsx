import api from "../services/api";
import { useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

export default function Reset() {
  const { token } = useParams();
  const [password, setPassword] = useState("");

  const submit = async () => {
    if (!token || password.length < 6) {
      toast.error("Enter a password with at least 6 characters");
      return;
    }
    try {
      await api.post(`/auth/reset/${encodeURIComponent(token)}`, { password });
      toast.success("Password reset");
    } catch (error: unknown) {
      toast.error(isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Password reset failed" : "Password reset failed");
    }
  };

  return (
    <div>
      <input type="password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={submit}>Reset</button>
    </div>
  );
}
