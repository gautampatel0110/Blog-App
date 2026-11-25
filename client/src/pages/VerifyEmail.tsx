import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMail } from "react-icons/fi";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import { apiErrorMessage } from "../utils/errors";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = (params.get("email") ?? "").trim().toLowerCase();

  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!email) return <Navigate to="/signup" replace />;

  const code = digits.join("");

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH) {
      toast.error("Enter all 6 digits");
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await api.post<{ message: string }>("/auth/verify-email", { email, code: value });
      toast.success(data.message);
      navigate("/", { replace: true, state: { email } });
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Verification failed"));
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (digit && next.every(Boolean)) void verify(next.join(""));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, index) => pasted[index] ?? "");
    setDigits(next);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    if (pasted.length === CODE_LENGTH) void verify(pasted);
  };

  const resend = async () => {
    try {
      setResending(true);
      const { data } = await api.post<{ message: string }>("/auth/resend-verification", { email });
      toast.success(data.message);
      setCooldown(RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Could not resend the code"));
    } finally {
      setResending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void verify(code);
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <strong className="text-gray-800">{email}</strong>. It expires in 10 minutes.
        </>
      }
      footer={
        <>
          Wrong email?{" "}
          <Link to="/signup" className="font-semibold text-brand-500 hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <div className="mb-6 flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <FiMail size={26} />
        </span>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              autoFocus={index === 0}
              aria-label={`Digit ${index + 1}`}
              className="h-14 w-12 rounded-xl border border-gray-300 text-center text-2xl font-semibold text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          ))}
        </div>

        <button type="submit" disabled={submitting || code.length !== CODE_LENGTH} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Didn’t get it? Check spam, or{" "}
        {cooldown > 0 ? (
          <span className="font-medium text-gray-400">resend in {cooldown}s</span>
        ) : (
          <button onClick={() => void resend()} disabled={resending} className="font-semibold text-brand-500 hover:underline disabled:opacity-60">
            {resending ? "sending…" : "resend code"}
          </button>
        )}
      </p>
    </AuthLayout>
  );
}
