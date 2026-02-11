import React, { useEffect, useMemo, useState } from 'react';

import { useMyTenant } from '../hooks/useMyTenant';
import { useAuth } from '../providers/AuthProviders';
import { supabase } from '../supabase/supabaseClient';

type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  name: string;
  base_price: number;
  category_id: string | null;
  is_active: boolean;
  is_sold_out: boolean;
};

export function AdminProductsPage() {
  const { user } = useAuth();
  const { tenant, loading: tenantLoading } = useMyTenant(user?.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isSoldOut, setIsSoldOut] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUse = useMemo(() => !!tenant?.id, [tenant?.id]);

  const load = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);

    const [catRes, prodRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id,name,sort_order')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      supabase
        .from('products')
        .select('id,name,base_price,category_id,is_active,is_sold_out')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false }),
    ]);

    setLoading(false);

    if (catRes.error) return setError(catRes.error.message);
    if (prodRes.error) return setError(prodRes.error.message);

    const cats = (catRes.data as Category[]) ?? [];
    setCategories(cats);
    setProducts(
      ((prodRes.data as Product[]) ?? []).map((p) => ({
        ...p,
        base_price: Number(p.base_price ?? 0),
      })),
    );

    // set categoría por defecto si existe
    if (!categoryId && cats[0]?.id) setCategoryId(cats[0].id);
  };

  useEffect(() => {
    if (!tenantLoading && tenant?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, tenant?.id]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const payload = {
      tenant_id: tenant.id,
      name: name.trim(),
      base_price: Math.max(0, Number(price) || 0),
      category_id: categoryId || null,
      is_active: isActive,
      is_sold_out: isSoldOut,
    };

    const { error } = await supabase.from('products').insert(payload);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName('');
    setPrice(0);
    setIsActive(true);
    setIsSoldOut(false);
    setMsg('Producto creado ✅');
    await load();
  };

  const onDelete = async (id: string) => {
    if (!tenant?.id) return;
    if (!confirm('¿Eliminar este producto?')) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMsg('Producto eliminado ✅');
    await load();
  };

  if (tenantLoading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">
          Primero crea tu negocio (tenant).
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Productos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Crea productos y así aparecerán en tu catálogo público.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Crear producto</h2>

        {categories.length === 0 && (
          <div className="mt-3 rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Primero crea al menos 1 categoría.
          </div>
        )}

        <form
          onSubmit={onCreate}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              placeholder="Ej: Hamburguesa Doble"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Precio (CLP)
            </label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categories.length === 0}
            >
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isSoldOut}
                onChange={(e) => setIsSoldOut(e.target.checked)}
              />
              Agotado
            </label>
          </div>

          <div className="sm:col-span-2">
            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {msg && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading || categories.length === 0 || name.trim().length < 2
              }
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? 'Guardando...' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Listado</h2>
          <button
            onClick={load}
            className="text-sm underline underline-offset-4 text-gray-700"
          >
            Refrescar
          </button>
        </div>

        {products.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            Aún no tienes productos.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    ${p.base_price} · {p.is_active ? 'Activo' : 'Inactivo'}{' '}
                    {p.is_sold_out ? '· Agotado' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
