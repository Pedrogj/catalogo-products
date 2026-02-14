import { z } from "zod";

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
};

export const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nombre muy corto")
    .max(60, "Máx 60 caracteres"),
  whatsapp_phone: z
    .string()
    .trim()
    .min(8, "WhatsApp muy corto")
    .max(20, "Máx 20 caracteres"),
  address: z
    .string()
    .trim()
    .max(120, "Máx 120 caracteres")
    .optional()
    .or(z.literal("")),
  pickup_enabled: z.boolean(),
  delivery_enabled: z.boolean(),
  delivery_fee: z.preprocess(toNumber, z.number().min(0, "Debe ser 0 o mayor")),
  lead_time_text: z
    .string()
    .trim()
    .max(60, "Máx 60 caracteres")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
