import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import type { CollectionStats, UserProfile } from '@my-collections/shared';
import { apiClient } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { CollectionIcon } from '../components/ui/collection-icons.js';
import type { CollectionKey } from '../lib/collectionConfig.js';

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

interface CollectionCardProps {
  title: string;
  subtitle: string;
  collectionKey: CollectionKey;
  owned: number;
  wishlist: number;
  value: number | null;
  href: string;
  accent: string;
}

function CollectionCard({ title, subtitle, collectionKey, owned, wishlist, value, href, accent }: CollectionCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-lg border-t-2 ${accent}`}
      onClick={() => navigate(href)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <CollectionIcon variant={collectionKey} size={40} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold leading-none">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{owned} owned</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{owned}</div>
        <p className="text-sm text-muted-foreground mt-1">
          {wishlist} on wishlist · est. {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function CollectionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['collection-stats'],
    queryFn: () => apiClient.get<CollectionStats>('/collections/stats'),
  });

  const profileQuery = useQuery({
    queryKey: ['user-me'],
    queryFn: () => apiClient.get<UserProfile>('/users/me'),
    initialData: user ?? undefined,
  });

  const displayName = profileQuery.data?.email ?? user?.email ?? 'Collector';
  const stats = statsQuery.data;
  const isLoading = statsQuery.isPending;

  return (
    <div className="min-h-screen bg-muted">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">My Collections</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
              <SearchIcon className="mr-1 h-4 w-4" />
              Search
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/wishlist')}>
              Wishlist
            </Button>
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>

        {/* Collection cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            <>
              <CollectionCardSkeleton />
              <CollectionCardSkeleton />
              <CollectionCardSkeleton />
            </>
          ) : statsQuery.isError ? (
            <p className="col-span-3 text-sm text-destructive">
              Failed to load collection stats. Please refresh.
            </p>
          ) : (
            <>
              <CollectionCard
                title="Star Wars"
                subtitle="Original Trilogy · 1977–1985"
                collectionKey="star-wars"
                owned={stats!.starWars.owned}
                wishlist={stats!.starWars.wishlist}
                value={stats!.starWars.estimatedTotalValue}
                href="/collections/star-wars"
                accent="border-t-amber-500/70"
              />
              <CollectionCard
                title="Transformers"
                subtitle="Generation 1 · Series 1–6 · 1984–1990"
                collectionKey="transformers"
                owned={stats!.transformers.owned}
                wishlist={stats!.transformers.wishlist}
                value={stats!.transformers.estimatedTotalValue}
                href="/collections/transformers"
                accent="border-t-blue-500/70"
              />
              <CollectionCard
                title="He-Man"
                subtitle="Masters of the Universe · 1981–1988"
                collectionKey="he-man"
                owned={stats!.heman.owned}
                wishlist={stats!.heman.wishlist}
                value={stats!.heman.estimatedTotalValue}
                href="/collections/he-man"
                accent="border-t-purple-500/70"
              />
            </>
          )}
        </div>

        {/* Totals row */}
        {!isLoading && !statsQuery.isError && stats && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-medium">Collection Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{stats.totals.owned}</div>
                  <p className="text-sm text-muted-foreground">Total owned</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.totals.wishlist}</div>
                  <p className="text-sm text-muted-foreground">On wishlist</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(stats.totals.estimatedTotalValue)}</div>
                  <p className="text-sm text-muted-foreground">Est. total value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
