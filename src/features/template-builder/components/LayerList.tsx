// src/features/template-builder/components/LayerList.tsx
import React from 'react';
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';
import { Image, Type, Trash2, List, ArrowUp, ArrowDown, Plus, Receipt } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LayerList() {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const setSelectedItemId = useTemplateStore((state) => state.setSelectedItemId);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);

  if (!activeTemplate) return null;

  // Font options for invoice-appropriate fonts
  const fontOptions = [
    { id: 'Arial', name: 'Arial' },
    { id: 'Times New Roman', name: 'Times New Roman' },
    { id: 'Helvetica', name: 'Helvetica' },
    { id: 'Georgia', name: 'Georgia' },
    { id: 'Courier New', name: 'Courier New' },
  ];

  // Font size options (common sizes for invoices)
  const fontSizeOptions = [
    { value: 8, label: '8pt' },
    { value: 9, label: '9pt' },
    { value: 10, label: '10pt' },
    { value: 11, label: '11pt' },
    { value: 12, label: '12pt' },
    { value: 14, label: '14pt' },
    { value: 16, label: '16pt' },
    { value: 18, label: '18pt' },
    { value: 20, label: '20pt' },
    { value: 24, label: '24pt' },
    { value: 28, label: '28pt' },
    { value: 32, label: '32pt' },
    { value: 36, label: '36pt' },
    { value: 48, label: '48pt' },
    { value: 72, label: '72pt' },
  ];

  // Separate totals block label from other labels for grouping
  const totalsBlockLabel = activeTemplate.labels.find(lbl => lbl.id === 'totals-block');
  const otherLabels = activeTemplate.labels.filter(lbl => lbl.id !== 'totals-block');
  
  // Combine labels, images, and line item area into a single list for rendering
  // Labels should appear above images in the layer list (default layers above image layer)
  const layers = [
    ...otherLabels.map(lbl => ({ ...lbl, itemType: 'Label' })),
    ...activeTemplate.images.map(img => ({ ...img, itemType: 'Image' })),
    // Add line item area as a special layer
    {
      id: 'line-items-area',
      itemType: 'LineItemsArea' as const,
      textValue: 'Line Items Area',
      x: activeTemplate.lineItemArea.x,
      y: activeTemplate.lineItemArea.y,
      width: activeTemplate.lineItemArea.width,
      height: activeTemplate.lineItemArea.height,
      fontSize: activeTemplate.lineItemArea.fontSize || 10,
      fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial',
    },
    // Add percentage column as a grouped layer if enabled
    ...(activeTemplate.hasPercentageColumn ? [{
      id: 'percentage-column-layer',
      itemType: 'PercentageColumn' as const,
      textValue: 'Percentage Column',
      x: activeTemplate.lineItemArea.x,
      y: activeTemplate.lineItemArea.y,
      width: activeTemplate.lineItemArea.width,
      height: activeTemplate.lineItemArea.height,
    }] : []),
    // Add totals block as a special layer (will render grouped layers as children)
    ...(totalsBlockLabel ? [{
      ...totalsBlockLabel,
      itemType: 'TotalsBlock' as const,
    }] : [])
  ];
  
  // Get totals block grouped layers separately for rendering
  const totalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];

  const handleAddPercentageColumn = () => {
    if (activeTemplate.hasPercentageColumn) {
      // Percentage column already exists, do nothing
      return;
    }
    
    // Enable percentage column
    const currentColumnWidths = activeTemplate.lineItemArea.columnWidths || [200, 80, 80, 100];
    // Insert percentage column width (80px) before the amount column (last column)
    const newColumnWidths = [
      ...currentColumnWidths.slice(0, 3), // Item, Quantity, Rate
      80, // Percentage column width
      ...currentColumnWidths.slice(3) // Amount column
    ];
    
    // Add a corresponding totals block grouped layer for the percentage column
    const percentageColumnHeader = activeTemplate.percentageColumnHeader || 'Percentage';
    const percentageColumnValue = activeTemplate.percentageColumnValue || 10;
    const newTotalsBlockGroupedLayer = {
      id: 'percentage-column-totals-layer',
      name: percentageColumnHeader,
      percentage: percentageColumnValue,
      isVisible: true,
      isUndeletable: true, // This layer cannot be deleted as it depends on the percentage column
    };
    
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    
    // Insert percentage column layer before the Grand Total layer (which should be last)
    // Find the index of the Grand Total layer
    const grandTotalIndex = currentTotalsBlockGroupedLayers.findIndex(
      layer => layer.id === 'grand-total-layer'
    );
    
    let updatedTotalsBlockGroupedLayers;
    if (grandTotalIndex >= 0) {
      // Insert before Grand Total
      updatedTotalsBlockGroupedLayers = [
        ...currentTotalsBlockGroupedLayers.slice(0, grandTotalIndex),
        newTotalsBlockGroupedLayer,
        ...currentTotalsBlockGroupedLayers.slice(grandTotalIndex)
      ];
    } else {
      // Fallback: append to the end
      updatedTotalsBlockGroupedLayers = [...currentTotalsBlockGroupedLayers, newTotalsBlockGroupedLayer];
    }
    
    updateActiveTemplate({
      hasPercentageColumn: true,
      percentageColumnHeader,
      percentageColumnValue,
      lineItemArea: {
        ...activeTemplate.lineItemArea,
        columnWidths: newColumnWidths
      },
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handlePercentageColumnHeaderChange = (header: string) => {
    // Update the corresponding totals block grouped layer name as well
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer => {
      if (layer.id === 'percentage-column-totals-layer') {
        return { ...layer, name: header };
      }
      return layer;
    });
    
    updateActiveTemplate({
      percentageColumnHeader: header,
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handlePercentageColumnValueChange = (value: number) => {
    // Update the corresponding totals block grouped layer percentage as well
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer => {
      if (layer.id === 'percentage-column-totals-layer') {
        return { ...layer, percentage: value };
      }
      return layer;
    });
    
    updateActiveTemplate({
      percentageColumnValue: value,
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handleAddTotalsGroupedLayer = () => {
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    
    // Count existing adjustment layers to determine next number
    const adjustmentLayers = currentTotalsBlockGroupedLayers.filter(layer =>
      layer.name.toLowerCase().startsWith('adjustment')
    );
    const nextAdjustmentNumber = adjustmentLayers.length + 1;
    
    const newLayer = {
      id: `totals-layer-${Date.now()}`,
      name: nextAdjustmentNumber === 1 ? 'Adjustment' : `Adjustment ${nextAdjustmentNumber}`,
      type: 'percentage' as const,
      percentage: 10, // Default to 10%
      value: 0,
      isVisible: true,
      isUndeletable: false,
    };
    
    // Insert new layer before the Grand Total layer (which should be last)
    // Find the index of the Grand Total layer
    const grandTotalIndex = currentTotalsBlockGroupedLayers.findIndex(
      layer => layer.id === 'grand-total-layer'
    );
    
    let updatedLayers;
    if (grandTotalIndex >= 0) {
      // Insert before Grand Total
      updatedLayers = [
        ...currentTotalsBlockGroupedLayers.slice(0, grandTotalIndex),
        newLayer,
        ...currentTotalsBlockGroupedLayers.slice(grandTotalIndex)
      ];
    } else {
      // Fallback: append to the end
      updatedLayers = [...currentTotalsBlockGroupedLayers, newLayer];
    }
    
    updateActiveTemplate({
      totalsBlockGroupedLayers: updatedLayers
    });
  };

  const handleUpdateGroupedLayerName = (layerId: string, name: string) => {
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer =>
      layer.id === layerId ? { ...layer, name } : layer
    );
    
    updateActiveTemplate({
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handleUpdateGroupedLayerPercentage = (layerId: string, percentage: number) => {
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer =>
      layer.id === layerId ? { ...layer, percentage } : layer
    );
    
    updateActiveTemplate({
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handleUpdateGroupedLayerType = (layerId: string, type: 'percentage' | 'value') => {
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer =>
      layer.id === layerId ? { ...layer, type } : layer
    );
    
    updateActiveTemplate({
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handleUpdateGroupedLayerValue = (layerId: string, value: number) => {
    const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
    const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.map(layer =>
      layer.id === layerId ? { ...layer, value } : layer
    );
    
    updateActiveTemplate({
      totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
    });
  };

  const handleDeleteLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the layer when clicking delete
    
    // Handle deletion of percentage column layer
    if (layerId === 'percentage-column-layer') {
      // Disable percentage column
      const currentColumnWidths = activeTemplate.lineItemArea.columnWidths || [200, 80, 80, 80, 100];
      // Remove percentage column width (index 3)
      const newColumnWidths = [
        ...currentColumnWidths.slice(0, 3), // Item, Quantity, Rate
        ...currentColumnWidths.slice(4) // Amount column (skip percentage)
      ];
      
      // Also remove the corresponding totals block grouped layer
      const currentTotalsBlockGroupedLayers = activeTemplate.totalsBlockGroupedLayers || [];
      const updatedTotalsBlockGroupedLayers = currentTotalsBlockGroupedLayers.filter(
        layer => layer.id !== 'percentage-column-totals-layer'
      );
      
      updateActiveTemplate({
        hasPercentageColumn: false,
        lineItemArea: {
          ...activeTemplate.lineItemArea,
          columnWidths: newColumnWidths
        },
        totalsBlockGroupedLayers: updatedTotalsBlockGroupedLayers
      });
      
      // If the deleted layer was selected, clear selection
      if (selectedItemId === layerId) {
        setSelectedItemId(null);
      }
      return;
    }
    
    // Handle deletion of totals block grouped layers
    const totalsBlockGroupedLayer = activeTemplate.totalsBlockGroupedLayers?.find(layer => layer.id === layerId);
    if (totalsBlockGroupedLayer) {
      // Don't delete undeletable layers
      if (totalsBlockGroupedLayer.isUndeletable) {
        return;
      }
      
      const updatedLayers = activeTemplate.totalsBlockGroupedLayers?.filter(layer => layer.id !== layerId) || [];
      updateActiveTemplate({
        totalsBlockGroupedLayers: updatedLayers
      });
      
      // If the deleted layer was selected, clear selection
      if (selectedItemId === layerId) {
        setSelectedItemId(null);
      }
      return;
    }
    
    // Prevent deletion of line items area
    if (layerId === 'line-items-area') {
      return;
    }
    
    const isImage = activeTemplate.images.some(img => img.id === layerId);
    if (isImage) {
      const updatedImages = activeTemplate.images.filter(img => img.id !== layerId);
      updateActiveTemplate({ images: updatedImages });
    } else {
      const updatedLabels = activeTemplate.labels.filter(lbl => lbl.id !== layerId);
      updateActiveTemplate({ labels: updatedLabels });
    }
    
    // If the deleted layer was selected, clear selection
    if (selectedItemId === layerId) {
      setSelectedItemId(null);
    }
  };

  const handleMoveImage = (imageId: string, direction: 'up' | 'down') => {
    const images = [...activeTemplate.images];
    const currentIndex = images.findIndex(img => img.id === imageId);
    
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous image
      [images[currentIndex], images[currentIndex - 1]] = [images[currentIndex - 1], images[currentIndex]];
      updateActiveTemplate({ images });
    } else if (direction === 'down' && currentIndex < images.length - 1) {
      // Swap with next image
      [images[currentIndex], images[currentIndex + 1]] = [images[currentIndex + 1], images[currentIndex]];
      updateActiveTemplate({ images });
    }
  };

  const getLayerDisplayName = (layer: any) => {
    if (layer.itemType === 'Image') {
      return `Image: ${layer.fileName || layer.id.substring(0, 6)}`;
    }
    
    if (layer.itemType === 'Label' || layer.itemType === 'TotalsBlock') {
      // Check for specific default block IDs and return matching dropdown names
      if (layer.id === 'customer-info' || layer.id?.includes('customer-info')) {
        return 'Customer Info Block';
      }
      if (layer.id === 'date-block' || layer.id?.includes('date-block')) {
        return 'Date Block';
      }
      if (layer.id === 'invoice-number' || layer.id?.includes('invoice-number')) {
        return 'Invoice Number Block';
      }
      if (layer.id === 'totals-block' || layer.id?.includes('totals-block')) {
        return 'Totals Block';
      }
      // For other labels, use text value or generic name
      return (layer as any).textValue?.substring(0, 30) || 'Label';
    }
    
    if (layer.itemType === 'PercentageColumn') {
      return 'Percentage Column';
    }
    
    if (layer.itemType === 'LineItemsArea') {
      return 'Line Items Area';
    }
    
    return 'Unknown Layer';
  };

  const handleFontChange = (layerId: string, fontFamily: string) => {
    // For labels, update font family
    const label = activeTemplate.labels.find(lbl => lbl.id === layerId);
    if (label) {
      const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === layerId ? { ...lbl, fontFamily } : lbl
      );
      updateActiveTemplate({ labels: updatedLabels });
      return;
    }
    
    // For line items area, update font family in lineItemArea
    if (layerId === 'line-items-area') {
      updateActiveTemplate({
        lineItemArea: {
          ...activeTemplate.lineItemArea,
          fontFamily
        }
      });
    }
  };

  const handleFontSizeChange = (layerId: string, fontSize: number) => {
    // For labels, update font size and adjust width/height proportionally
    const label = activeTemplate.labels.find(lbl => lbl.id === layerId);
    if (label) {
      const oldFontSize = label.fontSize || 12;
      const ratio = fontSize / oldFontSize;
      
      // Calculate new dimensions, preserving minimum sizes
      const newWidth = Math.max(label.width ? label.width * ratio : 200 * ratio, 50);
      const newHeight = Math.max(label.height ? label.height * ratio : 30 * ratio, 20);
      
      const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === layerId ? {
          ...lbl,
          fontSize,
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        } : lbl
      );
      updateActiveTemplate({ labels: updatedLabels });
      return;
    }
    
    // For line items area, update font size in lineItemArea
    if (layerId === 'line-items-area') {
      updateActiveTemplate({
        lineItemArea: {
          ...activeTemplate.lineItemArea,
          fontSize
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Layers & Styles</h3>
      <div className="space-y-1 rounded-md border p-2">
        {layers.map(layer => (
          <React.Fragment key={layer.id}>
            {/* Render the layer itself */}
            <div
              onClick={() => setSelectedItemId(layer.id)}
              className={cn(
                "flex items-center justify-between rounded-md p-2 text-sm cursor-pointer hover:bg-accent group",
                layer.id === selectedItemId && "bg-accent font-semibold",
                layer.itemType === 'PercentageColumn' && "ml-4 border-l-2 border-accent/50",
                layer.itemType === 'TotalsBlock' && "bg-accent/20"
              )}
            >
              <div className="flex items-center space-x-2 flex-grow min-w-0">
                {layer.itemType === 'Image' ?
                  <Image className="h-4 w-4 flex-shrink-0" /> :
                  layer.itemType === 'Label' || layer.itemType === 'TotalsBlock' ?
                  <Type className="h-4 w-4 flex-shrink-0" /> :
                  layer.itemType === 'PercentageColumn' ?
                  <Receipt className="h-4 w-4 flex-shrink-0" /> :
                  <List className="h-4 w-4 flex-shrink-0" />
                }
                <span className="truncate">
                  {getLayerDisplayName(layer)}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 flex-shrink-0">
                {(layer.itemType === 'Label' || layer.itemType === 'TotalsBlock' || layer.itemType === 'LineItemsArea') && (
                 <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                   <Select
                     value={layer.itemType === 'LineItemsArea'
                       ? (activeTemplate.lineItemArea.fontFamily || 'Arial')
                       : ((layer as any).fontFamily || 'Arial')}
                     onValueChange={(value) => handleFontChange(layer.id, value)}
                   >
                     <SelectTrigger className="h-6 w-24 text-xs">
                       <SelectValue placeholder="Font" />
                     </SelectTrigger>
                     <SelectContent>
                       {fontOptions.map(font => (
                         <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <Select
                     value={((layer as any).fontSize || 12).toString()}
                     onValueChange={(value) => handleFontSizeChange(layer.id, parseInt(value))}
                   >
                     <SelectTrigger className="h-6 w-16 text-xs">
                       <SelectValue placeholder="Size" />
                     </SelectTrigger>
                     <SelectContent>
                       {fontSizeOptions.map(size => (
                         <SelectItem key={size.value} value={size.value.toString()}>{size.label}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}
                  
                  {layer.itemType === 'Image' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(layer.id, 'up');
                        }}
                        disabled={activeTemplate.images.findIndex(img => img.id === layer.id) === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(layer.id, 'down');
                        }}
                        disabled={activeTemplate.images.findIndex(img => img.id === layer.id) === activeTemplate.images.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  {layer.itemType === 'LineItemsArea' && !activeTemplate.hasPercentageColumn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPercentageColumn();
                      }}
                      title="Add % Column"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  {layer.itemType === 'PercentageColumn' && (
                    <>
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                        <Input
                          value={activeTemplate.percentageColumnHeader || 'Percentage'}
                          onChange={(e) => handlePercentageColumnHeaderChange(e.target.value)}
                          className="h-6 w-24 text-xs"
                          placeholder="Percentage"
                          title="Column header name"
                        />
                        <Select
                          value={activeTemplate.percentageColumnValue?.toString() || '10'}
                          onValueChange={(value) => handlePercentageColumnValueChange(parseInt(value))}
                        >
                          <SelectTrigger className="h-6 w-16 text-xs">
                            <SelectValue placeholder="%" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteLayer(layer.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {layer.itemType === 'TotalsBlock' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTotalsGroupedLayer();
                      }}
                      title="Add Adjustment Layer"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  {layer.itemType !== 'LineItemsArea' && layer.itemType !== 'PercentageColumn' && layer.itemType !== 'TotalsBlock' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteLayer(layer.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
              </div>
            </div>
            
            {/* Render grouped layers under TotalsBlock */}
            {layer.itemType === 'TotalsBlock' && totalsBlockGroupedLayers.length > 0 && (
              <div className="ml-4 space-y-1 border-l-2 border-accent/20 pl-2">
                {totalsBlockGroupedLayers.map(groupedLayer => (
                  <div
                    key={groupedLayer.id}
                    onClick={() => setSelectedItemId(groupedLayer.id)}
                    className={cn(
                      "flex items-center justify-between rounded-md p-2 text-sm cursor-pointer hover:bg-accent/50 group",
                      groupedLayer.id === selectedItemId && "bg-accent/50 font-semibold"
                    )}
                  >
                    <div className="flex items-center space-x-2 flex-grow min-w-0">
                      <Receipt className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        {groupedLayer.id === 'percentage-column-totals-layer' ? (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Percentage Column</span>
                        ) : !groupedLayer.isUndeletable ? (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Adjustment</span>
                        ) : null}
                        <Input
                          value={groupedLayer.name}
                          onChange={(e) => handleUpdateGroupedLayerName(groupedLayer.id, e.target.value)}
                          className="h-6 text-xs w-20"
                          size={1}
                        />
                        {/* Don't show type dropdown and value/percentage inputs for Subtotal and Grand Total layers */}
                        {groupedLayer.id !== 'subtotal-layer' && groupedLayer.id !== 'grand-total-layer' && (
                          <>
                            <Select
                              value={groupedLayer.type}
                              onValueChange={(value: 'percentage' | 'value') => handleUpdateGroupedLayerType(groupedLayer.id, value)}
                            >
                              <SelectTrigger className="h-6 w-20 text-xs">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="value">Value</SelectItem>
                              </SelectContent>
                            </Select>
                            {groupedLayer.type === 'percentage' ? (
                              <Select
                                value={groupedLayer.percentage.toString()}
                                onValueChange={(value) => handleUpdateGroupedLayerPercentage(groupedLayer.id, parseInt(value))}
                              >
                                <SelectTrigger className="h-6 w-16 text-xs">
                                  <SelectValue placeholder="%" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 100 }, (_, i) => i).map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}%</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="number"
                                value={groupedLayer.value}
                                onChange={(e) => handleUpdateGroupedLayerValue(groupedLayer.id, parseFloat(e.target.value) || 0)}
                                className="h-6 text-xs w-20"
                                placeholder="Value"
                                step="0.01"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {!groupedLayer.isUndeletable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteLayer(groupedLayer.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        {layers.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No layers yet. Add images or blocks to get started.</p>
        )}
      </div>
    </div>
  );
}
