// src/features/template-builder/components/LayerList.tsx
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';
import { Image, Type } from 'lucide-react';

export function LayerList() {
  const { activeTemplate, selectedItemId, setSelectedItemId } = useTemplateStore(state => ({
    activeTemplate: state.activeTemplate,
    selectedItemId: state.selectedItemId,
    setSelectedItemId: state.setSelectedItemId,
  }));

  if (!activeTemplate) return null;

  // Combine images and labels into a single list for rendering
  const layers = [
    ...activeTemplate.images.map(img => ({ ...img, itemType: 'Image' })),
    ...activeTemplate.labels.map(lbl => ({ ...lbl, itemType: 'Label' })),
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Layers</h3>
      <div className="space-y-1 rounded-md border p-2">
        {layers.map(layer => (
          <div
            key={layer.id}
            onClick={() => setSelectedItemId(layer.id)}
            className={cn(
              "flex items-center space-x-2 rounded-md p-2 text-sm cursor-pointer hover:bg-accent",
              layer.id === selectedItemId && "bg-accent font-semibold"
            )}
          >
            {layer.itemType === 'Image' ? 
              <Image className="h-4 w-4" /> : 
              <Type className="h-4 w-4" />
            }
            <span className="truncate">
              {layer.itemType === 'Image' ? `Image: ${layer.id.substring(0, 6)}` : (layer as any).textValue}
            </span>
          </div>
        ))}
        {layers.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No layers yet.</p>
        )}
      </div>
    </div>
  );
}
