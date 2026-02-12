type Props = {
  name: string;
  description?: string | null;
  price: number;
  imgUrl?: string | null;
  soldOut?: boolean;
  onAdd?: () => void;
};

export function ProductCard({
  name,
  description,
  price,
  imgUrl,
  soldOut,
  onAdd,
}: Props) {
  return (
    <div className="flex gap-4 rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow-md">
      {/* Imagen */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 border">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-[10px] text-gray-500">
            Sin imagen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{name}</div>
            {description ? (
              <div className="mt-0.5 text-xs text-gray-600">{description}</div>
            ) : (
              <div className="mt-0.5 text-xs text-gray-400"> </div>
            )}
          </div>

          {/* Precio + botón */}
          <div className="flex flex-col items-end justify-between gap-2">
            <div className="text-sm font-semibold">${price}</div>

            <button
              type="button"
              onClick={onAdd}
              disabled={!!soldOut}
              className="h-9 w-9 rounded-full bg-black text-white grid place-items-center text-lg leading-none hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              aria-label="Agregar"
              title={soldOut ? 'Agotado' : 'Agregar'}
            >
              +
            </button>
          </div>
        </div>

        {soldOut && (
          <div className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
            Agotado
          </div>
        )}
      </div>
    </div>
  );
}
