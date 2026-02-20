// src/store/useStore.ts
import { create } from 'zustand';
import * as dbApi from '@/db/api';
import type { Template, Customer, Product, Invoice, GeneratedPDF } from '@/db/models';

// Define a type for the combined feed item
export type FeedItem = (Invoice | Template | GeneratedPDF) & { itemType: 'Invoice' | 'Template' | 'PDF' };

interface AppState {
  // State
  templates: Template[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  generatedPdfs: GeneratedPDF[];
  feed: FeedItem[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: () => Promise<void>;
  // Add actions for creating items will be added later
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  templates: [],
  customers: [],
  products: [],
  invoices: [],
  generatedPdfs: [],
  feed: [],
  loading: true,
  error: null,

  // --- Actions ---
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch all data in parallel
      const [invoices, templates, generatedPdfs] = await Promise.all([
        dbApi.getInvoices(),
        dbApi.getTemplates(),
        dbApi.getGeneratedPdfs(),
      ]);

      // Create the combined feed
      const invoiceFeedItems: FeedItem[] = invoices.map(i => ({ ...i, itemType: 'Invoice' }));
      const templateFeedItems: FeedItem[] = templates.map(t => ({ ...t, itemType: 'Template' }));
      const pdfFeedItems: FeedItem[] = generatedPdfs.map(p => ({ ...p, itemType: 'PDF' }));
      
      const combinedFeed = [...invoiceFeedItems, ...templateFeedItems, ...pdfFeedItems];

      // Sort the feed by date (newest first)
      combinedFeed.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      set({
        invoices,
        templates,
        generatedPdfs,
        feed: combinedFeed,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      set({ loading: false, error: 'Failed to load data.' });
    }
  },
}));
