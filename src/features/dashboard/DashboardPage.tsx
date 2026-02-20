// src/features/dashboard/DashboardPage.tsx
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { QuickActions } from './QuickActions';
import { FeedList } from './FeedList';
import { AppLayout } from '@/app/AppLayout';

export function DashboardPage() {
  const fetchDashboardData = useStore((state) => state.fetchDashboardData);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const feed = useStore((state) => state.feed);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AppLayout>
      <div className="space-y-8">
        <QuickActions />

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Activity Feed</h2>
          {loading && <p>Loading feed...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && <FeedList items={feed} />}
        </div>
      </div>
    </AppLayout>
  );
}
