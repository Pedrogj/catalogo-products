import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminRegisterPage } from "../pages/AdminRegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen grid place-items-center">
              <div className="text-sm text-gray-600">404</div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
