// src/features/dashboard/FeedList.tsx
import { FeedItem as FeedItemType } from '@/store/useStore';
import { FeedItem } from './FeedItem';

interface FeedListProps {
  items: FeedItemType[];
}

export function FeedList({ items }: FeedListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItem key={`${item.itemType}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
