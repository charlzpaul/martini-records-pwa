// src/features/invoice-builder/components/LineItemsTable.tsx
import { useEffect, useRef } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useStore } from '@/store/useStore';
import { useTemplateStore } from '@/features/template-builder/store/useTemplateStore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import type { LineItem } from '@/db/models';

export function LineItemsTable() {
  const { activeInvoice, setLineItems, setAdjustmentValue } = useInvoiceStore();
  const { activeTemplate } = useTemplateStore();
  const products = useStore((state) => state.products);
  const currencySymbol = useStore((state) => state.currencySymbol);
  const prevTemplateIdRef = useRef<string | null>(null);
  const prevTemplateHashRef = useRef<string | null>(null);

  if (!activeInvoice) return null;

  // Get template layers for totals calculation
  const templateLayers = activeTemplate?.totalsBlockGroupedLayers || [];
  
  // Filter out subtotal and grand total layers (they're handled separately)
  const adjustmentLayers = templateLayers.filter(layer =>
    layer.id !== 'subtotal-layer' && layer.id !== 'grand-total-layer'
  );

  // Update existing line items when template changes
  useEffect(() => {
    if (!activeTemplate || !activeInvoice) return;

    const currentTemplateId = activeTemplate.id;
    const previousTemplateId = prevTemplateIdRef.current;

    // Create a hash of template properties that affect line items
    const templatePropertiesHash = JSON.stringify({
      id: activeTemplate.id,
      hasPercentageColumn: activeTemplate.hasPercentageColumn,
      percentageColumnValue: activeTemplate.percentageColumnValue,
      totalsBlockGroupedLayers: activeTemplate.totalsBlockGroupedLayers,
    });

    // Check if template properties actually changed (not initial load)
    if (prevTemplateHashRef.current && prevTemplateHashRef.current !== templatePropertiesHash) {
      // Update line items to reflect new template's percentage column settings
      const defaultPercentageValue = activeTemplate.hasPercentageColumn
        ? (activeTemplate.percentageColumnValue || 0)
        : 0;

      const updatedLineItems = activeInvoice.lineItems.map(item => {
        // Create updated item with new percentage value
        const updatedItem = { ...item };
        
        // Update percentage value based on template
        if (activeTemplate.hasPercentageColumn) {
          // If template has percentage column, set to template's default value
          updatedItem.percentageValue = defaultPercentageValue;
        } else {
          // If template doesn't have percentage column, set to 0
          updatedItem.percentageValue = 0;
        }

        // Recalculate amount with new percentage value
        const qty = Number(updatedItem.qty) || 0;
        const rate = Number(updatedItem.rate) || 0;
        const percentageValue = Number(updatedItem.percentageValue) || 0;
        
        let amount = qty * rate;
        if (activeTemplate.hasPercentageColumn && percentageValue > 0) {
          amount = amount * (1 + percentageValue / 100);
        }
        updatedItem.amount = amount;

        return updatedItem;
      });

      // Only update if there are actual changes
      if (JSON.stringify(updatedLineItems) !== JSON.stringify(activeInvoice.lineItems)) {
        setLineItems(updatedLineItems, templateLayers);
      }
    }

    // Update previous template hash reference
    prevTemplateHashRef.current = templatePropertiesHash;
    // Also update template ID reference for backward compatibility
    prevTemplateIdRef.current = currentTemplateId;
  }, [activeTemplate, activeInvoice, setLineItems, templateLayers]);

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Recalculate amount if rate, qty, or percentageValue changes
        if (field === 'qty' || field === 'rate' || field === 'percentageValue') {
            const qty = Number(newItem.qty) || 0;
            const rate = Number(newItem.rate) || 0;
            const percentageValue = Number(newItem.percentageValue) || 0;
            
            // Calculate base amount
            let amount = qty * rate;
            
            // Apply percentage if template has percentage column
            if (activeTemplate?.hasPercentageColumn && percentageValue > 0) {
              amount = amount * (1 + percentageValue / 100);
            }
            
            newItem.amount = amount;
        }
        return newItem;
      }
      return item;
    });
    setLineItems(updatedLineItems, templateLayers);
  };

  const handleProductSelect = (id: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const defaultRate = Number(product.defaultRate) || 0;
    const defaultQuantity = Number(product.defaultQuantity) || 1;

    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        // Preserve existing percentageValue or use template's default
        const percentageValue = item.percentageValue !== undefined
          ? Number(item.percentageValue) || 0
          : (activeTemplate?.hasPercentageColumn ? (activeTemplate.percentageColumnValue || 0) : 0);
        
        // Calculate base amount
        let amount = defaultRate * defaultQuantity;
        
        // Apply percentage if template has percentage column and percentageValue > 0
        if (activeTemplate?.hasPercentageColumn && percentageValue > 0) {
          amount = amount * (1 + percentageValue / 100);
        }

        return {
          ...item,
          itemName: product.name,
          rate: defaultRate,
          qty: defaultQuantity,
          percentageValue,
          amount,
          unit: product.unit
        };
      }
      return item;
    });
    setLineItems(updatedLineItems, templateLayers);
  };

  const addLineItem = () => {
    // Use template's default percentage value if template has percentage column
    const defaultPercentageValue = activeTemplate?.hasPercentageColumn
      ? (activeTemplate.percentageColumnValue || 0)
      : 0;
    
    const newLineItem: LineItem = {
      id: `item-${crypto.randomUUID()}`,
      itemName: '',
      qty: 1,
      rate: 0,
      amount: 0,
      percentageValue: defaultPercentageValue,
      // unit is omitted for manual line items
    };
    setLineItems([...activeInvoice.lineItems, newLineItem], templateLayers);
  };

  const removeLineItem = (id: string) => {
    const updatedLineItems = activeInvoice.lineItems.filter(item => item.id !== id);
    setLineItems(updatedLineItems, templateLayers);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-full inline-block align-middle">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] sm:min-w-[150px] md:min-w-[200px] sm:w-[50%]">Item</TableHead>
                <TableHead className="min-w-[70px] sm:min-w-[80px]">Qty</TableHead>
                <TableHead className="min-w-[70px] sm:min-w-[80px]">Rate</TableHead>
                {activeTemplate?.hasPercentageColumn && (
                  <TableHead className="min-w-[70px] sm:min-w-[80px]">{activeTemplate.percentageColumnHeader || 'Percentage'}</TableHead>
                )}
                <TableHead className="min-w-[80px] sm:min-w-[100px] text-right">Amount</TableHead>
                <TableHead className="min-w-[40px] sm:min-w-[50px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInvoice.lineItems.map(item => (
                <TableRow key={item.id} data-testid="line-item-row">
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex flex-col gap-2">
                      <Select
                        value={item.itemName}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            // Keep custom input
                          } else {
                            handleProductSelect(item.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="min-w-[100px] sm:min-w-[150px] text-sm sm:text-base">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom item...</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({currencySymbol}{product.defaultRate}/{product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.itemName}
                        onChange={(e) => handleLineItemChange(item.id, 'itemName', e.target.value)}
                        placeholder="Or type custom item name"
                        className="min-w-[100px] sm:min-w-[150px] text-sm sm:text-base"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleLineItemChange(item.id, 'qty', Number(e.target.value))}
                      className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                    />
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                        className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.unit ? `/${item.unit}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  {activeTemplate?.hasPercentageColumn && (
                    <TableCell className="py-2 sm:py-3">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.percentageValue || ''}
                          onChange={(e) => handleLineItemChange(item.id, 'percentageValue', Number(e.target.value) || 0)}
                          className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">%</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="py-2 sm:py-3 text-right font-medium">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2 sm:py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Button onClick={addLineItem} variant="outline" className="w-full sm:w-auto">Add Line Item</Button>

        <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencySymbol}{activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                
                {/* Show template-based adjustments */}
                {!activeTemplate ? (
                  <div className="text-center text-muted-foreground italic py-2">
                    Select a template to see totals
                  </div>
                ) : adjustmentLayers.length === 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{currencySymbol}{activeInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  adjustmentLayers.map(layer => {
                    if (!layer.isVisible) return null;
                    const amount = activeInvoice.appliedFees?.[layer.name] || 0;
                    const layerType = layer.type || 'percentage';
                    
                    return (
                      <div key={layer.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {layer.name}
                          </span>
                          {layerType === 'percentage' ? (
                            <span className="text-xs text-muted-foreground">
                              ({layer.percentage}%)
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={activeInvoice.adjustmentValues?.[layer.id] ?? layer.value ?? 0}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  setAdjustmentValue(layer.id, newValue, adjustmentLayers);
                                }}
                                className="h-6 w-20 text-xs"
                                placeholder="Value"
                                step="0.01"
                              />
                              <span className="text-xs text-muted-foreground">
                                (fixed)
                              </span>
                            </div>
                          )}
                        </div>
                        <span>{currencySymbol}{amount.toFixed(2)}</span>
                      </div>
                    );
                  })
                )}
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Grand Total</span>
                    <span>{currencySymbol}{activeInvoice.grandTotal.toFixed(2)}</span>
                </div>
            </div>
      </div>
    </div>
  );
}
