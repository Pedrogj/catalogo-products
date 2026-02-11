import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartFloatingBar() {
  const { count, subtotal } = useCart();
  const { slug } = useParams();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4">
      <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{count} en el carrito</div>
          <div className="text-xs text-gray-600">Subtotal: ${subtotal}</div>
        </div>

        <Link
          to={`/t/${slug}/cart`}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 active:scale-[0.99]"
        >
          Ver carrito
        </Link>
      </div>
    </div>
  );
}
