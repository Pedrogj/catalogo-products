import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../supabase/supabaseClient';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

type PersistedCartItem = { productId: string; qty: number };

type CartContextValue = {
  storeKey: string | null; // slug actual
  setStoreKey: (slug: string | null) => void;

  items: CartItem[];
  count: number;
  subtotal: number;

  addItem: (item: { productId: string; name: string; price: number }) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;

  hydrateMissing: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const NS = 'catalog_cart_v1';

function lsKey(slug: string) {
  return `${NS}:${slug}`;
}

function readPersisted(key: string): PersistedCartItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) => typeof x?.productId === 'string' && typeof x?.qty === 'number',
      )
      .map((x) => ({
        productId: x.productId,
        qty: Math.max(1, Math.floor(x.qty || 1)),
      }));
  } catch {
    return [];
  }
}

function writePersisted(key: string, items: CartItem[]) {
  const minimal: PersistedCartItem[] = items.map((x) => ({
    productId: x.productId,
    qty: x.qty,
  }));
  localStorage.setItem(key, JSON.stringify(minimal));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  // Cuando cambia el slug (tienda), cargamos el carrito de ESA tienda
  useEffect(() => {
    if (!storeKey) {
      setItems([]);
      return;
    }

    const key = lsKey(storeKey);
    const persisted = readPersisted(key);

    setItems(
      persisted.map((p) => ({
        productId: p.productId,
        qty: p.qty,
        name: 'Producto',
        price: 0,
      })),
    );
    // Hidratamos al cambiar tienda
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    hydrateMissingFor(persisted.map((p) => p.productId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  // Persistimos SOLO si hay tienda seteada
  useEffect(() => {
    if (!storeKey) return;
    writePersisted(lsKey(storeKey), items);
  }, [items, storeKey]);

  const hydrateMissingFor = async (ids?: string[]) => {
    const missingIds =
      ids ??
      Array.from(
        new Set(
          items
            .filter((x) => !x.price || x.name === 'Producto')
            .map((x) => x.productId),
        ),
      );

    if (missingIds.length === 0) return;

    const { data, error } = await supabase
      .from('products')
      .select('id,name,base_price,is_active')
      .in('id', missingIds);

    if (error) return;

    const map = new Map<
      string,
      { name: string; price: number; is_active: boolean }
    >();
    (data ?? []).forEach((p: any) => {
      map.set(p.id, {
        name: p.name,
        price: Number(p.base_price ?? 0),
        is_active: !!p.is_active,
      });
    });

    setItems((prev) => {
      const next = prev
        .map((it) => {
          const fresh = map.get(it.productId);
          if (!fresh) return null;
          if (!fresh.is_active) return null;
          return { ...it, name: fresh.name, price: fresh.price };
        })
        .filter(Boolean) as CartItem[];

      return next;
    });
  };

  const hydrateMissing = async () => {
    await hydrateMissingFor();
  };

  const addItem: CartContextValue['addItem'] = (item) => {
    if (!storeKey) return; // seguridad: no agregar si no hay tienda
    setItems((prev) => {
      const found = prev.find((x) => x.productId === item.productId);
      if (!found) return [...prev, { ...item, qty: 1 }];
      return prev.map((x) =>
        x.productId === item.productId ? { ...x, qty: x.qty + 1 } : x,
      );
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  };

  const setQty = (productId: string, qty: number) => {
    const q = Math.max(1, Math.floor(qty || 1));
    setItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, qty: q } : x)),
    );
  };

  const clear = () => {
    setItems([]);
    if (storeKey) localStorage.removeItem(lsKey(storeKey));
  };

  const value = useMemo(() => {
    const count = items.reduce((s, x) => s + x.qty, 0);
    const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
    return {
      storeKey,
      setStoreKey,
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clear,
      hydrateMissing,
    };
  }, [items, storeKey]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
