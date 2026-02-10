import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchCategoriesByTenant,
  fetchTenantBySlug,
} from '../api/catalog/catalog.api';

type TenantLite = {
  id: string;
  name: string;
  slug: string;
  type: 'restaurant' | 'entrepreneur';
  whatsapp_phone: string;
  logo_url: string | null;
  primary_color: string | null;
  address: string | null;
  delivery_fee: number;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  lead_time_text: string | null;
  is_active: boolean;
};

type CategoryLite = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export function CatalogPage() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState<TenantLite | null>(null);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      const { data: tenantData, error: tenantError } =
        await fetchTenantBySlug(slug);

      if (tenantError) {
        setError(tenantError.message);
        setLoading(false);
        return;
      }

      if (!tenantData) {
        setTenant(null);
        setCategories([]);
        setLoading(false);
        return;
      }

      // Si el tenant está inactivo, puedes bloquear (por suscripción)
      if (tenantData.is_active === false) {
        setTenant(tenantData as TenantLite);
        setCategories([]);
        setLoading(false);
        return;
      }

      setTenant(tenantData as TenantLite);

      const { data: categoriesData, error: categoriesError } =
        await fetchCategoriesByTenant(tenantData.id);

      if (categoriesError) {
        setError(categoriesError.message);
        setCategories([]);
        setLoading(false);
        return;
      }

      setCategories((categoriesData as CategoryLite[]) ?? []);
      setLoading(false);
    };

    run();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center">
        <div className="text-sm text-gray-600">Cargando catálogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="text-sm text-red-700">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Catálogo no encontrado</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revisa el link o el slug del negocio.
          </p>
        </div>
      </div>
    );
  }

  if (tenant.is_active === false) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">{tenant.name}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Este catálogo está temporalmente inactivo.
          </p>
        </div>
      </div>
    );
  }

  const waLink = `https://wa.me/${tenant.whatsapp_phone.replace(/[^\d]/g, '')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header catálogo */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-black text-white grid place-items-center font-semibold">
                {tenant.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {tenant.name}
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                {tenant.type === 'restaurant'
                  ? 'Restaurante'
                  : 'Emprendimiento'}
                {tenant.lead_time_text ? ` · ${tenant.lead_time_text}` : ''}
              </p>
            </div>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90 active:scale-[0.99]"
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Info delivery */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-medium">Opciones</div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
            {tenant.pickup_enabled && (
              <span className="rounded-full border px-3 py-1">Retiro</span>
            )}
            {tenant.delivery_enabled && (
              <span className="rounded-full border px-3 py-1">
                Delivery{' '}
                {tenant.delivery_fee > 0 ? `· $${tenant.delivery_fee}` : ''}
              </span>
            )}
            {tenant.address && (
              <span className="rounded-full border px-3 py-1">
                {tenant.address}
              </span>
            )}
          </div>
        </div>

        {/* Categorías (placeholder) */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Categorías</h2>
            <span className="text-xs text-gray-500">
              {categories.length
                ? `${categories.length} disponibles`
                : 'Aún no hay categorías'}
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="mt-3 rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600">
                Este negocio todavía no ha cargado categorías.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                (Próximo paso: CRUD de categorías y productos)
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Pronto: productos de esta categoría
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
