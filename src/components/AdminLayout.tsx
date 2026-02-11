import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProviders";

type NavItem = { to: string; label: string };

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/categories", label: "Categorías" },
  { to: "/admin/products", label: "Productos" },
  { to: "/admin/settings", label: "Configuración" },
];

function NavLink({ to, label }: NavItem) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full transition" ${
          active ? "bg-white" : "bg-gray-300 group-hover:bg-gray-400"
        }`}
      />

      <span
        className={`font-medium ${active ? "text-white" : "text-gray-800"}`}
      >
        {label}
      </span>

      <span
        className={`ml-auto text-xs transition ${
          active ? "text-white/70" : "text-gray-400 group-hover:text-gray-500"
        }`}
      >
        →
      </span>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar móvil */}
      <header className="border-b bg-white lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black text-white grid place-items-center font-semibold">
              T
            </div>
            <div>
              <div className="font-semibold leading-tight">TuApp Admin</div>
              <div className="text-xs text-gray-500 leading-tight">
                Catálogo + WhatsApp
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-black text-white grid place-items-center font-semibold">
                T
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">TuApp Admin</div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <nav className="mt-4 grid gap-1.5">
              {navItems.map((it) => (
                <NavLink key={it.to} to={it.to} label={it.label} />
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={signOut}
                className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
