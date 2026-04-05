import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { CollectionStats, UserProfile } from '@my-collections/shared';
import { apiClient } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

interface CollectionCardProps {
  title: string;
  emoji: string;
  owned: number;
  wishlist: number;
  value: number | null;
  href: string;
}

function CollectionCard({ title, emoji, owned, wishlist, value, href }: CollectionCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{emoji} {title}</CardTitle>
        <Badge variant="secondary">{owned} owned</Badge>
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
    <div className="min-h-screen bg-muted/40">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">My Collections</h1>
          <div className="flex items-center gap-4">
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
                emoji="⭐"
                owned={stats!.starWars.owned}
                wishlist={stats!.starWars.wishlist}
                value={stats!.starWars.estimatedTotalValue}
                href="/collections/star-wars"
              />
              <CollectionCard
                title="Transformers"
                emoji="🤖"
                owned={stats!.transformers.owned}
                wishlist={stats!.transformers.wishlist}
                value={stats!.transformers.estimatedTotalValue}
                href="/collections/transformers"
              />
              <CollectionCard
                title="He-Man"
                emoji="⚔️"
                owned={stats!.heman.owned}
                wishlist={stats!.heman.wishlist}
                value={stats!.heman.estimatedTotalValue}
                href="/collections/he-man"
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
