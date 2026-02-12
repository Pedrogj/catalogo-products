import { z } from 'zod';

const toNumber = (v: unknown) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
};

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'Máximo 60 caracteres.'),
  description: z
    .string()
    .trim()
    .max(200, 'Máximo 200 caracteres.')
    .optional()
    .or(z.literal('')),
  base_price: z.preprocess(
    toNumber,
    z.number().min(0, 'El precio debe ser 0 o mayor.'),
  ),
  category_id: z.string().optional().or(z.literal('')),
  // ✅ sin default acá, para que el tipo sea boolean (no boolean | undefined)
  is_active: z.boolean(),
  is_sold_out: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
