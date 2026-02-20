// src/db/api.ts
import {
  templateStore,
  customerStore,
  productStore,
  invoiceStore,
  pdfStore,
} from './store';
import type { Template, Customer, Product, Invoice, GeneratedPDF } from './models';

/**
 * Generic function to get all items from a store.
 * @param {LocalForage} store - The store instance to query.
 * @returns {Promise<T[]>} - An array of items.
 */
async function getAll<T>(store: LocalForage): Promise<T[]> {
  try {
    const items: T[] = [];
    await store.iterate((value: T) => {
      items.push(value);
    });
    return items;
  } catch (error) {
    console.error('Error in getAll:', error);
    return [];
  }
}

/**
 * Generic function to get an item by key prefix.
 * @param {LocalForage} store - The store instance to query.
 * @param {string} prefix - The key prefix to filter by.
 * @returns {Promise<T | null>} - The item or null if not found.
 */
async function getOneByPrefix<T>(store: LocalForage, prefix: string): Promise<T | null> {
  try {
    let result: T | null = null;
    await store.iterate((value: T, key: string) => {
      if (key.startsWith(prefix)) {
        result = value;
        return true; // Stop iterating
      }
    });
    return result;
  } catch (error) {
    console.error('Error in getOneByPrefix:', error);
    return null;
  }
}

/**
 * Generic function to save an item to a store.
 * It automatically sets a UUID, and created/updated timestamps.
 * @param {LocalForage} store - The store instance.
 * @param {T} item - The item to save. It may or may not have an ID.
 * @returns {Promise<T>} - The saved item with all fields populated.
 */
async function saveItem<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  store: LocalForage,
  item: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<T> {
  const now = new Date().toISOString();
  const isNew = !item.id;

  const fullItem: T = {
    id: isNew ? crypto.randomUUID() : item.id,
    ...item,
    createdAt: isNew ? now : (await store.getItem<T>(item.id!))?.createdAt || now,
    updatedAt: now,
  } as T;

  await store.setItem(fullItem.id, fullItem);
  return fullItem;
}

// --- API Functions for Each Model ---

// Templates
export const getTemplates = () => getAll<Template>(templateStore);
export const getTemplateById = (id: string) => templateStore.getItem<Template>(id);
export const saveTemplate = (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => saveItem<Template>(templateStore, template);
export const deleteTemplate = (id: string) => templateStore.removeItem(id);

// Customers
export const getCustomers = () => getAll<Customer>(customerStore);
export const getCustomerById = (id: string) => customerStore.getItem<Customer>(id);
export const saveCustomer = (customer: Omit<Customer, 'id'> & { id?: string }) => saveItem<Customer>(customerStore, customer as any);
export const deleteCustomer = (id: string) => customerStore.removeItem(id);

// Products
export const getProducts = () => getAll<Product>(productStore);
export const getProductById = (id: string) => productStore.getItem<Product>(id);
export const saveProduct = (product: Omit<Product, 'id'> & { id?: string }) => saveItem<Product>(productStore, product as any);
export const deleteProduct = (id: string) => productStore.removeItem(id);

// Invoices
export const getInvoices = () => getAll<Invoice>(invoiceStore);
export const getInvoiceById = (id: string) => invoiceStore.getItem<Invoice>(id);
export const saveInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => saveItem<Invoice>(invoiceStore, invoice);
export const deleteInvoice = (id: string) => invoiceStore.removeItem(id);

// Generated PDFs
export const getGeneratedPdfs = () => getAll<GeneratedPDF>(pdfStore);
export const getGeneratedPdfById = (id: string) => pdfStore.getItem<GeneratedPDF>(id);

export const getGeneratedPdfByInvoiceId = async (invoiceId: string): Promise<GeneratedPDF | null> => {
  return getOneByPrefix(pdfStore, `pdf_${invoiceId}_`);
};

export const saveGeneratedPdf = (pdf: Omit<GeneratedPDF, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => saveItem<GeneratedPDF>(pdfStore, pdf);
export const deleteGeneratedPdf = (id: string) => pdfStore.removeItem(id);
