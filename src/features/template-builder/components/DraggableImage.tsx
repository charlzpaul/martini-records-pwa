// src/features/template-builder/components/DraggableImage.tsx
import { useDraggable } from '@dnd-kit/core';
import type { CanvasImage } from '@/db/models';
import { cn } from '@/lib/utils';

interface DraggableImageProps {
  image: CanvasImage;
  isSelected: boolean;
}

export function DraggableImage({ image, isSelected }: DraggableImageProps) {
  const { setNodeRef } = useDraggable({
    id: image.id,
    disabled: true, // Dragging disabled for images
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute cursor-default`}
    >
      <div
        className={cn(
            "relative",
            isSelected && "outline-2 outline-blue-500 outline-dashed"
        )}
        style={{
          width: image.currentWidth,
          height: image.currentHeight,
        }}
      >
        <div className="w-full h-full">
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
      </div>
    </div>
  );
}
