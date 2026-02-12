# Catálogo + Pedidos por WhatsApp (SaaS Multi-tenant) — React + TS + Supabase

Aplicación tipo “catálogo digital” para negocios (restaurantes y emprendedores) que permite:

- Publicar un catálogo público por `slug`
- Administrar categorías y productos desde un panel privado
- Armar un carrito y generar un pedido por WhatsApp
- (En progreso) Modificadores/variantes por producto

---

## Stack

- **Frontend:** React + TypeScript
- **Estilos:** Tailwind CSS
- **Backend/DB/Auth/Storage:** Supabase (Postgres + RLS + Auth + Storage)
- **Ruteo:** React Router

---

## Objetivo del MVP

1. Un negocio crea su catálogo y lo comparte por link.
2. Cliente entra al link, agrega productos, finaliza pedido por WhatsApp.
3. Admin gestiona categorías/productos desde panel.

---

## Funcionalidades implementadas

### Autenticación y Admin

- ✅ Registro e inicio de sesión (Supabase Auth)
- ✅ Rutas protegidas para Admin
- ✅ Admin layout con **sidebar** (Dashboard, Categorías, Productos, Configuración\*)
- ✅ Crear negocio (tenant) desde admin con:
  - `name`, `slug` (auto), `type`, `whatsapp_phone`, `address`, `delivery_fee`, etc.

> \*Configuración está planificada como siguiente paso, parte del layout puede existir ya.

### Categorías (Admin)

- ✅ Crear categorías (`name`, `sort_order`)
- ✅ Listar categorías
- ✅ Editar `sort_order` con botón **Guardar**
- ✅ Eliminar categorías

### Productos (Admin)

- ✅ Crear productos con:
  - `name`, `description`, `base_price`, `category_id`, `is_active`, `is_sold_out`
- ✅ Subir **imagen al crear producto** (opcional)
- ✅ Listar productos
- ✅ Eliminar productos
- ✅ (Opcional/si ya está) Modal de edición de producto:
  - editar `name`, `description`, `price`, `category`, `active`, `sold_out`

### Catálogo público

- ✅ Ruta pública `/t/:slug`
- ✅ Carga de tenant por `slug`
- ✅ Lista categorías
- ✅ Lista productos por categoría
- ✅ Sección **“Otros”** para productos sin `category_id`
- ✅ Card/lista de producto con imagen + precio + botón “Agregar”
- ✅ Muestra primera imagen del producto desde `product_images`

### Carrito y Checkout (WhatsApp)

- ✅ Carrito con Context:
  - agregar/quitar
  - editar qty
  - vaciar
- ✅ Barra flotante de carrito
- ✅ `/t/:slug/cart` (resumen del carrito)
- ✅ `/t/:slug/checkout`:
  - nombre
  - retiro/delivery
  - dirección (si delivery)
  - nota
  - total + delivery fee
  - genera mensaje y abre WhatsApp (wa.me)
  - copiar mensaje

### Persistencia de carrito (seguro y por tienda)

- ✅ Persistencia en `localStorage` **solo** `{ productId, qty }`
- ✅ Rehidratación desde Supabase para traer **nombre y precio reales**
- ✅ Carrito separado por tienda: **key por slug** (no se mezclan catálogos)

### Modificadores / Variantes (Admin)

- ✅ Ruta: `/admin/products/:productId/options`
- ✅ CRUD de `option_groups`:
  - `name`, `type` (single/multiple), `required`, `sort_order`
- ✅ CRUD de `options` por grupo:
  - `name`, `price_delta`, `sort_order`, `is_active`
- ✅ Orden por `sort_order` (sin depender de `created_at`)

> Pendiente: UI en catálogo para seleccionar modificadores al agregar.

---

## Rutas principales

### Públicas

- `/t/:slug` → Catálogo público
- `/t/:slug/cart` → Carrito
- `/t/:slug/checkout` → Checkout (WhatsApp)

### Admin (protegidas)

- `/login`
- `/register`
- `/admin` → Dashboard
- `/admin/categories`
- `/admin/products`
- `/admin/products/:productId/options` → Modificadores/Variantes por producto

---

## Variables de entorno

Crea `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
