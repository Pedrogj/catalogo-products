import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../supabase/supabaseClient';
import { useMyTenant } from '../hooks/useMyTenant';
import { useAuth } from '../providers/AuthProviders';
import { addImageRow, uploadProductImage } from '../helpers/uploadImage';
import {
  productSchema,
  type ProductFormValues,
} from '../schemas/product.schema';
import { Alert } from '../ui/components/Alert';

type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
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

  const [createImage, setCreateImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsSoldOut, setEditIsSoldOut] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const createImageRef = useRef<HTMLInputElement | null>(null);

  const resolver = zodResolver(
    productSchema,
  ) as unknown as Resolver<ProductFormValues>;

  const form = useForm<ProductFormValues>({
    resolver,
    defaultValues: {
      name: '',
      base_price: 0,
      description: '',
      category_id: '',
      is_active: true,
      is_sold_out: false,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

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
        .select(
          'id,name,description,base_price,category_id,is_active,is_sold_out',
        )
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
    if (cats[0]?.id) setValue('category_id', cats[0].id);
  };

  useEffect(() => {
    if (!tenantLoading && tenant?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, tenant?.id]);

  const onCreate = handleSubmit(async (values) => {
    if (!tenant?.id) return;

    setError(null);
    setMsg(null);

    try {
      const payload = {
        tenant_id: tenant.id,
        name: values.name.trim(),
        description: values.description?.trim()
          ? values.description.trim()
          : null,
        base_price: Math.max(0, Number(values.base_price) || 0),
        category_id: values.category_id || null,
        is_active: values.is_active,
        is_sold_out: values.is_sold_out,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      if (createImage && inserted?.id) {
        const url = await uploadProductImage(
          createImage,
          tenant.id,
          inserted.id,
        );
        await addImageRow(tenant.id, inserted.id, url);
        setCreateImage(null);
        if (createImageRef.current) createImageRef.current.value = '';
      }

      reset({
        name: '',
        base_price: 0,
        description: '',
        category_id: categories[0]?.id ?? '',
        is_active: true,
        is_sold_out: false,
      });

      setMsg('Producto creado ✅');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Error creando producto');
    }
  });

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

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditName(p.name);
    setEditDescription(p.description ?? '');
    setEditPrice(Number(p.base_price ?? 0));
    setEditCategoryId(p.category_id ?? '');
    setEditIsActive(!!p.is_active);
    setEditIsSoldOut(!!p.is_sold_out);
  };

  const onSaveEdit = async () => {
    if (!tenant?.id || !editing) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const payload = {
      name: editName.trim(),
      description: editDescription.trim() || null,
      base_price: Math.max(0, Number(editPrice) || 0),
      category_id: editCategoryId || null,
      is_active: editIsActive,
      is_sold_out: editIsSoldOut,
    };

    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editing.id)
      .eq('tenant_id', tenant.id);

    setLoading(false);

    if (error) return setError(error.message);

    setMsg('Producto actualizado ✅');
    setEditing(null);
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
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
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
              {...register('base_price')}
            />
            {errors.base_price && (
              <p className="text-xs text-red-600">
                {errors.base_price.message}
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              placeholder="Ej: Hamburguesa doble con queso, papas y bebida."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              disabled={categories.length === 0}
              {...register('category_id')}
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
              <input
                type="checkbox"
                {...register('is_active')}
              />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                {...register('is_sold_out')}
              />
              Agotado
            </label>
          </div>

          <div className="sm:col-span-2">
            {error && (
              <Alert
                variant="error"
                title="Error"
                message={error}
                onClose={() => setError(null)}
              />
            )}

            {msg && (
              <Alert
                variant="success"
                message={msg}
                onClose={() => setMsg(null)}
                autoCloseMs={2500}
                className="mt-2"
              />
            )}

            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? 'Guardando...' : 'Crear producto'}
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
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Editar producto</h3>
                <p className="text-xs text-gray-500">{editing.name}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  <option value="">Sin categoría (Otros)</option>
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

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Subir imagen
                </label>
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f || !tenant?.id || !editing) return;
                    try {
                      setLoading(true);
                      const url = await uploadProductImage(
                        f,
                        tenant.id,
                        editing.id,
                      );
                      await addImageRow(tenant.id, editing.id, url);
                      setMsg('Imagen subida ✅');
                    } catch (err: any) {
                      setError(err.message ?? 'Error subiendo imagen');
                    } finally {
                      setLoading(false);
                      await load(); // si luego cargas imágenes por producto
                    }
                  }}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  Activo
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editIsSoldOut}
                    onChange={(e) => setEditIsSoldOut(e.target.checked)}
                  />
                  Agotado
                </label>
              </div>

              <button
                onClick={onSaveEdit}
                disabled={loading || editName.trim().length < 2}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
