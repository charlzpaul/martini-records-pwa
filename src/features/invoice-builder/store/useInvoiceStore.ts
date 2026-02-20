// src/features/invoice-builder/store/useInvoiceStore.ts
import { create } from 'zustand';
import type { Invoice, LineItem } from '@/db/models';
import * as dbApi from '@/db/api';
import { saveGeneratedPdfForInvoice } from '@/features/pdf/generatePdf';
import { notifyDataChange } from '@/features/sync/hooks/useDataSync';

interface InvoiceState {
  activeInvoice: Invoice | null;
  originalInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  loadInvoice: (id: string) => Promise<void>;
  createNewInvoice: () => void;
  updateActiveInvoice: (data: Partial<Invoice>) => void;
  setLineItems: (lineItems: LineItem[]) => void;
  saveInvoice: () => Promise<Invoice | null>;
  saveAsCopy: () => Promise<Invoice | null>;
  generatePdf: () => Promise<void>;
}

const recalculateTotals = (lineItems: LineItem[]): Pick<Invoice, 'subtotal' | 'taxAmount' | 'grandTotal'> => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = subtotal * 0.10;
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
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
      templateId: '',
      customerId: '',
      date: now,
      lineItems: [],
      appliedFees: {},
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      status: 'DRAFT',
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
            
  setLineItems: (lineItems: LineItem[]) => {
    set((state: any) => {
      if (!state.activeInvoice) return {};
      const totals = recalculateTotals(lineItems);
      return {
        activeInvoice: {
          ...state.activeInvoice,
          lineItems,
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
      if (isNew) {
        const { id, ...rest } = payload;
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
      const { id, ...rest } = activeInvoice;
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
  
      const updatedInvoice: Invoice = { ...activeInvoice, status: 'LOCKED' };
      const savedInvoice = await dbApi.saveInvoice(updatedInvoice);
  
      set({
        activeInvoice: savedInvoice,
        originalInvoice: structuredClone(savedInvoice),
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
