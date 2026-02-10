import { Link } from 'react-router-dom';
import type { Tenant } from '../types/domain';

export function TenantOverview({ tenant }: { tenant: Tenant }) {
  const publicUrl = `/t/${tenant.slug}`;

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{tenant.name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Rubro:{' '}
              <span className="font-medium text-gray-900">
                {tenant.type === 'restaurant'
                  ? 'Restaurante'
                  : 'Emprendimiento'}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              WhatsApp:{' '}
              <span className="font-medium text-gray-900">
                {tenant.whatsapp_phone}
              </span>
            </p>
          </div>

          <a
            href={publicUrl}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
            target="_blank"
            rel="noreferrer"
          >
            Ver catálogo público
          </a>
          <Link
            to="/admin/categories"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            Administrar categorías
          </Link>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <div className="text-xs text-gray-500">Link público</div>
          <div className="mt-1 font-mono text-sm">{publicUrl}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-medium">Productos</div>
          <div className="mt-1 text-sm text-gray-600">
            Siguiente: CRUD de productos
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-medium">Categorías</div>
          <div className="mt-1 text-sm text-gray-600">Orden y visibilidad</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-medium">Configuración</div>
          <div className="mt-1 text-sm text-gray-600">
            Delivery, horarios, QR
          </div>
        </div>
      </div>
    </div>
  );
}
