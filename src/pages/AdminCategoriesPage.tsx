import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAuth } from "../providers/AuthProviders";
import { useMyTenant } from "../hooks/useMyTenant";
import {
  categoryCreateSchema,
  categoryEditSchema,
  type CategoryCreateValues,
  type CategoryEditValues,
} from "../schemas/category.schema";

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
  const [editing, setEditing] = useState<Category | null>(null);

  const [busy, setBusy] = useState<{
    create?: boolean;
    save?: string | null;
    del?: string | null;
    load?: boolean;
    edit?: boolean;
  }>({
    create: false,
    save: null,
    del: null,
    load: false,
    edit: false,
  });

  const canUse = useMemo(() => !!tenant?.id, [tenant?.id]);

  // Create Category form validation
  const createResolver = zodResolver(
    categoryCreateSchema,
  ) as unknown as Resolver<CategoryCreateValues>;

  const createForm = useForm<CategoryCreateValues>({
    resolver: createResolver,
    mode: "onChange",
    defaultValues: {
      name: "",
      sort_order: 0,
    },
  });

  const {
    register: registerCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    formState: {
      errors: createErrors,
      isSubmitting: creating,
      isValid: createValid,
    },
  } = createForm;

  // Edit category form validation
  const editResolver = zodResolver(
    categoryEditSchema,
  ) as unknown as Resolver<CategoryEditValues>;

  const editForm = useForm<CategoryEditValues>({
    resolver: editResolver,
    mode: "onChange",
    defaultValues: { name: "", sort_order: 0, is_active: true },
  });

  const {
    register: registerEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: {
      errors: editErrors,
      isSubmitting: editingSubmitting,
      isValid: editValid,
      isDirty: editDirty,
    },
  } = editForm;

  const load = async () => {
    if (!tenant?.id) return;

    setBusy((p) => ({ ...p, load: true }));

    const { data, error } = await supabase
      .from("categories")
      .select("id,tenant_id,name,sort_order,is_active")
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    setBusy((p) => ({ ...p, load: false }));

    if (error) {
      toast.error(error.message);
      return;
    }

    setItems((data as Category[]) ?? []);
  };

  useEffect(() => {
    if (!tenantLoading && tenant?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, tenant?.id]);

  // Oper Modal Edit
  const openEdit = (c: Category) => {
    setEditing(c);
    resetEdit({
      name: c.name ?? "",
      sort_order: Number(c.sort_order ?? 0),
      is_active: !!c.is_active,
    });
  };

  const onCreate = submitCreate(async (values) => {
    if (!tenant?.id) return;

    setBusy((p) => ({ ...p, create: true }));

    const payload = {
      tenant_id: tenant.id,
      name: values.name.trim(),
      sort_order: Number(values.sort_order) || 0,
      is_active: true,
    };

    const { error } = await supabase.from("categories").insert(payload);

    setBusy((p) => ({ ...p, create: false }));

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        toast.error("Ya existe una categoría con ese nombre.");
        return;
      }
      toast.error(error.message);
      return;
    }

    resetCreate({ name: "", sort_order: 0 });
    toast.success("Categoría creada");
    await load();
  });

  const onDelete = async (id: string) => {
    if (!tenant?.id) return;

    const ok = confirm("¿Eliminar esta categoría?");
    if (!ok) return;

    setBusy((p) => ({ ...p, del: id }));

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    setBusy((p) => ({ ...p, del: null }));

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Categoría eliminada");
    await load();
  };

  const onSaveEdit = submitEdit(async (values) => {
    if (!tenant?.id || !editing) return;

    setBusy((p) => ({ ...p, edit: true }));

    const payload = {
      name: values.name.trim(),
      sort_order: Number(values.sort_order) || 0,
      is_active: values.is_active,
    };

    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", editing.id)
      .eq("tenant_id", tenant.id);

    setBusy((p) => ({ ...p, edit: false }));

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        toast.error("Ya existe una categoría con ese nombre.");
        return;
      }
      toast.error(error.message);
      return;
    }

    resetEdit(values);
    toast.success("Categoría actualizada");
    setEditing(null);
    await load();
  });

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
              {...registerCreate("name")}
            />
            {createErrors.name && (
              <p className="mt-1 text-xs text-red-600">
                {createErrors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Orden</label>
            <input
              type="number"
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              {...registerCreate("sort_order", { valueAsNumber: true })}
            />
            {createErrors.sort_order && (
              <p className="mt-1 text-xs text-red-600">
                {createErrors.sort_order.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={busy.create || creating || !createValid}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {busy.create ? "Guardando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Listado</h2>
          <button
            onClick={load}
            disabled={busy.load}
            className="text-sm underline underline-offset-4 text-gray-700 disabled:opacity-50"
          >
            {busy.load ? "Actualizando..." : "Refrescar"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            Aún no tienes categorías.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {items.map((c) => {
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
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      disabled={busy.del === c.id}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      disabled={busy.del === c.id}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      {busy.del === c.id ? "Eliminando..." : "Eliminar"}
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

      {/* Modal Edition */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Editar categoría</h3>
                <p className="text-xs text-gray-500">{editing.name}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  resetEdit({ name: "", sort_order: 0, is_active: true });
                }}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  {...registerEdit("name")}
                />
                {editErrors.name && (
                  <p className="text-xs text-red-600">
                    {editErrors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Orden
                </label>
                <input
                  type="number"
                  className="rounded-xl border px-3 py-2 text-sm"
                  {...registerEdit("sort_order", { valueAsNumber: true })}
                />
                {editErrors.sort_order && (
                  <p className="text-xs text-red-600">
                    {editErrors.sort_order.message}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...registerEdit("is_active")} />
                Activa (visible en catálogo)
              </label>

              <button
                type="submit"
                disabled={
                  busy.edit || editingSubmitting || !editValid || !editDirty
                }
                className="mt-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy.edit ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
