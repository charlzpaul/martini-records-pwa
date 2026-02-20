// src/features/template-builder/components/SettingsPanel.tsx
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore } from '../store/useTemplateStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { CanvasImage, CanvasLabel } from '@/db/models';
import { LayerList } from './LayerList';

export function SettingsPanel() {
  const { 
    activeTemplate, 
    updateActiveTemplate, 
    saveTemplate,
    saveAsCopy,
    selectedItemId,
  } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const selectedItem = useMemo(() => {
    if (!activeTemplate || !selectedItemId) return null;
    const image = activeTemplate.images.find(img => img.id === selectedItemId);
    if (image) return { type: 'image', data: image };
    const label = activeTemplate.labels.find(lbl => lbl.id === selectedItemId);
    if (label) return { type: 'label', data: label };
    return null;
  }, [activeTemplate, selectedItemId]);

  if (!activeTemplate) return null;

  const handleSave = async () => {
    toast.promise(saveTemplate, {
      loading: 'Saving template...',
      success: (savedTemplate) => {
        if (activeTemplate.id === 'new' && savedTemplate?.id) {
          navigate(`/template/${savedTemplate.id}`, { replace: true });
        }
        return `Template "${savedTemplate?.name}" saved successfully!`;
      },
      error: 'Failed to save template.',
    });
  };

  const handleSaveAsCopy = async () => {
    toast.promise(saveAsCopy, {
      loading: 'Saving a copy...',
      success: (savedTemplate) => {
        navigate(`/template/${savedTemplate.id}`);
        return `Template copy "${savedTemplate?.name}" created successfully!`;
      },
      error: 'Failed to save copy.',
    });
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleOpacityChange = (value: number[]) => {
      if(selectedItem?.type !== 'image') return;
      const updatedImages = activeTemplate.images.map(img => 
        img.id === selectedItem.data.id ? { ...img, opacity: value[0] } : img
      );
      updateActiveTemplate({ images: updatedImages });
  };

  const handleLabelTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(selectedItem?.type !== 'label') return;
    const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === selectedItem.data.id ? { ...lbl, textValue: e.target.value } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
  };

  const handleFontSizeChange = (value: number[]) => {
    if(selectedItem?.type !== 'label') return;
    const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === selectedItem.data.id ? { ...lbl, fontSize: value[0] } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
  };

  const renderSelectedItemSettings = () => {
    if (!selectedItem) return null;

    if (selectedItem.type === 'image') {
      const image = selectedItem.data as CanvasImage;
      return (
        <div className="space-y-4">
            <h3 className="font-semibold">Selected Image</h3>
             <div className="space-y-2">
                <Label htmlFor="opacity-slider">Opacity</Label>
                <Slider
                    id="opacity-slider"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[image.opacity]}
                    onValueChange={handleOpacityChange}
                />
            </div>
        </div>
      );
    }

    if (selectedItem.type === 'label') {
        const label = selectedItem.data as CanvasLabel;
        return (
             <div className="space-y-4">
                <h3 className="font-semibold">Selected Label</h3>
                <div className="space-y-2">
                    <Label htmlFor="label-text">Text</Label>
                    <Input id="label-text" value={label.textValue} onChange={handleLabelTextChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="font-size-slider">Font Size</Label>
                    <Slider
                        id="font-size-slider"
                        min={8}
                        max={72}
                        step={1}
                        value={[label.fontSize]}
                        onValueChange={handleFontSizeChange}
                    />
                </div>
            </div>
        )
    }

    return null;
  }

  return (
    <div className="p-4 border rounded-lg space-y-8">
      <div className="space-y-4">
        <h3 className="font-semibold">Template Settings</h3>
        <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
            id="template-name"
            value={activeTemplate.name}
            onChange={(e) => updateActiveTemplate({ name: e.target.value })}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="paper-size">Paper Size</Label>
            <Select
            value={activeTemplate.paperSize}
            onValueChange={(value: 'A4' | 'Letter') => updateActiveTemplate({ paperSize: value })}
            >
            <SelectTrigger id="paper-size">
                <SelectValue placeholder="Select paper size" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Button variant="outline" onClick={handleAddImageClick} className="w-full">
          Add Image
        </Button>
        {/* Add Label Button Here Later */}
      </div>

      <LayerList />

      {renderSelectedItemSettings() && <div className="pt-4 border-t">{renderSelectedItemSettings()}</div>}

      <div className="space-y-2 pt-4 border-t">
        <Button onClick={() => alert("Preview functionality coming soon!")} variant="outline" className="w-full">Preview</Button>
        <Button onClick={handleSaveAsCopy} variant="secondary" className="w-full">Save as Copy</Button>
        <Button onClick={handleSave} className="w-full">Save Changes</Button>
      </div>
    </div>
  );
}
