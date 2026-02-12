import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../providers/AuthProviders';
import { useMyTenant } from '../hooks/useMyTenant';

type OptionGroup = {
  id: string;
  tenant_id: string;
  product_id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  sort_order: number;
};

type Option = {
  id: string;
  tenant_id: string;
  group_id: string;
  name: string;
  price_delta: number;
  sort_order: number;
  is_active: boolean;
};

type ProductLite = {
  id: string;
  tenant_id: string;
  name: string;
  base_price: number;
};

export function AdminProductOptionsPage() {
  const { productId } = useParams();
  const { user } = useAuth();
  const { tenant, loading: tenantLoading } = useMyTenant(user?.id);

  const [product, setProduct] = useState<ProductLite | null>(null);

  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [optionsByGroup, setOptionsByGroup] = useState<
    Record<string, Option[]>
  >({});

  // Create group form
  const [gName, setGName] = useState('');
  const [gType, setGType] = useState<'single' | 'multiple'>('single');
  const [gRequired, setGRequired] = useState(false);
  const [gOrder, setGOrder] = useState<number>(0);

  // Drafts for editing orders
  const [groupOrderDraft, setGroupOrderDraft] = useState<
    Record<string, number>
  >({});
  const [optionOrderDraft, setOptionOrderDraft] = useState<
    Record<string, Record<string, number>>
  >({});

  // Create option forms per group
  const [optName, setOptName] = useState<Record<string, string>>({});
  const [optDelta, setOptDelta] = useState<Record<string, number>>({});
  const [optOrder, setOptOrder] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUse = useMemo(
    () => !!tenant?.id && !!productId,
    [tenant?.id, productId],
  );

  const load = async () => {
    if (!tenant?.id || !productId) return;

    setLoading(true);
    setError(null);

    // 1) product
    const prodRes = await supabase
      .from('products')
      .select('id,tenant_id,name,base_price')
      .eq('tenant_id', tenant.id)
      .eq('id', productId)
      .maybeSingle();

    if (prodRes.error) {
      setLoading(false);
      setError(prodRes.error.message);
      return;
    }
    if (!prodRes.data) {
      setLoading(false);
      setProduct(null);
      setGroups([]);
      setOptionsByGroup({});
      return;
    }

    setProduct({
      ...(prodRes.data as ProductLite),
      base_price: Number((prodRes.data as any).base_price ?? 0),
    });

    // 2) groups
    const groupsRes = await supabase
      .from('option_groups')
      .select('id,tenant_id,product_id,name,type,required,sort_order')
      .eq('tenant_id', tenant.id)
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (groupsRes.error) {
      setLoading(false);
      setError(groupsRes.error.message);
      return;
    }

    const gs = (groupsRes.data as OptionGroup[]) ?? [];
    setGroups(gs);

    // drafts for group order
    const go: Record<string, number> = {};
    gs.forEach((g) => (go[g.id] = g.sort_order));
    setGroupOrderDraft(go);

    // 3) options for all groups
    if (gs.length === 0) {
      setOptionsByGroup({});
      setLoading(false);
      return;
    }

    const groupIds = gs.map((g) => g.id);

    const optionsRes = await supabase
      .from('options')
      .select('id,tenant_id,group_id,name,price_delta,sort_order,is_active')
      .eq('tenant_id', tenant.id)
      .in('group_id', groupIds)
      .order('sort_order', { ascending: true });

    if (optionsRes.error) {
      setLoading(false);
      setError(optionsRes.error.message);
      return;
    }

    const allOptions = ((optionsRes.data as Option[]) ?? []).map((o) => ({
      ...o,
      price_delta: Number((o as any).price_delta ?? 0),
    }));

    const by: Record<string, Option[]> = {};
    gs.forEach((g) => (by[g.id] = []));
    allOptions.forEach((o) => {
      if (!by[o.group_id]) by[o.group_id] = [];
      by[o.group_id].push(o);
    });
    setOptionsByGroup(by);

    // drafts for option order
    const od: Record<string, Record<string, number>> = {};
    gs.forEach((g) => {
      od[g.id] = {};
      (by[g.id] ?? []).forEach((o) => (od[g.id][o.id] = o.sort_order));
    });
    setOptionOrderDraft(od);

    setLoading(false);
  };

  useEffect(() => {
    if (!tenantLoading && tenant?.id && productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, tenant?.id, productId]);

  // ---------- Groups ----------
  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id || !productId) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const payload = {
      tenant_id: tenant.id,
      product_id: productId,
      name: gName.trim(),
      type: gType,
      required: gRequired,
      sort_order: Number(gOrder) || 0,
    };

    const { error } = await supabase.from('option_groups').insert(payload);
    setLoading(false);

    if (error) return setError(error.message);

    setGName('');
    setGType('single');
    setGRequired(false);
    setGOrder(0);
    setMsg('Grupo creado ✅');
    await load();
  };

  const saveGroupMeta = async (
    groupId: string,
    patch: Partial<OptionGroup>,
  ) => {
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from('option_groups')
      .update(patch)
      .eq('tenant_id', tenant.id)
      .eq('id', groupId);

    setLoading(false);

    if (error) return setError(error.message);

    setMsg('Grupo actualizado ✅');
    await load();
  };

  const saveGroupOrder = async (group: OptionGroup) => {
    const newOrder = Number(groupOrderDraft[group.id] ?? group.sort_order);
    await saveGroupMeta(group.id, { sort_order: newOrder });
  };

  const deleteGroup = async (groupId: string) => {
    if (!tenant?.id) return;
    if (!confirm('¿Eliminar este grupo? (Se eliminarán sus opciones)')) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from('option_groups')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', groupId);

    setLoading(false);

    if (error) return setError(error.message);

    setMsg('Grupo eliminado ✅');
    await load();
  };

  // ---------- Options ----------
  const createOption = async (groupId: string) => {
    if (!tenant?.id) return;

    const name = (optName[groupId] ?? '').trim();
    const delta = Number(optDelta[groupId] ?? 0) || 0;
    const order = Number(optOrder[groupId] ?? 0) || 0;

    if (name.length < 2) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const payload = {
      tenant_id: tenant.id,
      group_id: groupId,
      name,
      price_delta: delta,
      sort_order: order,
      is_active: true,
    };

    const { error } = await supabase.from('options').insert(payload);
    setLoading(false);

    if (error) return setError(error.message);

    setOptName((p) => ({ ...p, [groupId]: '' }));
    setOptDelta((p) => ({ ...p, [groupId]: 0 }));
    setOptOrder((p) => ({ ...p, [groupId]: 0 }));

    setMsg('Opción creada ✅');
    await load();
  };

  const saveOptionMeta = async (
    groupId: string,
    optionId: string,
    patch: Partial<Option>,
  ) => {
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from('options')
      .update(patch)
      .eq('tenant_id', tenant.id)
      .eq('id', optionId)
      .eq('group_id', groupId);

    setLoading(false);

    if (error) return setError(error.message);

    setMsg('Opción actualizada ✅');
    await load();
  };

  const saveOptionOrder = async (groupId: string, option: Option) => {
    const newOrder = Number(
      optionOrderDraft[groupId]?.[option.id] ?? option.sort_order,
    );
    await saveOptionMeta(groupId, option.id, { sort_order: newOrder });
  };

  const toggleOptionActive = async (groupId: string, option: Option) => {
    await saveOptionMeta(groupId, option.id, { is_active: !option.is_active });
  };

  const deleteOption = async (groupId: string, optionId: string) => {
    if (!tenant?.id) return;
    if (!confirm('¿Eliminar esta opción?')) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase
      .from('options')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', optionId)
      .eq('group_id', groupId);

    setLoading(false);

    if (error) return setError(error.message);

    setMsg('Opción eliminada ✅');
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
        <div className="text-sm text-gray-600">Falta tenant o productId.</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Producto no encontrado.</div>
        <Link
          to="/admin/products"
          className="mt-3 inline-block underline text-sm"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Modificadores / Variantes</h1>
            <p className="mt-1 text-sm text-gray-600">
              Producto: <span className="font-medium">{product.name}</span> ·
              Base: ${product.base_price}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Crea grupos (single/multiple) y opciones con +precio.
            </p>
          </div>
          <Link
            to="/admin/products"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            ← Volver a productos
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {msg && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {msg}
          </div>
        )}
      </div>

      {/* Create Group */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Crear grupo</h2>

        <form
          onSubmit={createGroup}
          className="mt-4 grid gap-3 sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              placeholder="Ej: Tamaño"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              value={gType}
              onChange={(e) => setGType(e.target.value as any)}
            >
              <option value="single">Single (1 opción)</option>
              <option value="multiple">Multiple (varias)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Orden</label>
            <input
              type="number"
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              value={gOrder}
              onChange={(e) => setGOrder(Number(e.target.value))}
            />
          </div>

          <div className="sm:col-span-4 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={gRequired}
                onChange={(e) => setGRequired(e.target.checked)}
              />
              Requerido
            </label>

            <button
              type="submit"
              disabled={loading || gName.trim().length < 2}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? 'Creando...' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </div>

      {/* Groups list */}
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-600">
              Aún no hay grupos. Crea el primero arriba.
            </div>
          </div>
        ) : (
          groups.map((g) => {
            const opts = optionsByGroup[g.id] ?? [];
            const groupDirty =
              (groupOrderDraft[g.id] ?? g.sort_order) !== g.sort_order;

            return (
              <div
                key={g.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-base font-semibold">{g.name}</div>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                        {g.type === 'single' ? 'single' : 'multiple'}
                      </span>
                      {g.required && (
                        <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                          requerido
                        </span>
                      )}
                      <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                        {opts.length} opciones
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Orden</span>
                        <input
                          type="number"
                          className="w-24 rounded-xl border px-3 py-2 text-sm"
                          value={groupOrderDraft[g.id] ?? g.sort_order}
                          onChange={(e) =>
                            setGroupOrderDraft((p) => ({
                              ...p,
                              [g.id]: Number(e.target.value),
                            }))
                          }
                        />
                        <button
                          type="button"
                          disabled={loading || !groupDirty}
                          onClick={() => saveGroupOrder(g)}
                          className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tipo</span>
                        <select
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={g.type}
                          onChange={(e) =>
                            saveGroupMeta(g.id, { type: e.target.value as any })
                          }
                          disabled={loading}
                        >
                          <option value="single">single</option>
                          <option value="multiple">multiple</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={g.required}
                          disabled={loading}
                          onChange={(e) =>
                            saveGroupMeta(g.id, { required: e.target.checked })
                          }
                        />
                        Requerido
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGroup(g.id)}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
                  >
                    Eliminar grupo
                  </button>
                </div>

                {/* Create option */}
                <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                  <div className="text-sm font-semibold">Agregar opción</div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-700">Nombre</label>
                      <input
                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                        placeholder="Ej: Grande"
                        value={optName[g.id] ?? ''}
                        onChange={(e) =>
                          setOptName((p) => ({ ...p, [g.id]: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">+ Precio</label>
                      <input
                        type="number"
                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                        value={optDelta[g.id] ?? 0}
                        onChange={(e) =>
                          setOptDelta((p) => ({
                            ...p,
                            [g.id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Orden</label>
                      <input
                        type="number"
                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                        value={optOrder[g.id] ?? 0}
                        onChange={(e) =>
                          setOptOrder((p) => ({
                            ...p,
                            [g.id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => createOption(g.id)}
                        disabled={
                          loading || (optName[g.id] ?? '').trim().length < 2
                        }
                        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {loading ? 'Guardando...' : 'Crear opción'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Options list */}
                {opts.length === 0 ? (
                  <div className="mt-4 text-sm text-gray-600">
                    Aún no hay opciones en este grupo.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2">
                    {opts.map((o) => {
                      const od = optionOrderDraft[g.id]?.[o.id] ?? o.sort_order;
                      const optDirty = od !== o.sort_order;

                      return (
                        <div
                          key={o.id}
                          className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {o.name}{' '}
                              <span className="text-sm text-gray-600">
                                {o.price_delta >= 0
                                  ? `(+${o.price_delta})`
                                  : `(${o.price_delta})`}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {o.is_active ? 'Activa' : 'Inactiva'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Orden
                              </span>
                              <input
                                type="number"
                                className="w-24 rounded-xl border px-3 py-2 text-sm"
                                value={od}
                                onChange={(e) =>
                                  setOptionOrderDraft((prev) => ({
                                    ...prev,
                                    [g.id]: {
                                      ...(prev[g.id] ?? {}),
                                      [o.id]: Number(e.target.value),
                                    },
                                  }))
                                }
                              />
                              <button
                                type="button"
                                disabled={loading || !optDirty}
                                onClick={() => saveOptionOrder(g.id, o)}
                                className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                              >
                                Guardar
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleOptionActive(g.id, o)}
                              disabled={loading}
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              {o.is_active ? 'Desactivar' : 'Activar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteOption(g.id, o.id)}
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
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
            );
          })
        )}
      </div>
    </div>
  );
}
