// src/store/useStore.ts
import { create } from 'zustand';
import * as dbApi from '@/db/api';
import type { Template, Customer, Product, Invoice, GeneratedPDF } from '@/db/models';

// Define a type for the combined feed item
export type FeedItem = (Invoice | Template | GeneratedPDF | Customer | Product) & { itemType: 'Invoice' | 'Template' | 'PDF' | 'Customer' | 'Product' };

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
  currency: string;
  currencySymbol: string;

  // Actions
  fetchDashboardData: () => Promise<void>;
  setCurrency: (currency: string) => void;
  // Add actions for creating items will be added later
}

// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'INR': return '₹';
    default: return '$';
  }
};

export const useStore = create<AppState>((set) => ({
  // Initial state
  templates: [],
  customers: [],
  products: [],
  invoices: [],
  generatedPdfs: [],
  feed: [],
  loading: true,
  error: null,
  currency: 'USD',
  currencySymbol: '$',

  // --- Actions ---
  setCurrency: (currency: string) => {
    const symbol = getCurrencySymbol(currency);
    set({ currency, currencySymbol: symbol });
  },
  
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch all data in parallel
      const [invoices, templates, generatedPdfs, customers, products] = await Promise.all([
        dbApi.getInvoices(),
        dbApi.getTemplates(),
        dbApi.getGeneratedPdfs(),
        dbApi.getCustomers(),
        dbApi.getProducts(),
      ]);

      // Sort templates by updatedAt descending (latest modified first)
      const sortedTemplates = [...templates].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      // Sort customers by updatedAt descending (latest modified first)
      const sortedCustomers = [...customers].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      // Sort products by updatedAt descending (latest modified first)
      const sortedProducts = [...products].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      // Create the combined feed
      const invoiceFeedItems: FeedItem[] = invoices.map(i => ({ ...i, itemType: 'Invoice' }));
      const templateFeedItems: FeedItem[] = sortedTemplates.map(t => ({ ...t, itemType: 'Template' }));
      const pdfFeedItems: FeedItem[] = generatedPdfs.map(p => ({ ...p, itemType: 'PDF' }));
      const customerFeedItems: FeedItem[] = sortedCustomers.map(c => ({ ...c, itemType: 'Customer' }));
      const productFeedItems: FeedItem[] = sortedProducts.map(p => ({ ...p, itemType: 'Product' }));
      
      const combinedFeed = [...invoiceFeedItems, ...templateFeedItems, ...pdfFeedItems, ...customerFeedItems, ...productFeedItems];

      // Sort the feed by date (newest first)
      combinedFeed.sort((a, b) => {
        // Handle items without timestamp fields (Customer, Product)
        const getDate = (item: FeedItem): Date => {
          if ('updatedAt' in item && item.updatedAt) {
            return new Date(item.updatedAt);
          }
          if ('createdAt' in item && item.createdAt) {
            return new Date(item.createdAt);
          }
          // For items without timestamps, use a default old date
          return new Date(0);
        };
        
        const dateA = getDate(a).getTime();
        const dateB = getDate(b).getTime();
        return dateB - dateA;
      });

      set({
        invoices,
        templates: sortedTemplates,
        generatedPdfs,
        customers: sortedCustomers,
        products: sortedProducts,
        feed: combinedFeed,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      set({ loading: false, error: 'Failed to load data.' });
    }
  },
}));
