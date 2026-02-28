// src/features/template-builder/components/Canvas.tsx
import { useTemplateStore } from '../store/useTemplateStore';
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core';
import { DraggableImage } from './DraggableImage';
import { DraggableLabel } from './DraggableLabel';
import { TotalsBlock } from './TotalsBlock';
import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', aspectRatio: '210/297' },
  Letter: { width: '8.5in', height: '11in', aspectRatio: '8.5/11' },
};

interface DraggableLineItemAreaProps {
  scaleX: number;
  scaleY: number;
}

function DraggableLineItemArea({ scaleX, scaleY }: DraggableLineItemAreaProps) {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);

  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidths, setResizeStartWidths] = useState<number[]>([]);
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  
  // Use a ref for immediate access to column resizing state
  const isColumnResizingRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'line-items-area',
    disabled: selectedItemId !== 'line-items-area' || isColumnResizingRef.current,
  });

  if (!activeTemplate) return null;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleResizeStop = (_e: any, _direction: any, _ref: any, d: any) => {
    if (isResizing) return;
    
    setIsResizing(true);
    // Convert screen pixel delta to reference pixel delta using scale factors
    const widthDelta = scaleX > 0 ? d.width / scaleX : d.width;
    const heightDelta = scaleY > 0 ? d.height / scaleY : d.height;
    
    const newWidth = Math.max(200, Math.min(800, activeTemplate.lineItemArea.width + widthDelta));
    const newHeight = Math.max(100, Math.min(800, activeTemplate.lineItemArea.height + heightDelta));
    updateActiveTemplate({
      lineItemArea: {
        ...activeTemplate.lineItemArea,
        width: newWidth,
        height: newHeight
      }
    });
    
    setTimeout(() => setIsResizing(false), 100);
  };

  // Get column widths or use defaults
  const columnWidths = activeTemplate.lineItemArea.columnWidths ||
    (activeTemplate.hasPercentageColumn ? [200, 80, 80, 80, 100] : [200, 80, 80, 100]);
  const columnHeaders = activeTemplate.hasPercentageColumn
    ? ['Item', 'Quantity', 'Rate', activeTemplate.percentageColumnHeader || 'Percentage', 'Amount']
    : ['Item', 'Quantity', 'Rate', 'Amount'];

  const handleColumnResizeStart = (columnIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Immediately update ref for drag disable
    isColumnResizingRef.current = true;
    setIsColumnResizing(true);
    setResizingColumn(columnIndex);
    setResizeStartX(e.clientX);
    setResizeStartWidths([...columnWidths]);
    
    // Don't remove transform - we'll account for it in calculations
    // The line item should stay visually locked in place
  };

  const handleColumnResizeMove = (e: MouseEvent) => {
    if (resizingColumn === null) return;
    
    const deltaX = e.clientX - resizeStartX;
    const newWidths = [...resizeStartWidths];
    
    // Adjust the width of the column to the left of the resize handle
    if (resizingColumn > 0) {
      newWidths[resizingColumn - 1] = Math.max(30, resizeStartWidths[resizingColumn - 1] + deltaX);
      // Adjust the column to the right to maintain total width
      if (resizingColumn < newWidths.length) {
        newWidths[resizingColumn] = Math.max(30, resizeStartWidths[resizingColumn] - deltaX);
      }
    }
    
    // Update the table visually during drag
    const table = document.querySelector('.line-item-table');
    if (table) {
      const headers = table.querySelectorAll('th');
      const cells = table.querySelectorAll('td');
      newWidths.forEach((width, index) => {
        if (headers[index]) {
          headers[index].style.width = `${width}px`;
          headers[index].style.minWidth = `${width}px`;
        }
        // Update all cells in this column
        for (let i = index; i < cells.length; i += columnWidths.length) {
          if (cells[i]) {
            cells[i].style.width = `${width}px`;
            cells[i].style.minWidth = `${width}px`;
          }
        }
      });
    }
  };

  const handleColumnResizeEnd = (e?: MouseEvent) => {
    if (resizingColumn === null) return;
    
    const currentX = e?.clientX || resizeStartX;
    const deltaX = currentX - resizeStartX;
    const newWidths = [...resizeStartWidths];
    
    if (resizingColumn > 0) {
      newWidths[resizingColumn - 1] = Math.max(30, resizeStartWidths[resizingColumn - 1] + deltaX);
      if (resizingColumn < newWidths.length) {
        newWidths[resizingColumn] = Math.max(30, resizeStartWidths[resizingColumn] - deltaX);
      }
    }
    
    updateActiveTemplate({
      lineItemArea: {
        ...activeTemplate.lineItemArea,
        columnWidths: newWidths
      }
    });
    
    // Reset column resizing state
    isColumnResizingRef.current = false;
    setResizingColumn(null);
    setIsColumnResizing(false);
  };

  useEffect(() => {
    if (resizingColumn !== null) {
      const handleMouseMove = (e: MouseEvent) => handleColumnResizeMove(e);
      const handleMouseUp = (e: MouseEvent) => handleColumnResizeEnd(e);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, resizeStartX, resizeStartWidths]);

  // Sync ref with state
  useEffect(() => {
    isColumnResizingRef.current = isColumnResizing;
  }, [isColumnResizing]);

  // Reference dimensions at 96 DPI
  const referenceWidth = activeTemplate.paperSize === 'A4' ? 794 : 816;
  const referenceHeight = activeTemplate.paperSize === 'A4' ? 1123 : 1056;

  // Calculate position percentages
  const leftPercent = (activeTemplate.lineItemArea.x / referenceWidth) * 100;
  const topPercent = (activeTemplate.lineItemArea.y / referenceHeight) * 100;
  const widthPercent = (activeTemplate.lineItemArea.width / referenceWidth) * 100;
  const heightPercent = (activeTemplate.lineItemArea.height / referenceHeight) * 100;

  return (
    <Resizable
      size={{ width: `${widthPercent}%`, height: `${heightPercent}%` }}
      onResizeStop={handleResizeStop}
      enable={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      }}
      className="absolute"
      style={{
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        ...style,
      }}
    >
      <div
        ref={setNodeRef}
        {...(selectedItemId === 'line-items-area' && !isColumnResizing ? { ...listeners, ...attributes } : {})}
        className={cn(
          "bg-accent/20 border-2 border-dashed border-secondary",
          "hover:bg-accent/30 hover:border-secondary/80 transition-colors relative",
          selectedItemId === 'line-items-area' && !isColumnResizing ? "cursor-move outline-2 outline-dashed outline-accent outline-offset-2" : "cursor-default"
        )}
        style={{ height: '100%' }}
        onClick={(e) => {
          // Prevent click from triggering on column resize handles
          const isResizeHandle = (e.target as Element).closest('.cursor-col-resize');
          if (isResizeHandle) {
            e.stopPropagation();
          }
        }}
      >
        <div className="h-full overflow-auto relative" style={{ pointerEvents: 'auto' }}>
          <table
            className="w-full border-collapse border-0 text-xs line-item-table"
            style={{
              fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial, sans-serif'
            }}
          >
            <thead>
              <tr className="bg-accent/10">
                {columnHeaders.map((header, index) => (
                  <th
                    key={index}
                    className="border border-accent/30 p-1 text-left font-medium relative group"
                    style={{
                      width: `${columnWidths[index]}px`,
                      minWidth: `${columnWidths[index]}px`,
                      fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial',
                      fontSize: `${activeTemplate.lineItemArea.fontSize || 10}px`
                    }}
                  >
                    {header}
                    {/* Column resize handle */}
                    {index < columnHeaders.length - 1 && (
                      <div
                        className="absolute top-0 right-0 w-3 h-full cursor-col-resize flex items-center justify-center"
                        style={{
                          backgroundColor: resizingColumn === index + 1 ? 'var(--accent)' : 'transparent',
                          right: '-6px',
                          zIndex: 20
                        }}
                        onMouseDown={(e) => {
                          // Prevent any drag events from being triggered
                          e.stopPropagation();
                          e.preventDefault();
                          handleColumnResizeStart(index + 1, e);
                        }}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag left or right to resize column"
                      >
                        <div className="flex flex-col items-center">
                          <ArrowLeft className="h-2 w-2 text-black" />
                          <ArrowRight className="h-2 w-2 text-black" />
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-accent/5">
                {columnWidths.map((width, index) => (
                  <td
                    key={index}
                    className="border border-accent/30 p-1 text-accent-foreground/60"
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial',
                      fontSize: `${activeTemplate.lineItemArea.fontSize || 10}px`
                    }}
                  >
                    {index === 0 ? 'Sample Item 1' :
                     index === 1 ? '1' :
                     index === 2 ? '$100.00' :
                     (activeTemplate.hasPercentageColumn && index === 3) ? '$10.00' :
                     (!activeTemplate.hasPercentageColumn && index === 3) ? '$110.00' :
                     '$110.00'}
                  </td>
                ))}
              </tr>
              <tr>
                {columnWidths.map((width, index) => (
                  <td
                    key={index}
                    className="border border-accent/30 p-1 text-accent-foreground/60"
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial',
                      fontSize: `${activeTemplate.lineItemArea.fontSize || 10}px`
                    }}
                  >
                    {index === 0 ? 'Sample Item 2' :
                     index === 1 ? '2' :
                     index === 2 ? '$50.00' :
                     (activeTemplate.hasPercentageColumn && index === 3) ? '$10.00' :
                     (!activeTemplate.hasPercentageColumn && index === 3) ? '$100.00' :
                     '$100.00'}
                  </td>
                ))}
              </tr>
              <tr className="bg-accent/5">
                <td
                  className="border border-accent/30 p-1 text-accent-foreground/60"
                  colSpan={columnHeaders.length}
                  style={{
                    textAlign: 'center',
                    fontFamily: activeTemplate.lineItemArea.fontFamily || 'Arial',
                    fontSize: `${activeTemplate.lineItemArea.fontSize || 10}px`
                  }}
                >
                  Additional line items will appear here
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Resizable>
  );
}

