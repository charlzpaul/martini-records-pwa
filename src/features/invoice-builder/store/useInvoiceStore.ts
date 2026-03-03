// src/features/invoice-builder/store/useInvoiceStore.ts
import { create } from 'zustand';
import type { Invoice, LineItem } from '@/db/models';
import * as dbApi from '@/db/api';
import { saveGeneratedPdfForInvoice } from '@/features/pdf/generatePdf';
import { notifyDataChange } from '@/db/events';

interface InvoiceState {
  activeInvoice: Invoice | null;
  originalInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  loadInvoice: (id: string) => Promise<void>;
  createNewInvoice: () => void;
  updateActiveInvoice: (data: Partial<Invoice>) => void;
  setLineItems: (lineItems: LineItem[], templateLayers?: Array<{name: string, type: 'percentage' | 'value', percentage: number, value: number, isVisible: boolean, id?: string}>) => void;
  setAdjustmentValue: (layerId: string, value: number, templateLayers?: Array<{name: string, type: 'percentage' | 'value', percentage: number, value: number, isVisible: boolean, id?: string}>) => void;
  saveInvoice: () => Promise<Invoice | null>;
  saveAsCopy: () => Promise<Invoice | null>;
  generatePdf: () => Promise<void>;
}

// Helper function to safely parse numeric values from strings or numbers
const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const recalculateTotals = (
  lineItems: LineItem[],
  templateLayers?: Array<{name: string, type?: 'percentage' | 'value', percentage: number, value?: number, isVisible: boolean, id?: string}>,
  adjustmentValues?: Record<string, number>
): Pick<Invoice, 'subtotal' | 'taxAmount' | 'grandTotal' | 'appliedFees'> => {
    // Subtotal is sum of (rate * quantity) for all line items (excluding percentage adjustments)
    // Use parseNumber to handle string values safely
    const subtotal = lineItems.reduce((acc, item) => {
      const rate = parseNumber(item.rate);
      const qty = parseNumber(item.qty);
      return acc + (rate * qty);
    }, 0);
    
    // Calculate applied fees based on template layers
    const appliedFees: Record<string, number> = {};
    let totalAdjustments = 0;
    
    if (templateLayers && templateLayers.length > 0) {
      templateLayers.forEach(layer => {
        if (layer.isVisible && layer.id) {
          let feeAmount = 0;
          // Handle backward compatibility: if type is not defined, assume it's percentage
          const layerType = layer.type || 'percentage';
          if (layerType === 'percentage' && layer.percentage !== 0) {
            feeAmount = subtotal * (layer.percentage / 100);
          } else if (layerType === 'value') {
            // Use invoice-specific adjustment value if available, otherwise use template value
            feeAmount = adjustmentValues?.[layer.id] ?? layer.value ?? 0;
          }
          
          if (feeAmount !== 0) {
            appliedFees[layer.name] = feeAmount;
            totalAdjustments += feeAmount;
          }
        }
      });
    } else {
      // Fallback to default tax calculation for backward compatibility
      const taxPercentage = 10;
      const taxAmount = subtotal * (taxPercentage / 100);
      appliedFees['Tax'] = taxAmount;
      totalAdjustments = taxAmount;
    }
    
    const grandTotal = subtotal + totalAdjustments;
    
    return {
      subtotal,
      taxAmount: totalAdjustments, // Keep taxAmount for backward compatibility
      grandTotal,
      appliedFees
    };
};

/**
 * Generate an invoice number based on customer name, date, and random number
 * Format: <CUSTOMER_ABBREV>-<DATE_ID>-<RANDOM_4DIGIT>
 * Example: ABC-250226-1234
 */
