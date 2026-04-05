/**
 * Safety-net callback page for /callback.
 *
 * In the happy path the PKCE flow is handled entirely in-memory by AuthContext.login()
 * and the user never actually lands here. This page handles the edge case where a
 * full-page redirect occurs (e.g., future server-side integration).
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function CallbackPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If somehow we land here already authenticated, go to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }
    // Otherwise fall back to login — user will need to sign in again
    navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
