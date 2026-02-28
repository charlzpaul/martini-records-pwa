// src/features/template-builder/store/useTemplateStore.ts
import { create } from 'zustand';
import type { Template } from '@/db/models';
import * as dbApi from '@/db/api';
import { notifyDataChange } from '@/features/sync/hooks/useDataSync';

interface TemplateState {
  // The original template, as it exists in the database.
  originalTemplate: Template | null;
  // The working copy of the template that the user is editing.
  activeTemplate: Template | null;
  // ID of the currently selected canvas item (image or label).
  selectedItemId: string | null;
  
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  // --- Actions ---
  loadTemplate: (id: string) => Promise<void>;
  createNewTemplate: () => void;
  updateActiveTemplate: (data: Partial<Template>) => void;
  saveTemplate: () => Promise<any>;
  saveAsCopy: () => Promise<any>;
  setSelectedItemId: (id: string | null) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  originalTemplate: null,
  activeTemplate: null,
  selectedItemId: null,
  loading: false,
  error: null,
  isDirty: false,

  loadTemplate: async (id: string) => {
    set({ loading: true, error: null, originalTemplate: null, activeTemplate: null, selectedItemId: null, isDirty: false });
    try {
      const template = await dbApi.getTemplateById(id);
      if (template) {
        // Ensure backward compatibility: handle renamed fields and set defaults for missing fields
        const templateWithDefaults = {
          ...template,
          // Handle backward compatibility for percentage column fields
          hasPercentageColumn: template.hasPercentageColumn ?? false,
          percentageColumnHeader: template.percentageColumnHeader ?? 'Percentage',
          percentageColumnValue: template.percentageColumnValue ?? 10, // Default to 10%
          // Handle backward compatibility: set default totals block grouped layers if not present
          totalsBlockGroupedLayers: template.totalsBlockGroupedLayers ?? [
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
          ],
        };
        
        // If template has percentage column but doesn't have the corresponding totals block grouped layer, add it
        if (templateWithDefaults.hasPercentageColumn) {
          const hasPercentageTotalsLayer = templateWithDefaults.totalsBlockGroupedLayers?.some(
            layer => layer.id === 'percentage-column-totals-layer'
          );
          
          if (!hasPercentageTotalsLayer) {
            const percentageTotalsLayer = {
              id: 'percentage-column-totals-layer',
              name: templateWithDefaults.percentageColumnHeader || 'Percentage',
              type: 'percentage' as const,
              percentage: templateWithDefaults.percentageColumnValue || 10,
              value: 0,
              isVisible: true,
              isUndeletable: true,
            };
            
            templateWithDefaults.totalsBlockGroupedLayers = [
              ...(templateWithDefaults.totalsBlockGroupedLayers || []),
              percentageTotalsLayer
            ];
          }
        }
        
        set({
          originalTemplate: templateWithDefaults,
          activeTemplate: structuredClone(templateWithDefaults),
          loading: false,
          isDirty: false,
        });
      } else {
        throw new Error(`Template with id "${id}" not found.`);
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  createNewTemplate: () => {
    const now = new Date().toISOString();
    const newTemplate: Template = {
      id: 'new', // Temporary ID
      name: 'Untitled Template',
      paperSize: 'A4',
      images: [],
      labels: [
        {
          id: 'invoice-number',
          type: 'Custom',
          textValue: 'INV-2023-001',
          isVisible: true,
          x: 50,
          y: 100,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 30,
        },
        {
          id: 'date-block',
          type: 'Custom',
          textValue: 'January 1, 2023',
          isVisible: true,
          x: 50,
          y: 130,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 30,
        },
        {
          id: 'customer-info',
          type: 'Custom',
          textValue: 'John Doe\n123 Main St, City, State 12345\nPhone: (555) 123-4567\nTax ID: 123-45-6789',
          isVisible: true,
          x: 50,
          y: 170,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 80,
        },
        {
          id: 'totals-block',
          type: 'Custom',
          textValue: 'Subtotal: $0.00\nTax 1 (10%): $0.00\nTax 2 (5%): $0.00\nTotal: $0.00',
          isVisible: true,
          x: 550,
          y: 900,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 100,
        }
      ],
      lineItemArea: {
        x: 40,
        y: 250,
        width: 714,
        height: 400,
        columnWidths: [200, 80, 80, 100], // Default widths for Item, Quantity, Rate, Amount columns (percentage column not included by default)
        fontSize: 10 // Default font size for line items
      },
      hasPercentageColumn: false, // Percentage column is not shown by default
      percentageColumnHeader: 'Percentage', // Default header name for percentage column
      percentageColumnValue: 10, // Default percentage value (10%)
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
      ],
      createdAt: now,
      updatedAt: now,
    };
    set({
      originalTemplate: null, // No original, it's new
      activeTemplate: newTemplate,
      loading: false,
      error: null,
      isDirty: false,
    });
  },

  updateActiveTemplate: (data: Partial<Template>) => {
    set((state) => {
      if (!state.activeTemplate) {
        return { activeTemplate: null };
      }
      const newTemplate = { ...state.activeTemplate, ...data, updatedAt: new Date().toISOString() };
      const isDirty = state.originalTemplate
        ? JSON.stringify(state.originalTemplate) !== JSON.stringify(newTemplate)
        : true; // If there's no original (new template), any change makes it dirty
      return {
        activeTemplate: newTemplate,
        isDirty,
      };
    });
  },

  saveTemplate: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const isNew = activeTemplate.id === 'new';
      const payload = { ...activeTemplate };
      if (isNew) {
        const { id: _id, ...rest } = payload;
        const savedTemplate = await dbApi.saveTemplate(rest);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
        notifyDataChange();
        return savedTemplate;
      } else {
        const savedTemplate = await dbApi.saveTemplate(payload);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
        notifyDataChange();
        return savedTemplate;
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save template.' });
      throw err;
    }
  },

  saveAsCopy: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const { id: _id, ...rest } = activeTemplate;
      const newName = `${rest.name} (Copy)`;
      const savedTemplate = await dbApi.saveTemplate({ ...rest, name: newName });
      set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
      notifyDataChange();
      return savedTemplate;
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save copy.' });
      throw err;
    }
  },

  setSelectedItemId: (id: string | null) => {
    set({ selectedItemId: id });
  },
}));
