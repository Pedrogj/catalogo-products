import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { supabase } from "../supabase/supabaseClient";
import { useMyTenant } from "../hooks/useMyTenant";
import { useAuth } from "../providers/AuthProviders";

import { addImageRow, uploadProductImage } from "../helpers/uploadImage";
import {
  productCreateSchema,
  productEditSchema,
  type ProductEditValues,
  type ProductCreateValues,
} from "../schemas/product.schema";

type Category = { id: string; name: string; sort_order: number };

type Product = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string | null;
  is_active: boolean;
  is_sold_out: boolean;
};

type ProductWithThumb = Product & { thumbUrl: string | null };

type ProductRow = Product & {
  product_images?: { url: string; sort_order: number }[] | null;
};

export function AdminProductsPage() {
  const { user } = useAuth();
  const { tenant, loading: tenantLoading } = useMyTenant(user?.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithThumb[]>([]);

  const [editing, setEditing] = useState<Product | null>(null);

  const [createImage, setCreateImage] = useState<File | null>(null);

  const createImageRef = useRef<HTMLInputElement | null>(null);
  const editImageRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState<{
    load?: boolean;
    create?: boolean;
    edit?: boolean;
    delId?: string | null;
    uploadImg?: boolean;
  }>({
    load: false,
    create: false,
    edit: false,
    delId: null,
    uploadImg: false,
  });

  const canUse = useMemo(() => !!tenant?.id, [tenant?.id]);

  // -----------------------------
  // Create form (RHF + Zod)
  // -----------------------------
  const createResolver = zodResolver(
    productCreateSchema,
  ) as unknown as Resolver<ProductCreateValues>;

  const createForm = useForm<ProductCreateValues>({
    resolver: createResolver,
    mode: "onBlur",
    defaultValues: {
      name: "",
      base_price: 0,
      description: "",
      category_id: "",
      is_active: true,
      is_sold_out: false,
    },
  });

  const {
    register: registerCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    setValue: setCreateValue,
    formState: {
      errors: createErrors,
      isSubmitting: creatingSubmitting,
      isValid: createValid,
    },
  } = createForm;

  // -----------------------------
  // Edit form (RHF + Zod)
  // -----------------------------
  const editResolver = zodResolver(
    productEditSchema,
  ) as unknown as Resolver<ProductEditValues>;

  const editForm = useForm<ProductEditValues>({
    resolver: editResolver,
    mode: "onBlur",
    defaultValues: {
      name: "",
      base_price: 0,
      description: "",
      category_id: "",
      is_active: true,
      is_sold_out: false,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: {
      errors: editErrors,
      isSubmitting: editSubmitting,
      isValid: editValid,
      isDirty: editDirty,
    },
  } = editForm;

  // -----------------------------
  // Load data
  // -----------------------------
  const load = async () => {
    if (!tenant?.id) return;

    setBusy((p) => ({ ...p, load: true }));

    const [catRes, prodRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id,name,sort_order")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("products")
        .select(
          `
          id,tenant_id,
          name,
          description,
          base_price,
          category_id,
          is_active,
          is_sold_out,
          product_images (
           url,
           sort_order
          )
          `,
        )
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false }),
    ]);

    setBusy((p) => ({ ...p, load: false }));

    if (catRes.error) {
      toast.error(catRes.error.message);
      return;
    }
    if (prodRes.error) {
      toast.error(prodRes.error.message);
      return;
    }

    const cats = (catRes.data as Category[]) ?? [];
    setCategories(cats);

    const rows = (prodRes.data as ProductRow[]) ?? [];

    const nextProducts: ProductWithThumb[] = rows.map((p) => {
      const imgs = (p.product_images ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const thumbUrl = imgs[0]?.url ?? null;

      return {
        ...p,
        base_price: Number(p.base_price ?? 0),
        thumbUrl,
      };
    });

    setProducts(nextProducts);

    if (cats[0]?.id) setCreateValue("category_id", cats[0].id);
  };

  useEffect(() => {
    if (!tenantLoading && tenant?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, tenant?.id]);

  // -----------------------------
  // Create product
  // -----------------------------
  const onCreate = submitCreate(async (values) => {
    if (!tenant?.id) return;

    setBusy((p) => ({ ...p, create: true }));

    try {
      const payload = {
        tenant_id: tenant.id,
        name: values.name.trim(),
        description: values.description?.trim()
          ? values.description.trim()
          : null,
        base_price: Math.max(0, Number(values.base_price) || 0),
        category_id: values.category_id ? values.category_id : null,
        is_active: !!values.is_active,
        is_sold_out: !!values.is_sold_out,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // subir imagen si viene
      if (createImage && inserted?.id) {
        setBusy((p) => ({ ...p, uploadImg: true }));
        try {
          const url = await uploadProductImage(
            createImage,
            tenant.id,
            inserted.id,
          );
          await addImageRow(tenant.id, inserted.id, url);
          toast.success("Producto creado + imagen subida");
        } finally {
          setBusy((p) => ({ ...p, uploadImg: false }));
        }
      } else {
        toast.success("Producto creado");
      }

      // reset form
      resetCreate({
        name: "",
        base_price: 0,
        description: "",
        category_id: categories[0]?.id ?? "",
        is_active: true,
        is_sold_out: false,
      });

      setCreateImage(null);
      if (createImageRef.current) createImageRef.current.value = "";

      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Error creando producto");
    } finally {
      setBusy((p) => ({ ...p, create: false }));
    }
  });

  // -----------------------------
  // Delete product
  // -----------------------------
  const onDelete = async (id: string) => {
    if (!tenant?.id) return;
    if (!confirm("¿Eliminar este producto?")) return;

    setBusy((p) => ({ ...p, delId: id }));

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    setBusy((p) => ({ ...p, delId: null }));

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Producto eliminado");
    await load();
  };

  // -----------------------------
  // Open edit modal
  // -----------------------------
  const openEdit = (p: Product) => {
    setEditing(p);
    resetEdit({
      name: p.name ?? "",
      description: p.description ?? "",
      base_price: Number(p.base_price ?? 0),
      category_id: p.category_id ?? "",
      is_active: !!p.is_active,
      is_sold_out: !!p.is_sold_out,
    });
    if (editImageRef.current) editImageRef.current.value = "";
  };

  // -----------------------------
  // Save edit (RHF submit)
  // -----------------------------
  const onSaveEdit = submitEdit(async (values) => {
    if (!tenant?.id || !editing) return;

    setBusy((p) => ({ ...p, edit: true }));

    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim()
          ? values.description.trim()
          : null,
        base_price: Math.max(0, Number(values.base_price) || 0),
        category_id: values.category_id ? values.category_id : null,
        is_active: !!values.is_active,
        is_sold_out: !!values.is_sold_out,
      };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editing.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      toast.success("Producto actualizado");
      resetEdit(values); // marca como no dirty
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Error actualizando producto");
    } finally {
      setBusy((p) => ({ ...p, edit: false }));
    }
  });

  // -----------------------------
  // Upload image in edit modal
  // -----------------------------
  const uploadEditImage = async (file: File) => {
    if (!tenant?.id || !editing) return;

    setBusy((p) => ({ ...p, uploadImg: true }));

    try {
      const url = await uploadProductImage(file, tenant.id, editing.id);
      await addImageRow(tenant.id, editing.id, url);
      toast.success("Imagen subida");
      if (editImageRef.current) editImageRef.current.value = "";
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Error subiendo imagen");
    } finally {
      setBusy((p) => ({ ...p, uploadImg: false }));
    }
  };

  // -----------------------------
  // UI states
  // -----------------------------
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
          Crea productos y aparecerán en tu catálogo público.
        </p>
      </div>

      {/* Create product */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Crear producto</h2>

        {categories.length === 0 && (
          <div className="mt-3 rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Primero crea al menos 1 categoría (o deja productos en “Otros”).
          </div>
        )}

        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              placeholder="Ej: Hamburguesa Doble"
              {...registerCreate("name")}
            />
            {createErrors.name && (
              <p className="text-xs text-red-600">
                {createErrors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Precio (CLP)
            </label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              type="number"
              min={0}
              {...registerCreate("base_price", { valueAsNumber: true })}
            />
            {createErrors.base_price && (
              <p className="text-xs text-red-600">
                {createErrors.base_price.message}
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              rows={3}
              placeholder="Ej: Doble con queso + papas."
              {...registerCreate("description")}
            />
            {createErrors.description && (
              <p className="text-xs text-red-600">
                {createErrors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              {...registerCreate("category_id")}
            >
              <option value="">Sin categoría (Otros)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {createErrors.category_id && (
              <p className="text-xs text-red-600">
                {createErrors.category_id.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Imagen (opcional)
            </label>
            <input
              ref={createImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => setCreateImage(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...registerCreate("is_active")} />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...registerCreate("is_sold_out")} />
              Agotado
            </label>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy.create || creatingSubmitting || !createValid}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {busy.create
                ? "Guardando..."
                : busy.uploadImg
                  ? "Subiendo imagen..."
                  : "Crear producto"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
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

        {products.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            Aún no tienes productos.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.thumbUrl ? (
                    <img
                      src={p.thumbUrl}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl border bg-gray-50 grid place-items-center text-xs text-gray-400">
                      sin img
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      ${p.base_price} · {p.is_active ? "Activo" : "Inactivo"}{" "}
                      {p.is_sold_out ? "· Agotado" : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Editar
                  </button>

                  <Link
                    to={`/admin/products/${p.id}/options`}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Modificadores
                  </Link>

                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    disabled={busy.delId === p.id}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {busy.delId === p.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Editar producto</h3>
                <p className="text-xs text-gray-500">{editing.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
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
                  Precio
                </label>
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border px-3 py-2 text-sm"
                  {...registerEdit("base_price", { valueAsNumber: true })}
                />
                {editErrors.base_price && (
                  <p className="text-xs text-red-600">
                    {editErrors.base_price.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  className="rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                  {...registerEdit("description")}
                />
                {editErrors.description && (
                  <p className="text-xs text-red-600">
                    {editErrors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  {...registerEdit("category_id")}
                >
                  <option value="">Sin categoría (Otros)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...registerEdit("is_active")} />
                  Activo
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...registerEdit("is_sold_out")} />
                  Agotado
                </label>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Subir imagen
                </label>
                <input
                  ref={editImageRef}
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  disabled={busy.uploadImg}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadEditImage(f);
                  }}
                />
                <p className="text-xs text-gray-500">
                  Se guardará como nueva imagen del producto (tu lógica decide
                  cuál es principal por sort_order).
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  busy.edit || editSubmitting || !editValid || !editDirty
                }
                className="mt-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
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
