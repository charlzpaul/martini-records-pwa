// src/db/store.ts
import localforage from 'localforage';

const APP_NAME = 'martinishot';

// Create stores as separate instances to avoid module-level initialization issues
export const templateStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'templates',
});

export const customerStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'customers',
});

export const productStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'products',
});

export const invoiceStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'invoices',
});

export const pdfStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'generatedPdfs',
});

export const metaStore = localforage.createInstance({
  name: APP_NAME,
  storeName: 'meta',
});

// Initialize localforage with a promise
export async function initializeLocalForage() {
  try {
    await localforage.ready();
    console.log('LocalForage initialized successfully');
  } catch (error) {
    console.error('Error initializing LocalForage:', error);
  }
}
