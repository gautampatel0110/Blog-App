import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Pages from "./pages/Pages";
import CreatePage from "./pages/CreatePage";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import BlogPreview from "./pages/BlogPreview";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
  <Route path="/blog/:slug" element={<BlogPreview />} />
        <Route path="/preview/:id" element={<ProtectedRoute><BlogPreview adminPreview /></ProtectedRoute>} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/create-page" element={<CreatePage />} />
          <Route path="/edit/:id" element={<CreatePage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
