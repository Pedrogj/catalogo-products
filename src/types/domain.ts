export type TenantType = 'restaurant' | 'entrepreneur';

export type Tenant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  type: TenantType;
  whatsapp_phone: string;
  address: string | null;
  delivery_fee: number;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  is_active: boolean;
  created_at: string;
};
