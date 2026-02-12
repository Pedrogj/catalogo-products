import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { AdminRegisterPage } from '../pages/AdminRegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../components/AdminLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { CatalogPage } from '../pages/CatalogPage';
import { AdminCategoriesPage } from '../pages/AdminCategoriesPage';
import { AdminProductsPage } from '../pages/AdminProductsPage';
import { AdminSettingsPage } from '../pages/AdminSettingsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AdminProductOptionsPage } from '../pages/AdminProductOptionPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/admin/login"
              replace
            />
          }
        />

        <Route
          path="/t/:slug"
          element={<CatalogPage />}
        />
        <Route
          path="/t/:slug/cart"
          element={<CartPage />}
        />
        <Route
          path="/t/:slug/checkout"
          element={<CheckoutPage />}
        />

        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />
        <Route
          path="/admin/register"
          element={<AdminRegisterPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminLayout>
                <AdminCategoriesPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminLayout>
                <AdminProductsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/products/:productId/options"
            element={
              <AdminLayout>
                <AdminProductOptionsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayout>
                <AdminSettingsPage />
              </AdminLayout>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen grid place-items-center">
              <div className="text-sm text-gray-600">404</div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
