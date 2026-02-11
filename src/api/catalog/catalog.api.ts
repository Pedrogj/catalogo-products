import { supabase } from '../../supabase/supabaseClient';

export async function fetchTenantBySlug(slug: string) {
  return supabase
    .from('tenants')
    .select(
      'id,name,slug,type,whatsapp_phone,logo_url,primary_color,address,delivery_fee,pickup_enabled,delivery_enabled,lead_time_text,is_active',
    )
    .eq('slug', slug)
    .maybeSingle();
}

export async function fetchCategoriesByTenant(tenantId: string) {
  return supabase
    .from('categories')
    .select('id,name,sort_order,is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
}

export async function fetchProductsByTenant(tenantId: string) {
  return supabase
    .from('products')
    .select('id,name,description,base_price,category_id,is_active,is_sold_out')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
}
