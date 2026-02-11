import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabase/supabaseClient';

type TenantLite = {
  id: string;
  name: string;
  slug: string;
  whatsapp_phone: string;
  address: string | null;
  delivery_fee: number;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  lead_time_text: string | null;
  is_active: boolean;
};

type Fulfillment = 'pickup' | 'delivery';

function buildWhatsAppMessage(params: {
  tenantName: string;
  items: { name: string; qty: number; price: number }[];
  fulfillment: Fulfillment;
  deliveryFee: number;
  address?: string;
  customerName: string;
  note?: string;
}) {
  const {
    tenantName,
    items,
    fulfillment,
    deliveryFee,
    address,
    customerName,
    note,
  } = params;

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = subtotal + (fulfillment === 'delivery' ? deliveryFee : 0);

  const lines = items.map(
    (it) => `• ${it.qty}x ${it.name} = $${it.qty * it.price}`,
  );

  const parts: string[] = [];
  parts.push(`Hola! Quiero hacer un pedido en ${tenantName} 🛒`);
  parts.push('');
  parts.push('Pedido:');
  parts.push(...lines);
  parts.push('');
  parts.push(`Subtotal: $${subtotal}`);
  if (fulfillment === 'delivery') parts.push(`Delivery: $${deliveryFee}`);
  parts.push(`Total: $${total}`);
  parts.push('');
  parts.push(fulfillment === 'delivery' ? 'Delivery ✅' : 'Retiro en local ✅');
  if (fulfillment === 'delivery' && address)
    parts.push(`Dirección: ${address}`);
  parts.push('');
  parts.push(`Nombre: ${customerName}`);
  if (note?.trim()) parts.push(`Comentario: ${note.trim()}`);

  return { text: parts.join('\n'), total };
}

