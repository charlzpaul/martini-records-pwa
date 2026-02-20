// src/features/invoice-builder/components/LineItemsTable.tsx
import { useInvoiceStore } from '../store/useInvoiceStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { LineItem } from '@/db/models';

export function LineItemsTable() {
  const { activeInvoice, setLineItems } = useInvoiceStore();

  if (!activeInvoice) return null;

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Recalculate amount if rate or qty changes
        if (field === 'qty' || field === 'rate') {
            const qty = field === 'qty' ? Number(value) : newItem.qty;
            const rate = field === 'rate' ? Number(value) : newItem.rate;
            newItem.amount = qty * rate;
        }
        return newItem;
      }
      return item;
    });
    setLineItems(updatedLineItems);
  };

  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: `item-${crypto.randomUUID()}`,
      itemName: '',
      qty: 1,
      rate: 0,
      amount: 0,
    };
    setLineItems([...activeInvoice.lineItems, newLineItem]);
  };

  const removeLineItem = (id: string) => {
    const updatedLineItems = activeInvoice.lineItems.filter(item => item.id !== id);
    setLineItems(updatedLineItems);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeInvoice.lineItems.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.itemName}
                  onChange={(e) => handleLineItemChange(item.id, 'itemName', e.target.value)}
                  placeholder="Item name"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.qty}
                  onChange={(e) => handleLineItemChange(item.id, 'qty', Number(e.target.value))}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                />
              </TableCell>
              <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={addLineItem} variant="outline">Add Line Item</Button>

        <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>${activeInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>${activeInvoice.grandTotal.toFixed(2)}</span>
                </div>
            </div>
      </div>
    </div>
  );
}
