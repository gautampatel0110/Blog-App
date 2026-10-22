import {
  FiPlusSquare,
  FiGrid,
  FiFileText,
  FiLogOut,
} from "react-icons/fi";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r flex flex-col items-center py-4 justify-between">

        {/* TOP SECTION */}
        <div className="flex flex-col items-center gap-6">
          {/* Create Page */}
          <button
            onClick={() => navigate("/create-page")}
            className="text-[#5B4CF5]"
          >
            <FiPlusSquare size={22} />
          </button>

          {/* Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[#5B4CF5]"
          >
            <FiGrid size={22} />
          </button>

          {/* Pages */}
          <button
            onClick={() => navigate("/pages")}
            className="text-gray-400 hover:text-[#5B4CF5]"
          >
            <FiFileText size={22} />
          </button>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-[#5B4CF5]"
          >
            <FiLogOut size={20} />
          </button>

          <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-medium text-white">
            GP
          </div>
        </div>
      </aside>

      {/* Page Content */}
      <main className="flex-1 bg-white overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
