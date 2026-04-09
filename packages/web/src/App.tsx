import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './router/ProtectedRoute.js';
import { LoginPage } from './pages/LoginPage.js';
import { CallbackPage } from './pages/CallbackPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CollectionListPage } from './pages/collections/CollectionListPage.js';
import { CollectionDetailPage } from './pages/collections/CollectionDetailPage.js';
import { CollectionFormPage } from './pages/collections/CollectionFormPage.js';
import { StarWarsCatalogPage } from './pages/collections/StarWarsCatalogPage.js';
import { StarWarsCatalogDetailPage } from './pages/collections/StarWarsCatalogDetailPage.js';
import { MastersCatalogPage } from './pages/collections/MastersCatalogPage.js';
import { MastersCatalogDetailPage } from './pages/collections/MastersCatalogDetailPage.js';
import { SearchPage } from './pages/collections/SearchPage.js';
import { WishlistPage } from './pages/WishlistPage.js';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Star Wars catalog model — static segments take priority over :collection */}
        <Route path="/collections/star-wars" element={<StarWarsCatalogPage />} />
        <Route path="/collections/star-wars/:id" element={<StarWarsCatalogDetailPage />} />

        {/* He-Man catalog model */}
        <Route path="/collections/he-man" element={<MastersCatalogPage />} />
        <Route path="/collections/he-man/:id" element={<MastersCatalogDetailPage />} />

        {/* /new and /:id/edit must come before /:id to avoid "new" matching as an item ID */}
        <Route path="/collections/:collection/new" element={<CollectionFormPage />} />
        <Route path="/collections/:collection/:id/edit" element={<CollectionFormPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/collections/:collection" element={<CollectionListPage />} />
        <Route path="/collections/:collection/:id" element={<CollectionDetailPage />} />
      </Route>

      {/* Default: redirect to dashboard (ProtectedRoute handles unauthenticated) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
