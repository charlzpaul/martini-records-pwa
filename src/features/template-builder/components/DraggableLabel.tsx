// src/features/template-builder/components/DraggableLabel.tsx
import { useDraggable } from '@dnd-kit/core';
import type { CanvasLabel } from '@/db/models';
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';

interface DraggableLabelProps {
  label: CanvasLabel;
  isSelected: boolean;
}

export function DraggableLabel({ label, isSelected }: DraggableLabelProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: label.id,
  });
  
  const { setSelectedItemId } = useTemplateStore(state => ({
    setSelectedItemId: state.setSelectedItemId,
  }));

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute cursor-grab active:cursor-grabbing p-1 border-2 border-transparent",
        isSelected && "border-accent border-dashed"
      )}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItemId(label.id);
      }}
    >
      <span style={{ fontSize: label.fontSize }}>{label.textValue}</span>
    </div>
  );
}
