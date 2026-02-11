import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect } from 'react';

export function CartPage() {
  const { slug } = useParams();
  const {
    items,
    subtotal,
    setQty,
    removeItem,
    clear,
    hydrateMissing,
    setStoreKey,
  } = useCart();

  useEffect(() => {
    setStoreKey(slug ?? null);
    hydrateMissing();
    return () => setStoreKey(null);
  }, [slug]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Tu carrito está vacío</h1>
          <p className="mt-1 text-sm text-gray-600">
            Agrega productos desde el catálogo.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Carrito</h1>
          <button
            onClick={clear}
            className="text-sm underline underline-offset-4 text-gray-700"
          >
            Vaciar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        {items.map((it) => (
          <div
            key={it.productId}
            className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{it.name}</div>
              <div className="text-xs text-gray-500">${it.price} c/u</div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={it.qty}
                onChange={(e) => setQty(it.productId, Number(e.target.value))}
                className="w-20 rounded-xl border px-3 py-2 text-sm"
              />
              <button
                onClick={() => removeItem(it.productId)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="text-sm font-medium">Subtotal</div>
          <div className="text-lg font-semibold">${subtotal}</div>
        </div>

        <Link
          to={`/t/${slug}/checkout`}
          className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white text-center hover:bg-black/90"
        >
          Finalizar por WhatsApp
        </Link>

        <Link
          to={`/t/${slug}`}
          className="text-sm text-center underline underline-offset-4 text-gray-700"
        >
          Seguir comprando
        </Link>
      </main>
    </div>
  );
}
