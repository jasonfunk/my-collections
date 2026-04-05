import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './router/ProtectedRoute.js';
import { LoginPage } from './pages/LoginPage.js';
import { CallbackPage } from './pages/CallbackPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CollectionListPage } from './pages/collections/CollectionListPage.js';
import { CollectionDetailPage } from './pages/collections/CollectionDetailPage.js';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Collection list + detail — single generic component handles all three */}
        <Route path="/collections/:collection" element={<CollectionListPage />} />
        <Route path="/collections/:collection/:id" element={<CollectionDetailPage />} />
      </Route>

      {/* Default: redirect to dashboard (ProtectedRoute handles unauthenticated) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
