import React from "react";
import { useAuth } from "../providers/AuthProviders";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black text-white grid place-items-center font-semibold">
              T
            </div>
            <div>
              <div className="font-semibold leading-tight">TuApp Admin</div>
              <div className="text-xs text-gray-500 leading-tight">
                Catálogo + pedidos WhatsApp
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
