// src/features/dashboard/FeedItem.tsx
import { useNavigate } from 'react-router-dom';
import type { FeedItem as FeedItemType } from '@/store/useStore';
import type { Invoice, Template, GeneratedPDF } from '@/db/models';
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
      const template = item as Template;
      navigate(`/template/${template.id}`);
    } else if (item.itemType === 'Invoice') {
      const invoice = item as Invoice;
      if (invoice.status === 'DRAFT') {
        navigate(`/invoice/${invoice.id}`);
      }
    }
    // Add navigation for other types here later
  };

  const renderContent = () => {
    switch (item.itemType) {
      case 'Invoice': {
        const invoice = item as Invoice;
        return (
          <div className="flex items-center space-x-4">
            {invoice.status === 'LOCKED'
              ? <FileCheck2 className="h-6 w-6 text-primary" />
              : <FileText className="h-6 w-6 text-secondary" />
            }
            <div className='flex-grow'>
              <CardTitle>Invoice #{invoice.id.substring(0, 8)}</CardTitle>
              <CardDescription>
                Status: <Badge variant={invoice.status === 'LOCKED' ? 'default' : 'secondary'}>{invoice.status}</Badge>
              </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold">${invoice.grandTotal.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Updated: {formatDate(invoice.updatedAt)}</p>
            </div>
          </div>
        );
      }
      case 'Template': {
        const template = item as Template;
        return (
          <div className="flex items-center space-x-4">
            <DraftingCompass className="h-6 w-6 text-accent" />
            <div className='flex-grow'>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>Paper Size: {template.paperSize}</CardDescription>
            </div>
             <p className="text-sm text-muted-foreground">Updated: {formatDate(template.updatedAt)}</p>
          </div>
        );
      }
      case 'PDF': {
        const pdf = item as GeneratedPDF;
        return (
           <div className="flex items-center space-x-4">
             <FileCheck2 className="h-6 w-6 text-destructive" />
             <div className='flex-grow'>
                 <CardTitle>Generated PDF</CardTitle>
                 <CardDescription>Generated for Invoice #{pdf.invoiceId.substring(0, 8)}</CardDescription>
             </div>
             <p className="text-sm text-muted-foreground">Created: {formatDate(pdf.createdAt)}</p>
           </div>
        );
      }
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
