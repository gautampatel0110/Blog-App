import { FiFileText, FiGrid, FiLogOut, FiPlus } from "react-icons/fi";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { IconType } from "react-icons";
import api from "../services/api";
import { useCurrentUser } from "../services/authContext";
import { initials } from "../utils/content";

const NAV_ITEMS: { to: string; label: string; icon: IconType }[] = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/pages", label: "All pages", icon: FiFileText },
];

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
      {label}
    </span>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      toast.error("Could not reach the server, signing you out locally");
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-[72px] shrink-0 flex-col items-center justify-between border-r border-gray-200 bg-white py-5">
        <div className="flex flex-col items-center gap-2">
          <NavLink
            to="/dashboard"
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-400 text-sm font-bold text-white shadow-sm"
            aria-label="Home"
          >
            B
          </NavLink>

          <button
            onClick={() => navigate("/create-page")}
            className="group relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
            aria-label="New page"
          >
            <FiPlus size={20} />
            <Tooltip label="New page" />
          </button>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-brand-50 text-brand-500" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`
              }
            >
              <Icon size={20} />
              <Tooltip label={label} />
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleLogout}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Log out"
          >
            <FiLogOut size={19} />
            <Tooltip label="Log out" />
          </button>

          <div className="group relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-xs font-semibold text-white">
              {initials(user?.name)}
            </div>
            {user && <Tooltip label={`${user.name} · ${user.email}`} />}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
