import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProviders";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-gray-600">Cargando sesión...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
