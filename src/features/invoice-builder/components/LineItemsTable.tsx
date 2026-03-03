// src/features/invoice-builder/components/LineItemsTable.tsx
import { useEffect, useRef, useState } from 'react';
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
import { TypeableSelect } from '@/components/ui/typeable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
import type { LineItem } from '@/db/models';
import { isValidNumericInput, formatNumericValue } from '@/lib/utils';
import { toast } from 'sonner';
import * as dbApi from '@/db/api';

export function LineItemsTable() {
  const { activeInvoice, setLineItems, setAdjustmentValue } = useInvoiceStore();
  const { activeTemplate } = useTemplateStore();
  const products = useStore((state) => state.products);
  const fetchDashboardData = useStore((state) => state.fetchDashboardData);
  const currencySymbol = useStore((state) => state.currencySymbol);
  const prevTemplateIdRef = useRef<string | null>(null);
  const prevTemplateHashRef = useRef<string | null>(null);
  const [adjustmentInputValues, setAdjustmentInputValues] = useState<Record<string, string>>({});
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    defaultRate: '',
    defaultQuantity: '1',
    unit: 'item' as 'hour' | 'item' | 'service'
  });

  if (!activeInvoice) return null;

  // Prepare product options for TypeableSelect
  const productOptions = products.map(product => ({
    id: product.id,
    label: product.name,
    value: product.id,
    description: `${currencySymbol}${product.defaultRate}/${product.unit}`
  }));

  // Add a "Custom item" option
  const allProductOptions = [
    {
      id: 'custom',
      label: 'Custom item...',
      value: 'custom'
    },
    ...productOptions
  ];

  const handleAddProduct = async () => {
    try {
      if (!newProductForm.name.trim()) {
        toast.error('Validation Error', { description: 'Product name is required' });
        return;
      }

      const defaultRate = parseFloat(newProductForm.defaultRate);
      if (isNaN(defaultRate) || defaultRate < 0) {
        toast.error('Validation Error', { description: 'Please enter a valid rate' });
        return;
      }

      const defaultQuantity = parseFloat(newProductForm.defaultQuantity);
      if (isNaN(defaultQuantity) || defaultQuantity < 0) {
        toast.error('Validation Error', { description: 'Please enter a valid quantity' });
        return;
      }

      await dbApi.saveProduct({
        name: newProductForm.name.trim(),
        defaultRate,
        defaultQuantity,
        unit: newProductForm.unit
      });

      toast.success('Product Added', { description: `${newProductForm.name} has been added successfully` });
      
      // Reset form
      setNewProductForm({
        name: '',
        defaultRate: '',
        defaultQuantity: '1',
        unit: 'item'
      });
      
      setProductDialogOpen(false);
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error', { description: 'Failed to add product' });
    }
  };

  // Get template layers for totals calculation
  const templateLayers = activeTemplate?.totalsBlockGroupedLayers || [];
  
  // Filter out subtotal and grand total layers (they're handled separately)
  const adjustmentLayers = templateLayers.filter(layer =>
    layer.id !== 'subtotal-layer' && layer.id !== 'grand-total-layer'
  );

  // Update existing line items when template changes
  useEffect(() => {
    if (!activeTemplate || !activeInvoice) return;

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
        // Safely parse values, treating NaN as 0
        const parseSafe = (val: any): number => {
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        };
        
        const qty = parseSafe(updatedItem.qty);
        const rate = parseSafe(updatedItem.rate);
        const percentageValue = parseSafe(updatedItem.percentageValue);
        
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
    prevTemplateIdRef.current = activeTemplate.id;
  }, [activeTemplate, activeInvoice, setLineItems, templateLayers]);

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    let finalValue: string | number = value;
    
    // For numeric fields (qty, rate, percentageValue), validate the input
    if (field === 'qty' || field === 'rate' || field === 'percentageValue') {
      const stringValue = String(value);
      
      // Allow empty string for clearing (treat as 0)
      if (stringValue === '') {
        finalValue = 0; // Store as 0 instead of empty string
      } else if (!isValidNumericInput(stringValue)) {
        // Invalid input, don't update
        return;
      } else {
        // Store the string value for intermediate states like ".", "-", "-."
        // These will be parsed as 0 in calculations
        finalValue = stringValue;
      }
    }
    
    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: finalValue };
        // Recalculate amount if rate, qty, or percentageValue changes
        if (field === 'qty' || field === 'rate' || field === 'percentageValue') {
            // Safely parse values, treating NaN as 0
            const parseSafe = (val: any): number => {
              const num = Number(val);
              return isNaN(num) ? 0 : num;
            };
            
            const qty = parseSafe(newItem.qty);
            const rate = parseSafe(newItem.rate);
            const percentageValue = parseSafe(newItem.percentageValue);
            
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
    <>
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
                        <TypeableSelect
                          options={allProductOptions}
                          value={item.itemName ? (products.find(p => p.name === item.itemName)?.id || 'custom') : undefined}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              // Keep custom input - clear any product selection
                              handleLineItemChange(item.id, 'itemName', '');
                            } else {
                              handleProductSelect(item.id, value);
                            }
                          }}
                          placeholder="Select product..."
                          searchPlaceholder="Search products..."
                          emptyMessage="No products found."
                          showAddNew={true}
                          onAddNew={() => setProductDialogOpen(true)}
                          addNewLabel="Add new product"
                          className="min-w-[100px] sm:min-w-[150px] text-sm"
                        />
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
                      type="text"
                      inputMode="decimal"
                      value={formatNumericValue(item.qty)}
                      onChange={(e) => handleLineItemChange(item.id, 'qty', e.target.value)}
                      className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                    />
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericValue(item.rate)}
                        onChange={(e) => handleLineItemChange(item.id, 'rate', e.target.value)}
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
                          type="text"
                          inputMode="decimal"
                          value={formatNumericValue(item.percentageValue || 0)}
                          onChange={(e) => handleLineItemChange(item.id, 'percentageValue', e.target.value)}
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
                                type="text"
                                inputMode="decimal"
                                value={adjustmentInputValues[layer.id] !== undefined
                                  ? adjustmentInputValues[layer.id]
                                  : formatNumericValue(activeInvoice.adjustmentValues?.[layer.id] ?? layer.value ?? 0)}
                                onChange={(e) => {
                                  const stringValue = e.target.value;
                                  if (stringValue === '' || isValidNumericInput(stringValue)) {
                                    // Store the string value in local state for intermediate states
                                    setAdjustmentInputValues(prev => ({
                                      ...prev,
                                      [layer.id]: stringValue
                                    }));
                                    
                                    // If the input is a complete number (not intermediate state), update the store
                                    if (stringValue !== '' &&
                                        stringValue !== '-' &&
                                        stringValue !== '.' &&
                                        stringValue !== '-.' &&
                                        !stringValue.endsWith('.')) {
                                      const parsed = parseFloat(stringValue);
                                      if (!isNaN(parsed)) {
                                        setAdjustmentValue(layer.id, parsed, adjustmentLayers);
                                      }
                                    } else if (stringValue === '') {
                                      // Empty string means 0
                                      setAdjustmentValue(layer.id, 0, adjustmentLayers);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  // When the input loses focus, finalize the value
                                  const stringValue = adjustmentInputValues[layer.id];
                                  if (stringValue !== undefined) {
                                    let finalValue: number;
                                    if (stringValue === '' || stringValue === '-' || stringValue === '.' || stringValue === '-.') {
                                      finalValue = 0;
                                    } else {
                                      const parsed = parseFloat(stringValue);
                                      finalValue = isNaN(parsed) ? 0 : parsed;
                                    }
                                    setAdjustmentValue(layer.id, finalValue, adjustmentLayers);
                                    // Clear the local string value so the display uses formatNumericValue
                                    setAdjustmentInputValues(prev => {
                                      const newValues = { ...prev };
                                      delete newValues[layer.id];
                                      return newValues;
                                    });
                                  }
                                }}
                                className="h-6 w-20 text-xs"
                                placeholder="Value"
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

      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name *</Label>
              <Input
                id="product-name"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-rate">Default Rate ({currencySymbol}) *</Label>
              <Input
                id="product-rate"
                type="number"
                min="0"
                step="0.01"
                value={newProductForm.defaultRate}
                onChange={(e) => setNewProductForm({...newProductForm, defaultRate: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-quantity">Default Quantity *</Label>
              <Input
                id="product-quantity"
                type="number"
                min="0"
                step="1"
                value={newProductForm.defaultQuantity}
                onChange={(e) => setNewProductForm({...newProductForm, defaultQuantity: e.target.value})}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-unit">Unit</Label>
              <select
                id="product-unit"
                value={newProductForm.unit}
                onChange={(e) => setNewProductForm({...newProductForm, unit: e.target.value as 'hour' | 'item' | 'service'})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="item">Item</option>
                <option value="hour">Hour</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>
                Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
