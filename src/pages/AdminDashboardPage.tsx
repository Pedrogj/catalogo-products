import { useAuth } from "../providers/AuthProviders";

export function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sesión iniciada como{" "}
          <span className="font-medium text-gray-900">{user?.email}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">Siguiente paso</div>
          <div className="mt-2 text-sm text-gray-600">
            Crear tu negocio (tenant) y habilitar “Catálogo público”.
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">Luego</div>
          <div className="mt-2 text-sm text-gray-600">
            CRUD de productos, categorías e imágenes.
          </div>
        </div>
      </div>
    </div>
  );
}
