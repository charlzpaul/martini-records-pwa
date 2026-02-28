// src/features/template-builder/components/TotalsBlock.tsx
import { useDraggable } from '@dnd-kit/core';
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';
import { Resizable, type ResizeCallback } from 're-resizable';
import React from 'react';

interface TotalsBlockProps {
  label: {
    id: string;
    type: 'Subtotal' | 'Total' | 'Tax' | 'Discount' | 'Custom';
    textValue: string;
    isVisible: boolean;
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    width?: number;
    height?: number;
  };
  isSelected: boolean;
}

export function TotalsBlock({ label, isSelected }: TotalsBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: label.id,
    disabled: !isSelected,
  });
  
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isResizingRef = React.useRef(false);
  const handleResizeStop: ResizeCallback = (_e, _direction, _ref, d) => {
    if (isResizingRef.current || !activeTemplate) return;
    
    isResizingRef.current = true;
    const newWidth = (label.width || 200) + d.width;
    const newHeight = (label.height || 30) + d.height;

    const updatedLabels = activeTemplate.labels.map(lbl =>
      lbl.id === label.id ? { ...lbl, width: newWidth, height: newHeight } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isResizingRef.current = false;
    }, 100);
  };

  const width = label.width || 200;
  const height = label.height || 30;

  // Calculate subtotal from sample line items
  const calculateSubtotal = () => {
    // For template builder, we show sample calculations
    // In a real invoice, this would be calculated from actual line items
    const sampleLineItems = [
      { qty: 1, rate: 100 },
      { qty: 2, rate: 50 }
    ];
    return sampleLineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  };

  const subtotal = calculateSubtotal();
  const totalsBlockGroupedLayers = activeTemplate?.totalsBlockGroupedLayers || [];
  
  // Get Subtotal and Grand Total layer names
  const subtotalLayer = totalsBlockGroupedLayers.find(layer => layer.id === 'subtotal-layer');
  const grandTotalLayer = totalsBlockGroupedLayers.find(layer => layer.id === 'grand-total-layer');
  const subtotalLabel = subtotalLayer?.name || 'Subtotal';
  const grandTotalLabel = grandTotalLayer?.name || 'Total';
  
  // Filter out Subtotal and Grand Total layers as they are rendered separately
  const filteredGroupedLayers = totalsBlockGroupedLayers.filter(
    layer => layer.id !== 'subtotal-layer' && layer.id !== 'grand-total-layer'
  );


  // Calculate total based on subtotal and grouped layers
  const calculateTotal = () => {
    let total = subtotal;
    totalsBlockGroupedLayers.forEach(layer => {
      if (layer.isVisible) {
        const type = layer.type || 'percentage';
        const percentage = layer.percentage ?? 0;
        const value = layer.value ?? 0;
        if (type === 'percentage') {
          total += (subtotal * percentage) / 100;
        } else {
          total += value;
        }
      }
    });
    return total;
  };

  const total = calculateTotal();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute ${isSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <Resizable
        size={{ width, height }}
        onResizeStop={handleResizeStop}
        className={cn(
          "relative border-2 border-dashed border-secondary bg-white",
          isSelected && "outline-2 outline-dashed outline-accent outline-offset-2"
        )}
      >
        <div className="w-full h-full p-2 overflow-auto">
          <div className="space-y-1">
            {/* Subtotal row */}
            <div className="flex justify-between items-center">
              <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                {subtotalLabel}
              </span>
              <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {/* Grouped layers (excluding Subtotal and Grand Total which are rendered separately) */}
            {filteredGroupedLayers.map((layer) => {
              const type = layer.type || 'percentage';
              const percentage = layer.percentage ?? 0;
              const value = layer.value ?? 0;
              const amount = type === 'percentage'
                ? (subtotal * percentage) / 100
                : value;
              const layerLabel = type === 'percentage'
                ? `${layer.name} (${percentage}%)`
                : layer.name;
              return (
                <div key={layer.id} className="flex justify-between items-center">
                  <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                    {layerLabel}
                  </span>
                  <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                    ${amount.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Total row */}
            <div className="flex justify-between items-center font-bold pt-1 border-t">
              <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                {grandTotalLabel}
              </span>
              <span style={{ fontSize: label.fontSize, fontFamily: label.fontFamily || 'Arial' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Resizable>
    </div>
  );
}