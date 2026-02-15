import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../supabase/supabaseClient";
import { toast } from "react-toastify";
import { useAuth } from "../providers/AuthProviders";
import { useMyTenant } from "../hooks/useMyTenant";
import {
  settingsSchema,
  type SettingsFormValues,
} from "../schemas/settings.schema";
import { makeQrDataUrl, downloadDataUrl } from "../helpers/qr";

export function AdminSettingsPage() {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);

  const { user } = useAuth();
  const { tenant, loading: tenantLoading } = useMyTenant(user?.id);

  // 🧩 Zod v4 + resolvers v5 workaround (como ya hiciste)
  const resolver = zodResolver(
    settingsSchema,
  ) as unknown as Resolver<SettingsFormValues>;

  const form = useForm<SettingsFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      name: "",
      whatsapp_phone: "",
      address: "",
      pickup_enabled: true,
      delivery_enabled: true,
      delivery_fee: 0,
      lead_time_text: "",
      is_active: true,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = form;

  const canUse = useMemo(() => !!tenant?.id, [tenant?.id]);

  const catalogUrl = useMemo(() => {
    if (!tenant?.slug) return "";
    return `${window.location.origin}/t/${tenant.slug}`;
  }, [tenant?.slug]);

  // cargar valores del tenant al form
  useEffect(() => {
    if (!tenantLoading && tenant) {
      reset({
        name: tenant.name ?? "",
        whatsapp_phone: tenant.whatsapp_phone ?? "",
        address: tenant.address ?? "",
        pickup_enabled: !!tenant.pickup_enabled,
        delivery_enabled: !!tenant.delivery_enabled,
        delivery_fee: Number(tenant.delivery_fee ?? 0),
        lead_time_text: tenant.lead_time_text ?? "",
        is_active: !!tenant.is_active,
      });
    }
  }, [tenantLoading, tenant, reset]);

  useEffect(() => {
    const run = async () => {
      if (!catalogUrl) return;
      try {
        setQrLoading(true);
        const dataUrl = await makeQrDataUrl(catalogUrl);
        setQrUrl(dataUrl);
      } catch (e: any) {
        toast.error(e?.message ?? "Error generando QR");
      } finally {
        setQrLoading(false);
      }
    };
    run();
  }, [catalogUrl]);

  const onSave = handleSubmit(async (values) => {
    if (!tenant?.id) return;

    try {
      const payload = {
        name: values.name.trim(),
        whatsapp_phone: values.whatsapp_phone.trim(),
        address: values.address?.trim() ? values.address.trim() : null,
        pickup_enabled: values.pickup_enabled,
        delivery_enabled: values.delivery_enabled,
        delivery_fee: Math.max(0, Number(values.delivery_fee) || 0),
        lead_time_text: values.lead_time_text?.trim()
          ? values.lead_time_text.trim()
          : null,
        is_active: values.is_active,
      };

      const { error: upErr } = await supabase
        .from("tenants")
        .update(payload)
        .eq("id", tenant.id);

      if (upErr) throw upErr;

      reset(values);
      toast.success("Configuración guardada");
    } catch (err: any) {
      toast.error(err?.message ?? "Error guardando configuración");
    }
  });

  if (tenantLoading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">
          Primero crea tu negocio (tenant).
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configura WhatsApp, delivery/retiro y visibilidad del catálogo.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            readOnly
            value={catalogUrl}
            className="w-full rounded-xl border px-3 py-2 text-sm bg-gray-50"
          />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(catalogUrl);
              toast.success("Link copiado");
            }}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Copiar link
          </button>

          <a
            href={catalogUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 text-center"
          >
            Ver catálogo
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">QR del catálogo</div>
            <div className="text-xs text-gray-500">
              Imprímelo o compártelo para que tus clientes entren al link.
            </div>
          </div>

          <button
            type="button"
            disabled={!qrUrl || qrLoading}
            onClick={() => {
              downloadDataUrl(qrUrl, `qr-${tenant?.slug ?? "catalogo"}.png`);
              toast.success("QR descargado ✅");
            }}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Descargar
          </button>
        </div>

        <div className="mt-4 grid place-items-center">
          {qrLoading ? (
            <div className="text-sm text-gray-600">Generando QR...</div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="QR catálogo"
              className="h-56 w-56 rounded-xl border bg-white p-2"
            />
          ) : (
            <div className="text-sm text-gray-600">
              No hay link para generar QR.
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="rounded-2xl border bg-white p-6 shadow-sm grid gap-4"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre del negocio
          </label>
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">WhatsApp</label>
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Ej: +56912345678"
            {...register("whatsapp_phone")}
          />
          {errors.whatsapp_phone && (
            <p className="text-xs text-red-600">
              {errors.whatsapp_phone.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Dirección (opcional)
          </label>
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            {...register("address")}
          />
          {errors.address && (
            <p className="text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register("pickup_enabled")} />
            Retiro habilitado
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register("delivery_enabled")} />
            Delivery habilitado
          </label>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Costo delivery (CLP)
          </label>
          <input
            type="number"
            min={0}
            className="rounded-xl border px-3 py-2 text-sm"
            {...register("delivery_fee", { valueAsNumber: true })}
          />
          {errors.delivery_fee && (
            <p className="text-xs text-red-600">
              {errors.delivery_fee.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Tiempo estimado (opcional)
          </label>
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Ej: 30–45 min"
            {...register("lead_time_text")}
          />
          {errors.lead_time_text && (
            <p className="text-xs text-red-600">
              {errors.lead_time_text.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register("is_active")} />
            Catálogo activo (visible para clientes)
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty || !isValid}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
