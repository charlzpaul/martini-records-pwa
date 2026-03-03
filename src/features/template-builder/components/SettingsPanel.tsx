// src/features/template-builder/components/SettingsPanel.tsx
import { useMemo, useRef, useState } from 'react';
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
import { ChevronDown, User, Calendar, FileText } from 'lucide-react';

export function SettingsPanel() {
  const {
    activeTemplate,
    updateActiveTemplate,
    selectedItemId,
    setSelectedItemId,
  } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const selectedItem = useMemo(() => {
    if (!activeTemplate || !selectedItemId) return null;
    const image = activeTemplate.images.find(img => img.id === selectedItemId);
    if (image) return { type: 'image', data: image };
    const label = activeTemplate.labels.find(lbl => lbl.id === selectedItemId);
    if (label) return { type: 'label', data: label };
    return null;
  }, [activeTemplate, selectedItemId]);

  if (!activeTemplate) return null;


  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const [showBlockOptions, setShowBlockOptions] = useState(false);

  const handleAddDefaultBlock = (blockType: string) => {
    if (!activeTemplate) return;
    
    // Check if a layer of this type already exists
    const existingLayers = activeTemplate.labels.filter(label =>
      label.id.includes(blockType) ||
      (blockType === 'customer-info' && label.id.includes('customer-info')) ||
      (blockType === 'date-block' && label.id.includes('date-block')) ||
      (blockType === 'invoice-number' && label.id.includes('invoice-number')) ||
      (blockType === 'totals-block' && label.id.includes('totals-block'))
    );
    
    // Calculate Y position: get max Y from existing labels or use 100 as default
    const labelYs = activeTemplate.labels.map(l => l.y);
    const maxY = labelYs.length > 0 ? Math.max(...labelYs) : 100;
    
    let newLabel: CanvasLabel;
    
    if (existingLayers.length > 0) {
      // Create a duplicate of the first existing layer with same properties
      const existingLayer = existingLayers[0];
      newLabel = {
        ...existingLayer,
        id: `${blockType}-duplicate-${Date.now()}`,
        // Offset position slightly so duplicate is visible but looks the same
        x: existingLayer.x + 20,
        y: existingLayer.y + 20,
      };
    } else {
      // Create a new layer with default values
      const newId = `default-${blockType}-${Date.now()}`;
      
      switch (blockType) {
        case 'customer-info':
          newLabel = {
            id: newId,
            type: 'Custom',
            textValue: 'John Doe\n123 Main St, City, State 12345\nPhone: (555) 123-4567\nTax ID: 123-45-6789',
            isVisible: true,
            x: 50,
            y: maxY + 40,
            fontSize: 12,
            fontFamily: 'Arial',
            width: 200,
            height: 80,
          };
          break;
        case 'date-block':
          newLabel = {
            id: newId,
            type: 'Custom',
            textValue: 'January 1, 2023',
            isVisible: true,
            x: 50,
            y: maxY + 40,
            fontSize: 14,
            fontFamily: 'Arial',
            width: 200,
            height: 30,
          };
          break;
        case 'invoice-number':
          newLabel = {
            id: newId,
            type: 'Custom',
            textValue: 'INV-2023-001',
            isVisible: true,
            x: 50,
            y: maxY + 40,
            fontSize: 14,
            fontFamily: 'Arial',
            width: 200,
            height: 30,
          };
          break;
        case 'totals-block':
          newLabel = {
            id: newId,
            type: 'Custom',
            textValue: 'Subtotal: $0.00\nTax 1 (10%): $0.00\nTax 2 (5%): $0.00\nTotal: $0.00',
            isVisible: true,
            x: 550,
            y: 900,
            fontSize: 12,
            fontFamily: 'Arial',
            width: 200,
            height: 100,
          };
          // For totals block, also ensure default grouped layers exist
          if (!activeTemplate.totalsBlockGroupedLayers || activeTemplate.totalsBlockGroupedLayers.length === 0) {
            updateActiveTemplate({
              totalsBlockGroupedLayers: [
                {
                  id: 'subtotal-layer',
                  name: 'Subtotal',
                  type: 'percentage' as const,
                  percentage: 0,
                  value: 0,
                  isVisible: true,
                  isUndeletable: true,
                },
                {
                  id: 'adjustment-1',
                  name: 'Adjustment',
                  type: 'percentage' as const,
                  percentage: 10,
                  value: 0,
                  isVisible: true,
                  isUndeletable: false,
                },
                {
                  id: 'grand-total-layer',
                  name: 'Grand Total',
                  type: 'percentage' as const,
                  percentage: 0,
                  value: 0,
                  isVisible: true,
                  isUndeletable: true,
                }
              ]
            });
          }
          break;
        case 'line-items-area':
          // Ensure line items area exists with default values
          updateActiveTemplate({
            lineItemArea: {
              x: 40,
              y: 250,
              width: 714,
              height: 400,
              columnWidths: [200, 80, 80, 100] // Default widths for Item, Quantity, Rate, Amount columns
            }
          });
          setShowBlockOptions(false);
          toast.success('Added line items area with default properties');
          return;
        default:
          return;
      }
    }
    
    const updatedLabels = [...activeTemplate.labels, newLabel];
    updateActiveTemplate({ labels: updatedLabels });
    setSelectedItemId(newLabel.id);
    setShowBlockOptions(false);
    
    if (existingLayers.length > 0) {
      toast.success(`Added duplicate ${blockType.replace('-', ' ')} block with same font and properties`);
    } else {
      toast.success(`Added ${blockType.replace('-', ' ')} block`);
    }
  };

  // Function to resize an image for PDF generation with high quality for printing
  const resizeAndCompressImage = (
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    callback: (compressedBase64: string) => void
  ) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(img.src); // Fallback to original if canvas not supported
      return;
    }
    
    // Use high-quality image rendering settings for printing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw image onto canvas with the target dimensions
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    // Convert to base64 with high quality for printing
    // Use original image format to preserve quality (JPEG for photos, PNG for graphics)
    // For printing, use higher quality (0.95) to maintain good print quality
    const quality = 0.95; // 95% quality for printing
    // Check if the original image source is PNG (contains 'png' in data URL)
    const isPng = img.src.toLowerCase().includes('png');
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const compressedBase64 = canvas.toDataURL(mimeType, quality);
    
    callback(compressedBase64);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if activeTemplate exists
    if (!activeTemplate) {
      toast.error('Cannot add image: No active template');
      return;
    }

    // Validate file type - only accept images, not PDF
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG only)');
      return;
    }

    // Validate file size (optional, limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Please select a file smaller than 5MB');
      return;
    }

    // Capture current activeTemplate for use in async callbacks
    const currentActiveTemplate = activeTemplate;
    const currentUpdateActiveTemplate = updateActiveTemplate;
    const currentSetSelectedItemId = setSelectedItemId;
    const fileName = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      
      // Create a new image element to get dimensions
      const img = new Image();
      img.onload = () => {
        // Canvas dimensions based on selected paper size at 96 DPI
        // A4: 210mm x 297mm = 8.27in x 11.69in ≈ 794px x 1123px at 96 DPI
        // Letter: 8.5in x 11in = 816px x 1056px at 96 DPI
        const canvasDimensions = {
          A4: { width: 794, height: 1123 },
          Letter: { width: 816, height: 1056 }
        };
        
        const paperSize = currentActiveTemplate.paperSize;
        const canvasWidth = canvasDimensions[paperSize].width;
        const canvasHeight = canvasDimensions[paperSize].height;
        
        // Ensure image has valid dimensions
        if (img.width <= 0 || img.height <= 0) {
          toast.error('Invalid image dimensions');
          return;
        }
        
        // Calculate scale to make image fit within canvas while maintaining aspect ratio
        // Use "cover" mode to fill the canvas when aspect ratio is close, otherwise "contain"
        const widthRatio = canvasWidth / img.width;
        const heightRatio = canvasHeight / img.height;
        const aspectRatioDiff = Math.abs(widthRatio - heightRatio);
        // If aspect ratio difference is less than 1%, use "cover" to fill canvas, otherwise "contain"
        const scale = aspectRatioDiff < 0.01 ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);
        
        // Ensure minimum size of 50px
        const minSize = 50;
        // Use Math.round instead of Math.floor to avoid truncation errors
        let width = Math.max(Math.round(img.width * scale), minSize);
        let height = Math.max(Math.round(img.height * scale), minSize);
        
        // Position image: if aspect ratio is close (cover mode), center it; otherwise top-right with margin
        const margin = 20;
        let x, y;
        if (aspectRatioDiff < 0.01) {
          // Cover mode: center the image and ensure it fills the canvas
          // When aspect ratio matches closely, use canvas dimensions directly to ensure full coverage
          width = Math.max(width, canvasWidth);
          height = Math.max(height, canvasHeight);
          x = (canvasWidth - width) / 2;
          y = (canvasHeight - height) / 2;
        } else {
          // Contain mode: top-right corner with margin
          x = canvasWidth - width - margin;
          y = margin;
        }
        
        // Clamp x and y to ensure image is fully inside canvas bounds
        x = Math.max(0, Math.min(x, canvasWidth - width));
        y = Math.max(0, Math.min(y, canvasHeight - height));
        
        // Increase resolution for high-quality printing (3x multiplier = ~288 DPI)
        const PRINT_QUALITY_MULTIPLIER = 3;
        const storageWidth = width * PRINT_QUALITY_MULTIPLIER;
        const storageHeight = height * PRINT_QUALITY_MULTIPLIER;
        
        // Resize and compress the image to the actual storage size (higher than display size for print quality)
        resizeAndCompressImage(img, storageWidth, storageHeight, (compressedBase64) => {
          const newImage = {
            id: `image-${Date.now()}`,
            base64Data: compressedBase64,
            originalWidth: img.width,
            originalHeight: img.height,
            currentWidth: width,
            currentHeight: height,
            x: x,
            y: y,
            opacity: 1,
            fileName: fileName,
          };

          // Add the new image to the template
          const updatedImages = [...currentActiveTemplate.images, newImage];
          currentUpdateActiveTemplate({ images: updatedImages });
          
          // Select the new image
          currentSetSelectedItemId(newImage.id);
          
          toast.success('Image added successfully with high quality for printing');
        });
      };
      
      img.onerror = () => {
        toast.error('Failed to load image. The file may be corrupted or not a valid image.');
      };
      
      img.src = base64Data;
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  };
  
  const handleOpacityChange = (value: number[]) => {
      if(selectedItem?.type !== 'image') return;
      const updatedImages = activeTemplate.images.map(img =>
        img.id === selectedItem.data.id ? { ...img, opacity: value[0] } : img
      );
      updateActiveTemplate({ images: updatedImages });
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

    // Don't show Selected Label section - all label editing is handled in LayerList
    return null;
  }

  return (
    <div className="flex flex-col h-full p-4 border rounded-lg" data-testid="settings-panel">
      <div className="space-y-6 flex-grow overflow-y-auto">
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
            Add Background Layer
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
          />
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowBlockOptions(!showBlockOptions)}
              className="w-full flex items-center justify-center relative"
            >
              <span>Add Default Layer</span>
              <ChevronDown className={`h-4 w-4 absolute right-3 transition-transform ${showBlockOptions ? 'rotate-180' : ''}`} />
            </Button>
            
            {showBlockOptions && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleAddDefaultBlock('customer-info')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Customer Info</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('date-block')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('invoice-number')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Record Number</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <LayerList />

        {renderSelectedItemSettings() && <div className="pt-4 border-t">{renderSelectedItemSettings()}</div>}
      </div>

    </div>
  );
}
