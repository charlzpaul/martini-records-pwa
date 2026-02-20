// src/features/template-builder/components/DraggableImage.tsx
import { useDraggable } from '@dnd-kit/core';
import { Resizable, type ResizeCallback, type NumberSize } from 're-resizable';
import type { CanvasImage } from '@/db/models';
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';

interface DraggableImageProps {
  image: CanvasImage;
  isSelected: boolean;
}

export function DraggableImage({ image, isSelected }: DraggableImageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: image.id,
  });

  const { setSelectedItemId, updateActiveTemplate, activeTemplate } = useTemplateStore(state => ({
      setSelectedItemId: state.setSelectedItemId,
      updateActiveTemplate: state.updateActiveTemplate,
      activeTemplate: state.activeTemplate,
  }));

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleResizeStop: ResizeCallback = (e, direction, ref, d) => {
    if (!activeTemplate) return;

    const newWidth = image.currentWidth + d.width;
    const newHeight = image.currentHeight + d.height;

    const updatedImages = activeTemplate.images.map(img => 
      img.id === image.id ? { ...img, currentWidth: newWidth, currentHeight: newHeight } : img
    );
    updateActiveTemplate({ images: updatedImages });
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="absolute"
      onClick={(e) => {
        e.stopPropagation(); // Prevent canvas click from unselecting
        setSelectedItemId(image.id);
      }}
    >
      <Resizable
        size={{ width: image.currentWidth, height: image.currentHeight }}
        onResizeStop={handleResizeStop}
        lockAspectRatio
        className={cn(
            "relative border-2 border-transparent",
            isSelected && "border-blue-500 border-dashed"
        )}
      >
        <div {...listeners} {...attributes} className="w-full h-full cursor-grab active:cursor-grabbing">
            <img
                src={image.base64Data}
                alt="template element"
                style={{
                    width: '100%',
                    height: '100%',
                    opacity: image.opacity,
                }}
                className="pointer-events-none" 
            />
        </div>
      </Resizable>
    </div>
  );
}
