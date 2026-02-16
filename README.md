# Catálogo + Pedidos por WhatsApp (SaaS Multi-tenant) — React + TS + Supabase

Aplicación tipo **catálogo digital** para negocios (restaurantes y emprendedores) que permite:

- Publicar un catálogo público por `slug`
- Administrar categorías / productos / configuraciones desde un panel privado
- Armar un carrito y generar un pedido por WhatsApp (en progreso)
- Modificadores/variantes por producto (admin listo)

---

## Stack

- **Frontend:** React + TypeScript (Vite)
- **UI/Estilos:** Tailwind CSS
- **Forms/Validación:** React Hook Form + Zod
- **Toasts:** react-toastify
- **Backend/DB/Auth/Storage:** Supabase (Postgres + RLS + Auth + Storage)
- **Ruteo:** React Router

---

## Objetivo del MVP

1. Un negocio crea su catálogo y lo comparte por link.
2. Cliente entra al link, agrega productos, finaliza pedido por WhatsApp.
3. Admin gestiona catálogo desde panel.

---

## Funcionalidades implementadas (estado actual)

### Autenticación y Admin

- ✅ Registro e inicio de sesión (Supabase Auth)
- ✅ Rutas protegidas para Admin
- ✅ Hook `useMyTenant` para cargar el tenant del usuario

### Seguridad (RLS)

- ✅ RLS habilitado en tablas clave (tenants, members, categories, products, images, option_groups, options)
- ✅ Lectura pública del catálogo **solo si el tenant está activo**
- ✅ Escritura en admin solo para miembros del tenant

### Configuración (Admin)

- ✅ AdminSettingsPage con RHF + Zod
- ✅ Activar/desactivar visibilidad del catálogo (`tenants.is_active`)
- ✅ Configurar: WhatsApp, dirección, delivery/retiro, costo delivery, lead time
- ✅ Generación del link público del catálogo
- ✅ QR del link del catálogo (implementado)
- ✅ Mensajería con Toastify (success/error)

### Categorías (Admin)

- ✅ CRUD de categorías
- ✅ Crear categoría con RHF + Zod
- ✅ Editar categoría en modal con RHF + Zod
- ✅ Desactivar/activar categoría (`is_active`)
- ✅ Validación: no permite guardar si no hay cambios (`isDirty`)
- ✅ Toastify para feedback (success/error)

### Productos (Admin)

- 🟡 CRUD de productos (pendiente de estandarizar/terminar según plan actual)
- 🟡 Subida de imágenes a Storage + `product_images` (pendiente/por completar)

### Modificadores / Variantes (Admin)

- ✅ Página: `/admin/products/:productId/options`
- ✅ CRUD de `option_groups`:
  - `name`, `type` (single/multiple), `required`, `sort_order`
- ✅ CRUD de `options` por grupo:
  - `name`, `price_delta`, `sort_order`, `is_active`
- ✅ Orden por `sort_order`
- ✅ Estados “busy” por acción + toasts

> Pendiente: UI en catálogo para seleccionar modificadores al agregar al carrito.

### Catálogo Público

- ✅ Ruta pública `/t/:slug`
- ✅ Carga de tenant por slug
- ✅ Bloqueo si el tenant está inactivo
- ✅ Listado de categorías y productos
- ✅ Sección “Otros” para productos sin `category_id`
- ✅ Botón WhatsApp hacia el negocio
- ✅ `ProductCard` reutilizable

---

## Rutas principales

### Públicas

- `/t/:slug` → Catálogo público

### Admin (protegidas)

- `/login`
- `/register`
- `/admin`
- `/admin/categories`
- `/admin/products`
- `/admin/products/:productId/options` → Modificadores / Variantes
- `/admin/settings` → Configuración + QR + activar/desactivar catálogo

---

## Variables de entorno

Crea `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
