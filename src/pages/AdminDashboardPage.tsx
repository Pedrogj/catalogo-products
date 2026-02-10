import { CreateTenantForm } from '../components/CreateTenantForm';
import { TenantOverview } from '../components/TenantOverview';
import { useMyTenant } from '../hooks/useMyTenant';
import { useAuth } from '../providers/AuthProviders';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { tenant, loading, error, refresh } = useMyTenant(user?.id);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Cargando tu negocio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="text-sm text-red-700">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sesión:{' '}
          <span className="font-medium text-gray-900">{user?.email}</span>
        </p>
      </div>

      {!tenant ? (
        <CreateTenantForm
          userId={user!.id}
          onCreated={refresh}
        />
      ) : (
        <TenantOverview tenant={tenant} />
      )}
    </div>
  );
}
