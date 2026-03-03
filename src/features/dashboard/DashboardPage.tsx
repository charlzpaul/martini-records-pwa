// src/features/dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { QuickActions } from './QuickActions';
import { FeedList } from './FeedList';
import { AppLayout } from '@/app/AppLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { seedLargeData } from '@/db/seed-large';

export function DashboardPage() {
  const fetchDashboardData = useStore((state) => state.fetchDashboardData);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const feed = useStore((state) => state.feed);
  const currency = useStore((state) => state.currency);
  const setCurrency = useStore((state) => state.setCurrency);
  
  const [filter, setFilter] = useState<string>('all'); // 'all', 'Invoice', 'Template', 'PDF', 'Customer', 'Product'

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const filteredFeed = filter === 'all'
    ? feed
    : feed.filter(item => item.itemType === filter);

  const items = filteredFeed;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-row items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Currency:</span>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <QuickActions />

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-4 sm:mb-0">Activity Feed</h2>
            
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="feed-filter"
                  value="all"
                  checked={filter === 'all'}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">All</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="feed-filter"
                  value="Invoice"
                  checked={filter === 'Invoice'}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Records</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="feed-filter"
                  value="Template"
                  checked={filter === 'Template'}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Templates</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="feed-filter"
                  value="Customer"
                  checked={filter === 'Customer'}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Customers</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="feed-filter"
                  value="Product"
                  checked={filter === 'Product'}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Products</span>
              </label>
            </div>
          </div>
          
          {loading && items.length === 0 && <p>Loading feed...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {(items.length > 0 || !loading) && !error && <FeedList items={filteredFeed} />}
        </div>
      </div>
    </AppLayout>
  );
}
