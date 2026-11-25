import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
}

/** Shared shell for login, sign-up, verification and password pages. */
export default function AuthLayout({ title, subtitle, footer, children }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-brand-50 via-gray-50 to-gray-50 px-4 py-12 sm:py-16">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-400 text-sm font-bold text-white shadow-sm">
          B
        </span>
        <span className="text-lg font-semibold text-gray-900">Rapid Page Generator</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <p className="mt-6 text-sm text-gray-600">{footer}</p>}
    </div>
  );
}
