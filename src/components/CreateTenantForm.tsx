import React, { useMemo, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { slugify } from '../lib/slug';
import type { TenantType } from '../types/domain';

type Props = {
  userId: string;
  onCreated: () => void;
};

export function CreateTenantForm({ userId, onCreated }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TenantType>('restaurant');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSlug = useMemo(() => slugify(name), [name]);

  const canSubmit =
    name.trim().length >= 2 &&
    suggestedSlug.length >= 2 &&
    whatsapp.replace(/[^\d]/g, '').length >= 8 &&
    !loading;

  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      owner_id: userId,
      name: name.trim(),
      slug: suggestedSlug,
      type,
      whatsapp_phone: whatsapp.trim(),
      address: address.trim() || null,
      delivery_fee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
      pickup_enabled: true,
      delivery_enabled: true,
      is_active: true,
    };

    const { error } = await supabase
      .from('tenants')
      .insert(payload)
      .select('*')
      .single();

    setLoading(false);

    if (error) {
      // ejemplo: slug duplicado
      if (error.message.toLowerCase().includes('duplicate')) {
        setError(
          'Ese slug ya existe. Cambia el nombre del negocio para generar otro.',
        );
        return;
      }
      setError(error.message);
      return;
    }

    onCreated();
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Crea tu negocio</h2>
      <p className="mt-1 text-sm text-gray-600">
        Esto generará tu catálogo público y tu panel de administración.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre del negocio
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
            placeholder="Ej: Mi Restaurante"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="text-xs text-gray-500">
            Slug (auto):{' '}
            <span className="font-mono">{suggestedSlug || '—'}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">Rubro</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('restaurant')}
              className={
                'rounded-xl border px-3 cursor-pointer py-2 text-sm text-left hover:bg-gray-50' +
                (type === 'restaurant'
                  ? 'border-black bg-black text-white'
                  : '')
              }
            >
              Restaurante: {''}
              <span
                className={
                  'text-xs ' +
                  (type === 'restaurant' ? 'text-white/80' : 'text-gray-500')
                }
              >
                Combos, extras, retiro/delivery
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('entrepreneur')}
              className={
                'rounded-xl border px-3 cursor-pointer py-2 text-sm text-left hover:bg-gray-50' +
                (type === 'entrepreneur'
                  ? 'border-black bg-black text-white'
                  : '')
              }
            >
              Emprendimiento: {''}
              <span
                className={
                  'text-xs ' +
                  (type === 'entrepreneur' ? 'text-white/80' : 'text-gray-500')
                }
              >
                Variantes, pedidos a encargo
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            WhatsApp (con código país)
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
            placeholder="Ej: +56912345678"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
          />
          <div className="text-xs text-gray-500">
            Ejemplo Chile: +56 9 1234 5678
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Dirección (opcional)
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
            placeholder="Ej: Av. Libertad 123, Chillán"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Costo delivery (CLP)
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
            type="number"
            min={0}
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(Number(e.target.value))}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-black cursor-pointer px-3 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading ? 'Creando...' : 'Crear negocio'}
        </button>

        <div className="text-xs text-gray-500">
          Al crear el negocio se generará tu ruta pública:{' '}
          <span className="font-mono">/t/{suggestedSlug || 'tu-negocio'}</span>
        </div>
      </form>
    </div>
  );
}
