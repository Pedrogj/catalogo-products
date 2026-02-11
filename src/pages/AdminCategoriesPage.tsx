import React, { useEffect, useMemo, useState } from "react";

import { useMyTenant } from "../hooks/useMyTenant";
import { useAuth } from "../providers/AuthProviders";
import { supabase } from "../supabase/supabaseClient";

type Category = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export function AdminCategoriesPage() {
  const { user } = useAuth();
  const { tenant, loading: tenantLoading } = useMyTenant(user?.id);

  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<Record<string, number>>({});

  const canUse = useMemo(() => !!tenant?.id, [tenant?.id]);

  const load = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("categories")
      .select("id,tenant_id,name,sort_order,is_active")
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((data as Category[]) ?? []);
    const nextDraft: Record<string, number> = {};
    (data as Category[] | null)?.forEach((c) => {
      nextDraft[c.id] = c.sort_order;
    });
    setOrderDraft(nextDraft);
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
      sort_order: sortOrder,
      is_active: true,
    };

    const { error } = await supabase.from("categories").insert(payload);

    setLoading(false);

    if (error) {
      // por tu índice unique (tenant_id, lower(name))
      if (error.message.toLowerCase().includes("duplicate")) {
        setError("Ya existe una categoría con ese nombre.");
        return;
      }
      setError(error.message);
      return;
    }

    setName("");
    setSortOrder(0);
    setMsg("Categoría creada ✅");
    await load();
  };

  const onDelete = async (id: string) => {
    if (!tenant?.id) return;

    const ok = confirm("¿Eliminar esta categoría?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMsg("Categoría eliminada ✅");
    await load();
  };

  const onSaveOrder = async (id: string) => {
    if (!tenant?.id) return;

    const newOrder = Number(orderDraft[id] ?? 0);

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from("categories")
      .update({ sort_order: newOrder })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMsg("Orden actualizado ✅");
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
          Primero debes crear tu negocio (tenant) en el dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Categorías</h1>
        <p className="mt-1 text-sm text-gray-600">
          Estas categorías se verán en tu catálogo público.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Crear categoría</h2>

        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              placeholder="Ej: Hamburguesas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Orden</label>
            <input
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>

          <div className="sm:col-span-3">
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
              disabled={loading || name.trim().length < 2}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? "Guardando..." : "Crear"}
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

        {items.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            Aún no tienes categorías.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {items.map((c) => {
              const isDirty =
                (orderDraft[c.id] ?? c.sort_order) !== c.sort_order;

              return (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      Orden actual: {c.sort_order}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Nuevo</span>
                      <input
                        type="number"
                        className="w-24 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                        value={orderDraft[c.id] ?? c.sort_order}
                        onChange={(e) =>
                          setOrderDraft((prev) => ({
                            ...prev,
                            [c.id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onSaveOrder(c.id)}
                      disabled={loading || !isDirty}
                      className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      Guardar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">
          Tip: abre tu catálogo público y actualiza para ver los cambios:
          <span className="ml-2 font-mono">/t/{tenant?.slug}</span>
        </div>
      </div>
    </div>
  );
}