function buildWhatsAppLink(phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function CheckoutPage() {
  const { slug } = useParams();
  const { items, subtotal, clear, hydrateMissing, setStoreKey } = useCart();

  const [tenant, setTenant] = useState<TenantLite | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setStoreKey(slug ?? null);

    hydrateMissing();
    return () => setStoreKey(null);
  }, [slug]);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;

      setLoadingTenant(true);
      setTenantError(null);

      // Para lectura pública: necesitas policy "tenants public read active"
      const { data, error } = await supabase
        .from('tenants')
        .select(
          'id,name,slug,whatsapp_phone,address,delivery_fee,pickup_enabled,delivery_enabled,lead_time_text,is_active',
        )
        .eq('slug', slug)
        .maybeSingle();

      setLoadingTenant(false);

      if (error) {
        setTenantError(error.message);
        setTenant(null);
        return;
      }

      if (!data) {
        setTenant(null);
        return;
      }

      setTenant(data as TenantLite);

      // set fulfillment por defecto según flags
      if (data.pickup_enabled && !data.delivery_enabled)
        setFulfillment('pickup');
      if (!data.pickup_enabled && data.delivery_enabled)
        setFulfillment('delivery');
    };

    run();
  }, [slug]);

  const cartItems = useMemo(
    () => items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
    [items],
  );

  const deliveryFee = tenant?.delivery_fee ?? 0;
  const total = subtotal + (fulfillment === 'delivery' ? deliveryFee : 0);

  const canSubmit =
    items.length > 0 &&
    !!tenant &&
    tenant.is_active !== false &&
    customerName.trim().length >= 2 &&
    (fulfillment === 'pickup' ||
      (fulfillment === 'delivery' && address.trim().length >= 4));

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center">
        <div className="text-sm text-gray-600">Cargando checkout...</div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="text-sm text-red-700">Error: {tenantError}</div>
          <Link
            className="mt-3 inline-block underline text-sm"
            to={`/t/${slug}`}
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Catálogo no encontrado</h1>
          <p className="mt-1 text-sm text-gray-600">Revisa el link.</p>
          <Link
            className="mt-4 inline-block underline text-sm"
            to={`/t/${slug}`}
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  if (tenant.is_active === false) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">{tenant.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Este catálogo está inactivo.
          </p>
          <Link
            className="mt-4 inline-block underline text-sm"
            to={`/t/${slug}`}
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Tu carrito está vacío</h1>
          <p className="mt-1 text-sm text-gray-600">
            Agrega productos para continuar.
          </p>
          <Link
            to={`/t/${slug}`}
            className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const { text: waText } = buildWhatsAppMessage({
    tenantName: tenant.name,
    items: cartItems,
    fulfillment,
    deliveryFee,
    address: fulfillment === 'delivery' ? address.trim() : undefined,
    customerName: customerName.trim(),
    note,
  });

  const waLink = buildWhatsAppLink(tenant.whatsapp_phone, waText);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Checkout</h1>
            <p className="text-xs text-gray-500">{tenant.name}</p>
          </div>
          <Link
            to={`/t/${slug}`}
            className="text-sm underline underline-offset-4 text-gray-700"
          >
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Tus datos</h2>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                placeholder="Ej: Pedro"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            {/* Fulfillment */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Entrega
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!tenant.pickup_enabled}
                  onClick={() => setFulfillment('pickup')}
                  className={
                    'rounded-xl border px-3 py-2 text-sm text-left hover:bg-gray-50 ' +
                    (fulfillment === 'pickup'
                      ? 'border-black bg-black text-white hover:bg-black/90'
                      : '') +
                    (!tenant.pickup_enabled
                      ? ' opacity-50 cursor-not-allowed'
                      : '')
                  }
                >
                  Retiro
                  <div
                    className={
                      'text-xs ' +
                      (fulfillment === 'pickup'
                        ? 'text-white/80'
                        : 'text-gray-500')
                    }
                  >
                    En local
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!tenant.delivery_enabled}
                  onClick={() => setFulfillment('delivery')}
                  className={
                    'rounded-xl border px-3 py-2 text-sm text-left hover:bg-gray-50 ' +
                    (fulfillment === 'delivery'
                      ? 'border-black bg-black text-white hover:bg-black/90'
                      : '') +
                    (!tenant.delivery_enabled
                      ? ' opacity-50 cursor-not-allowed'
                      : '')
                  }
                >
                  Delivery
                  <div
                    className={
                      'text-xs ' +
                      (fulfillment === 'delivery'
                        ? 'text-white/80'
                        : 'text-gray-500')
                    }
                  >
                    {deliveryFee > 0 ? `Costo $${deliveryFee}` : 'Sin costo'}
                  </div>
                </button>
              </div>
            </div>

            {fulfillment === 'delivery' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                  placeholder="Ej: Av. Libertad 123, Chillán"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Comentario (opcional)
              </label>
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                rows={3}
                placeholder="Ej: sin cebolla, por favor"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Resumen</h2>

            <div className="mt-4 grid gap-2">
              {items.map((it) => (
                <div
                  key={it.productId}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {it.qty}x {it.name}
                    </div>
                    <div className="text-xs text-gray-500">${it.price} c/u</div>
                  </div>
                  <div className="text-sm font-semibold">
                    ${it.qty * it.price}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal}</span>
              </div>

              {fulfillment === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium">${deliveryFee}</span>
                </div>
              )}

              <div className="flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">${total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-xs text-gray-500">Mensaje para WhatsApp</div>
            <textarea
              value={waText}
              readOnly
              rows={8}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm font-mono"
            />

            <div className="mt-3 grid gap-2">
              <a
                href={canSubmit ? waLink : undefined}
                onClick={(e) => {
                  if (!canSubmit) e.preventDefault();
                }}
                target="_blank"
                rel="noreferrer"
                className={
                  'text-center rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90 active:scale-[0.99] ' +
                  (!canSubmit ? 'opacity-50 pointer-events-none' : '')
                }
              >
                Enviar por WhatsApp
              </a>

              <button
                type="button"
                onClick={clear}
                className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
              >
                Vaciar carrito
              </button>
            </div>

            {!canSubmit && (
              <p className="mt-3 text-xs text-gray-500">
                Completa tu nombre
                {fulfillment === 'delivery' ? ' y dirección' : ''} para
                habilitar el envío.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
