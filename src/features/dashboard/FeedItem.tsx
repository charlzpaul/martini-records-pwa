// src/features/dashboard/FeedItem.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeedItem as FeedItemType } from '@/store/useStore';
import type { Invoice, Template, GeneratedPDF, Customer, Product } from '@/db/models';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DraftingCompass, FileCheck2, User, Package, Trash2 } from 'lucide-react';
import { DetailDialog } from './DetailDialog';
import { useStore } from '@/store/useStore';
import * as dbApi from '@/db/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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

// Helper function to get color for feed type
const getFeedTypeColor = (type: string) => {
  switch (type) {
    case 'Invoice': return 'border-l-blue-500';
    case 'Template': return 'border-l-purple-500';
    case 'PDF': return 'border-l-red-500';
    case 'Customer': return 'border-l-green-500';
    case 'Product': return 'border-l-amber-500';
    default: return 'border-l-gray-500';
  }
};

// Helper function to get badge color for feed type
const getBadgeColor = (type: string) => {
  switch (type) {
    case 'Invoice': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'Template': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    case 'PDF': return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'Customer': return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'Product': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

export function FeedItem({ item }: FeedItemProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Customer | Product | null>(null);
  const [selectedType, setSelectedType] = useState<'Customer' | 'Product'>('Customer');
  const customers = useStore((state) => state.customers);
  const currencySymbol = useStore((state) => state.currencySymbol);

  const handleClick = () => {
    if (item.itemType === 'Template') {
      const template = item as Template;
      navigate(`/template/${template.id}`);
    } else if (item.itemType === 'Invoice') {
      const invoice = item as Invoice;
      navigate(`/invoice/${invoice.id}`);
    } else if (item.itemType === 'Customer') {
      const customer = item as Customer;
      setSelectedItem(customer);
      setSelectedType('Customer');
      setDialogOpen(true);
    } else if (item.itemType === 'Product') {
      const product = item as Product;
      setSelectedItem(product);
      setSelectedType('Product');
      setDialogOpen(true);
    }
    // PDF items don't have dedicated pages yet
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    const confirmMessage = `Are you sure you want to delete this ${item.itemType}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      switch (item.itemType) {
        case 'Invoice':
          await dbApi.deleteInvoice(item.id);
          break;
        case 'Template':
          await dbApi.deleteTemplate(item.id);
          break;
        case 'PDF':
          await dbApi.deleteGeneratedPdf(item.id);
          break;
        case 'Customer':
          await dbApi.deleteCustomer(item.id);
          break;
        case 'Product':
          await dbApi.deleteProduct(item.id);
          break;
      }
      
      toast.success(`${item.itemType} deleted successfully`);
      // Refresh the feed by calling fetchDashboardData from store
      // We'll need to pass a callback or use a different approach
      // For now, we'll reload the page
      window.location.reload();
    } catch (error) {
      console.error(`Failed to delete ${item.itemType}:`, error);
      toast.error(`Failed to delete ${item.itemType}`);
    }
  };

  const renderContent = () => {
    switch (item.itemType) {
      case 'Invoice': {
        const invoice = item as Invoice;
        const customer = customers.find(c => c.id === invoice.customerId);
        const customerName = customer?.name || 'Unknown Customer';
        const invoiceNumber = invoice.invoiceNumber || `#${invoice.id.substring(0, 8)}`;
        const nickname = invoice.nickname || customerName;
        
        return (
          <div className="flex items-center space-x-4">
            <FileText className="h-10 w-10 text-blue-600" />
            <div className='flex-grow'>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    {nickname}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <div>{customerName}</div>
                    <div>{invoiceNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex justify-end mb-1">
                    <Badge className={`${getBadgeColor('Invoice')} font-medium`}>
                      Invoice
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">{currencySymbol}{invoice.grandTotal.toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Updated: {formatDate(invoice.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'Template': {
        const template = item as Template;
        return (
          <div className="flex items-center space-x-4">
            <DraftingCompass className="h-10 w-10 text-purple-600" />
            <div className='flex-grow'>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
                  <CardDescription className="text-sm">Paper Size: {template.paperSize}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex justify-end mb-1">
                    <Badge className={`${getBadgeColor('Template')} font-medium`}>
                      Template
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Updated: {formatDate(template.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'PDF': {
        const pdf = item as GeneratedPDF;
        return (
           <div className="flex items-center space-x-4">
             <FileCheck2 className="h-10 w-10 text-red-600" />
             <div className='flex-grow'>
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-xl font-bold">Generated PDF</CardTitle>
                   <CardDescription className="text-sm">For Invoice #{pdf.invoiceId.substring(0, 8)}</CardDescription>
                 </div>
                 <div className="text-right">
                   <div className="flex justify-end mb-1">
                     <Badge className={`${getBadgeColor('PDF')} font-medium`}>
                       PDF
                     </Badge>
                   </div>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="text-destructive hover:text-destructive hover:bg-destructive/10"
                     onClick={handleDelete}
                   >
                     <Trash2 className="h-5 w-5" />
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">Updated: {formatDate(pdf.updatedAt)}</p>
                 </div>
               </div>
             </div>
           </div>
        );
      }
      case 'Customer': {
        const customer = item as Customer;
        return (
          <div className="flex items-center space-x-4">
            <User className="h-10 w-10 text-green-600" />
            <div className='flex-grow'>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{customer.name}</CardTitle>
                  <CardDescription className="text-sm">{customer.email} • {customer.phone}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex justify-end mb-1">
                    <Badge className={`${getBadgeColor('Customer')} font-medium`}>
                      Customer
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                                     <p className="text-xs text-muted-foreground mt-2">Updated: {formatDate(customer.updatedAt)}</p>                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'Product': {
        const product = item as Product;
        return (
          <div className="flex items-center space-x-4">
            <Package className="h-10 w-10 text-amber-600" />
            <div className='flex-grow'>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                  <CardDescription className="text-sm text-blue-600 font-medium">
                    {currencySymbol}{product.defaultRate.toFixed(2)} per {product.unit}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex justify-end mb-1">
                    <Badge className={`${getBadgeColor('Product')} font-medium`}>
                      Product
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                                     <p className="text-xs text-muted-foreground mt-2">Updated: {formatDate(product.updatedAt)}</p>                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        onClick={handleClick}
        className={`hover:bg-accent transition-colors cursor-pointer border-l-4 ${getFeedTypeColor(item.itemType)}`}
      >
        <CardHeader>
          {renderContent()}
        </CardHeader>
      </Card>
      <DetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        data={selectedItem}
      />
    </>
  );
}
