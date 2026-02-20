// src/features/template-builder/components/Canvas.tsx
import { useTemplateStore } from '../store/useTemplateStore';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { DraggableImage } from './DraggableImage';
import { DraggableLabel } from './DraggableLabel';

const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', aspectRatio: '210/297' },
  Letter: { width: '8.5in', height: '11in', aspectRatio: '8.5/11' },
};

export function Canvas() {
  const { 
    activeTemplate, 
    updateActiveTemplate,
    selectedItemId,
    setSelectedItemId,
  } = useTemplateStore((state) => ({
    activeTemplate: state.activeTemplate,
    updateActiveTemplate: state.updateActiveTemplate,
    selectedItemId: state.selectedItemId,
    setSelectedItemId: state.setSelectedItemId,
  }));

  if (!activeTemplate) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const itemId = active.id as string;

    const isImage = activeTemplate.images.some(img => img.id === itemId);

    if (isImage) {
        const updatedImages = activeTemplate.images.map(image => {
          if (image.id === itemId) {
            return { ...image, x: image.x + delta.x, y: image.y + delta.y };
          }
          return image;
        });
        updateActiveTemplate({ images: updatedImages });
    } else {
        const updatedLabels = activeTemplate.labels.map(label => {
            if (label.id === itemId) {
                return { ...label, x: label.x + delta.x, y: label.y + delta.y };
            }
            return label;
        });
        updateActiveTemplate({ labels: updatedLabels });
    }
  };

  const paper = PAPER_SIZES[activeTemplate.paperSize];
  const containerStyle: React.CSSProperties = {
    aspectRatio: paper.aspectRatio,
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-4xl mx-auto p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
        <div 
          style={containerStyle}
          className="bg-white shadow-lg relative mx-auto overflow-hidden"
          onClick={() => setSelectedItemId(null)} // Unselect when clicking canvas
        >
          {/* Render Draggable Images */}
          {activeTemplate.images.map(image => (
            <div key={image.id} style={{ position: 'absolute', top: image.y, left: image.x }}>
               <DraggableImage 
                image={image}
                isSelected={selectedItemId === image.id}
               />
            </div>
          ))}

          {/* Render Draggable Labels */}
          {activeTemplate.labels.map(label => (
             <div key={label.id} style={{ position: 'absolute', top: label.y, left: label.x }}>
               <DraggableLabel 
                label={label}
                isSelected={selectedItemId === label.id}
               />
            </div>
          ))}

          {/* Visualize Line Item Area */}
          <div 
            className="absolute bg-blue-100/50 border-2 border-dashed border-blue-400 pointer-events-none"
            style={{
              top: `${(activeTemplate.lineItemArea.y / 1123) * 100}%`,
              height: `${(activeTemplate.lineItemArea.height / 1123) * 100}%`,
              left: '5%',
              right: '5%',
            }}
          >
            <p className="text-center text-blue-500 p-2 text-sm">Line Item Area</p>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
