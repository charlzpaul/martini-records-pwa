// src/features/dashboard/FeedItem.tsx
import { useNavigate } from 'react-router-dom';
import { FeedItem as FeedItemType } from '@/store/useStore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DraftingCompass, FileCheck2 } from 'lucide-react';

interface FeedItemProps {
  item: FeedItemType;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function FeedItem({ item }: FeedItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.itemType === 'Template') {
      navigate(`/template/${item.id}`);
    } else if (item.itemType === 'Invoice' && item.status === 'DRAFT') {
      navigate(`/invoice/${item.id}`);
    }
    // Add navigation for other types here later
  };

  const renderContent = () => {
    switch (item.itemType) {
      case 'Invoice':
        return (
          <div className="flex items-center space-x-4">
            {item.status === 'LOCKED' 
              ? <FileCheck2 className="h-6 w-6 text-green-500" />
              : <FileText className="h-6 w-6 text-blue-500" />
            }
            <div className='flex-grow'>
              <CardTitle>Invoice #{item.id.substring(0, 8)}</CardTitle>
              <CardDescription>
                Status: <Badge variant={item.status === 'LOCKED' ? 'default' : 'secondary'}>{item.status}</Badge>
              </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold">${item.grandTotal.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Updated: {formatDate(item.updatedAt)}</p>
            </div>
          </div>
        );
      case 'Template':
        return (
          <div className="flex items-center space-x-4">
            <DraftingCompass className="h-6 w-6 text-purple-500" />
            <div className='flex-grow'>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>Paper Size: {item.paperSize}</CardDescription>
            </div>
             <p className="text-sm text-muted-foreground">Updated: {formatDate(item.updatedAt)}</p>
          </div>
        );
      case 'PDF':
        return (
           <div className="flex items-center space-x-4">
            <FileCheck2 className="h-6 w-6 text-red-500" />
            <div className='flex-grow'>
                <CardTitle>{item.fileName}</CardTitle>
                <CardDescription>Generated PDF for Invoice #{item.invoiceId.substring(0, 8)}</CardDescription>
            </div>
            <p className="text-sm text-muted-foreground">Created: {formatDate(item.createdAt)}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      onClick={handleClick}
      className="hover:bg-accent transition-colors cursor-pointer"
    >
      <CardHeader>
        {renderContent()}
      </CardHeader>
    </Card>
  );
}