export function Canvas() {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const setSelectedItemId = useTemplateStore((state) => state.setSelectedItemId);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const updateSize = () => {
      const { clientWidth, clientHeight } = element;
      setCanvasSize({ width: clientWidth, height: clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!activeTemplate) {
    return null;
  }

  // Reference dimensions at 96 DPI
  const referenceWidth = activeTemplate.paperSize === 'A4' ? 794 : 816;
  const referenceHeight = activeTemplate.paperSize === 'A4' ? 1123 : 1056;

  // Scaling factors based on actual canvas size
  const scaleX = canvasSize.width > 0 ? canvasSize.width / referenceWidth : 1;
  const scaleY = canvasSize.height > 0 ? canvasSize.height / referenceHeight : 1;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get click position relative to canvas
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;
    
    // Collect all elements at this position
    const elementsAtPoint: Array<{id: string, area: number}> = [];
    
    // Check images
    activeTemplate.images.forEach(image => {
      const scaledX = image.x * scaleX;
      const scaledY = image.y * scaleY;
      const scaledWidth = image.currentWidth * scaleX;
      const scaledHeight = image.currentHeight * scaleY;
      
      if (clickX >= scaledX && clickX <= scaledX + scaledWidth &&
          clickY >= scaledY && clickY <= scaledY + scaledHeight) {
        const area = scaledWidth * scaledHeight;
        elementsAtPoint.push({ id: image.id, area });
      }
    });
    
    // Check labels
    activeTemplate.labels.forEach(label => {
      const scaledX = label.x * scaleX;
      const scaledY = label.y * scaleY;
      const labelWidth = label.width || 200;
      const labelHeight = label.height || 30;
      const scaledWidth = labelWidth * scaleX;
      const scaledHeight = labelHeight * scaleY;
      
      if (clickX >= scaledX && clickX <= scaledX + scaledWidth &&
          clickY >= scaledY && clickY <= scaledY + scaledHeight) {
        const area = scaledWidth * scaledHeight;
        elementsAtPoint.push({ id: label.id, area });
      }
    });
    
    // Check line item area
    const lineItemX = activeTemplate.lineItemArea.x * scaleX;
    const lineItemY = activeTemplate.lineItemArea.y * scaleY;
    const lineItemWidth = activeTemplate.lineItemArea.width * scaleX;
    const lineItemHeight = activeTemplate.lineItemArea.height * scaleY;
    
    if (clickX >= lineItemX && clickX <= lineItemX + lineItemWidth &&
        clickY >= lineItemY && clickY <= lineItemY + lineItemHeight) {
      const area = lineItemWidth * lineItemHeight;
      elementsAtPoint.push({ id: 'line-items-area', area });
    }
    
    // Select the element with smallest area
    if (elementsAtPoint.length > 0) {
      const smallestElement = elementsAtPoint.reduce((prev, curr) =>
        prev.area < curr.area ? prev : curr
      );
      setSelectedItemId(smallestElement.id);
    } else {
      // Clicked on empty canvas, unselect
      setSelectedItemId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const itemId = active.id as string;

    // Scale delta from screen pixels to reference pixels
    const scaledDelta = {
      x: scaleX > 0 ? delta.x / scaleX : delta.x,
      y: scaleY > 0 ? delta.y / scaleY : delta.y,
    };

    // Canvas dimensions at 96 DPI (reference)
    const canvasWidth = referenceWidth;
    const canvasHeight = referenceHeight;

    // Check if it's the line item area
    if (itemId === 'line-items-area') {
      const newX = Math.max(0, Math.min(canvasWidth - activeTemplate.lineItemArea.width, activeTemplate.lineItemArea.x + scaledDelta.x));
      const newY = Math.max(0, Math.min(canvasHeight - activeTemplate.lineItemArea.height, activeTemplate.lineItemArea.y + scaledDelta.y));
      updateActiveTemplate({
        lineItemArea: { ...activeTemplate.lineItemArea, x: newX, y: newY }
      });
      return;
    }

    // Images are not draggable - skip image dragging logic
    const isImage = activeTemplate.images.some(img => img.id === itemId);
    if (isImage) {
      // Images are fixed in position - do not update their coordinates
      return;
    }

    // Only labels are draggable
    const updatedLabels = activeTemplate.labels.map(label => {
        if (label.id === itemId) {
            // Get label dimensions
            const labelWidth = label.width || 200;
            const labelHeight = label.height || 30;
            
            // Calculate new position with bounds checking
            let newX = label.x + scaledDelta.x;
            let newY = label.y + scaledDelta.y;
            
            // Ensure label stays within canvas bounds
            newX = Math.max(0, Math.min(canvasWidth - labelWidth, newX));
            newY = Math.max(0, Math.min(canvasHeight - labelHeight, newY));
            
            return { ...label, x: newX, y: newY };
        }
        return label;
    });
    updateActiveTemplate({ labels: updatedLabels });
  };

  const paper = PAPER_SIZES[activeTemplate.paperSize];
  const containerStyle: React.CSSProperties = {
    aspectRatio: paper.aspectRatio,
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-4xl mx-auto p-4 bg-muted rounded-lg">
        <div
          ref={canvasRef}
          style={containerStyle}
          className="bg-card text-card-foreground shadow-lg relative mx-auto overflow-hidden"
          onClick={handleCanvasClick}
          data-testid="template-canvas"
        >
          {/* Render Draggable Images */}
          {activeTemplate.images.map(image => {
            const scaledImage = {
              ...image,
              currentWidth: image.currentWidth * scaleX,
              currentHeight: image.currentHeight * scaleY,
            };
            return (
              <div
                key={image.id}
                style={{
                  position: 'absolute',
                  top: image.y * scaleY,
                  left: image.x * scaleX,
                  width: scaledImage.currentWidth,
                  height: scaledImage.currentHeight,
                }}
              >
                <DraggableImage
                  image={scaledImage}
                  isSelected={selectedItemId === image.id}
                />
              </div>
            );
          })}

          {/* Render Draggable Labels */}
          {activeTemplate.labels.map(label => {
            const scaledLabel = {
              ...label,
              width: label.width ? label.width * scaleX : undefined,
              height: label.height ? label.height * scaleY : undefined,
            };
            
            // Special handling for totals block
            if (label.id === 'totals-block') {
              return (
                <div
                  key={label.id}
                  style={{
                    position: 'absolute',
                    top: label.y * scaleY,
                    left: label.x * scaleX,
                    width: scaledLabel.width,
                    height: scaledLabel.height,
                  }}
                >
                  <TotalsBlock
                    label={scaledLabel}
                    isSelected={selectedItemId === label.id}
                  />
                </div>
              );
            }
            
            return (
              <div
                key={label.id}
                style={{
                  position: 'absolute',
                  top: label.y * scaleY,
                  left: label.x * scaleX,
                  width: scaledLabel.width,
                  height: scaledLabel.height,
                }}
              >
                <DraggableLabel
                  label={scaledLabel}
                  isSelected={selectedItemId === label.id}
                />
              </div>
            );
          })}

          {/* Interactive Line Item Area */}
          <DraggableLineItemArea scaleX={scaleX} scaleY={scaleY} />

        </div>
      </div>
    </DndContext>
  );
}
