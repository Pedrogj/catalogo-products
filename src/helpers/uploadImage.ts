import { supabase } from '../supabase/supabaseClient';

export const uploadProductImage = async (
  file: File,
  tenantId: string,
  productId: string,
) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${tenantId}/${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: false });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
};

export const addImageRow = async (
  tenantId: string,
  productId: string,
  url: string,
) => {
  const { error } = await supabase.from('product_images').insert({
    tenant_id: tenantId,
    product_id: productId,
    url,
    sort_order: 0,
  });
  if (error) throw error;
};