const generateInvoiceNumber = async (customerId: string, date: string): Promise<string> => {
  // Get customer name
  const customer = await dbApi.getCustomerById(customerId);
  const customerName = customer?.name || 'CUST';
  
  // Create abbreviation (first 3 letters, uppercase)
  const abbrev = customerName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  
  // Date identifier: YYMMDD format
  const dateObj = new Date(date);
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const dateId = `${year}${month}${day}`;
  
  // Random 4 digit number
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  
  return `${abbrev}-${dateId}-${random}`;
};

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  activeInvoice: null,
  originalInvoice: null,
  loading: false,
  error: null,
  isDirty: false,

  loadInvoice: async (id: string) => {
    set({ loading: true, error: null, activeInvoice: null, originalInvoice: null });
    try {
      const invoice = await dbApi.getInvoiceById(id);
      if (invoice) {
        set({
          activeInvoice: structuredClone(invoice),
          originalInvoice: structuredClone(invoice),
          loading: false
        });
      } else {
        throw new Error(`Invoice with id "${id}" not found.`);
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  createNewInvoice: () => {
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      id: 'new',
      invoiceNumber: '',
      nickname: '',
      templateId: '',
      customerId: '',
      date: now,
      lineItems: [],
      appliedFees: {},
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      createdAt: now,
      updatedAt: now,
    };
    set({
      activeInvoice: newInvoice,
      originalInvoice: structuredClone(newInvoice),
      loading: false,
      error: null
    });
  },

  updateActiveInvoice: (data: Partial<Invoice>) => {
    const previousInvoice = get().activeInvoice;
    const newInvoice = previousInvoice
      ? { ...previousInvoice, ...data, updatedAt: new Date().toISOString() }
      : null;
    set({
      activeInvoice: newInvoice,
      originalInvoice: previousInvoice ? structuredClone(previousInvoice) : null,
      isDirty: previousInvoice ? JSON.stringify(previousInvoice) !== JSON.stringify(newInvoice) : false,
    });
  },
            
  setLineItems: (lineItems: LineItem[], templateLayers?: Array<{name: string, type: 'percentage' | 'value', percentage: number, value: number, isVisible: boolean, id?: string}>) => {
    set((state: any) => {
      if (!state.activeInvoice) return {};
      const totals = recalculateTotals(lineItems, templateLayers, state.activeInvoice.adjustmentValues);
      return {
        activeInvoice: {
          ...state.activeInvoice,
          lineItems,
          ...totals,
        }
      }
    })
  },

  setAdjustmentValue: (layerId: string, value: number, templateLayers?: Array<{name: string, type: 'percentage' | 'value', percentage: number, value: number, isVisible: boolean, id?: string}>) => {
    set((state: any) => {
      if (!state.activeInvoice) return {};
      
      // Update adjustmentValues
      const currentAdjustmentValues = state.activeInvoice.adjustmentValues || {};
      const updatedAdjustmentValues = {
        ...currentAdjustmentValues,
        [layerId]: value
      };
      
      // Recalculate totals with updated adjustment values
      const totals = recalculateTotals(state.activeInvoice.lineItems, templateLayers, updatedAdjustmentValues);
      
      return {
        activeInvoice: {
          ...state.activeInvoice,
          adjustmentValues: updatedAdjustmentValues,
          ...totals,
        }
      }
    })
  },

  saveInvoice: async (): Promise<Invoice | null> => {
    const { activeInvoice } = get();
    if (!activeInvoice) return null;

    set({ loading: true });
    try {
      const isNew = activeInvoice.id === 'new';
      const payload = { ...activeInvoice };
      
      // Generate invoice number for new invoices (auto-generated, read-only)
      if (isNew && activeInvoice.customerId && activeInvoice.date && !activeInvoice.invoiceNumber) {
        const invoiceNumber = await generateInvoiceNumber(activeInvoice.customerId, activeInvoice.date);
        payload.invoiceNumber = invoiceNumber;
      }
      
      if (isNew) {
        const { id: _id, ...rest } = payload;
        const savedInvoice = await dbApi.saveInvoice(rest);
        if (savedInvoice) {
          set({
            activeInvoice: savedInvoice,
            originalInvoice: structuredClone(savedInvoice),
            loading: false,
            isDirty: false
          });
          notifyDataChange();
          return savedInvoice;
        }
      } else {
        const savedInvoice = await dbApi.saveInvoice(payload);
        if (savedInvoice) {
          set({
            activeInvoice: savedInvoice,
            originalInvoice: structuredClone(savedInvoice),
            loading: false,
            isDirty: false
          });
          notifyDataChange();
          return savedInvoice;
        }
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save invoice.' });
      throw err;
    }
    return null;
  },

  saveAsCopy: async (): Promise<Invoice | null> => {
    const { activeInvoice } = get();
    if (!activeInvoice) return null;

    set({ loading: true });
    try {
      const { id: _id, ...rest } = activeInvoice;
      
      // Generate new invoice number for the copy (auto-generated, read-only)
      // Always generate a new invoice number for copies, regardless of existing invoice number
      if (activeInvoice.customerId && activeInvoice.date) {
        const invoiceNumber = await generateInvoiceNumber(activeInvoice.customerId, activeInvoice.date);
        rest.invoiceNumber = invoiceNumber;
      }
      
      const savedInvoice = await dbApi.saveInvoice(rest);
      if (savedInvoice) {
        set({
          activeInvoice: savedInvoice,
          originalInvoice: structuredClone(savedInvoice),
          loading: false,
          isDirty: false
        });
        notifyDataChange();
        return savedInvoice;
      }
      set({ loading: false, error: 'Failed to save copy.' });
      return null;
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save copy.' });
      throw err;
    }
  },

  generatePdf: async () => {
    const { activeInvoice } = get();
    if (!activeInvoice) return;
  
    set({ loading: true });
    try {
      if (!activeInvoice.templateId) {
        throw new Error('Template not selected for this invoice.');
      }
      
      const template = await dbApi.getTemplateById(activeInvoice.templateId);
      if (!template) {
        throw new Error('Template not found for this invoice.');
      }
  
      await saveGeneratedPdfForInvoice(activeInvoice, template);
  
      // Don't change the invoice status to LOCKED
      // Just update the store to reflect the PDF was generated
      set({
        loading: false,
        isDirty: false,
      });
  
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to generate PDF.' });
      throw err;
    }
  },
}))
