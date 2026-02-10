import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { Button, Card, Input, Label } from "../ui/components/ui";

export function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) return setError(error.message);

    nav("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black text-white grid place-items-center font-semibold">
            T
          </div>
          <h1 className="text-2xl font-semibold">Ingresar</h1>
          <p className="text-sm text-gray-600">
            Administra tu catálogo y pedidos
          </p>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="tuemail@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link
                to="/admin/register"
                className="font-medium text-black underline underline-offset-4"
              >
                Crear cuenta
              </Link>
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          Chile · Catálogo + WhatsApp · MVP
        </p>
      </div>
    </div>
  );
}
