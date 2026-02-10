import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { Button, Card, Input, Label } from "../ui/components/ui";

export function AdminRegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) return setError(error.message);

    // Si tienes confirmación por email activa, se crea pero no inicia sesión.
    setSuccess(
      "Cuenta creada. Revisa tu correo si requiere confirmación y luego inicia sesión.",
    );
    // En MVP, te mando a login igual.
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black text-white grid place-items-center font-semibold">
            T
          </div>
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
          <p className="text-sm text-gray-600">Empieza a subir tus productos</p>
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/admin/login"
                className="font-medium text-black underline underline-offset-4"
              >
                Ingresar
              </Link>
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          Al crear tu cuenta aceptas los términos (luego lo agregamos).
        </p>
      </div>
    </div>
  );
}
