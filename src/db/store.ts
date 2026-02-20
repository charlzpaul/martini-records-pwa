// src/db/store.ts
import localforage from 'localforage';

const APP_NAME = 'martinishot';

/**
 * Configuration for localforage to use Blobs directly.
 * This is crucial for storing PDF files.
 */
localforage.config({
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE,
  ],
  name: APP_NAME,
  version: 1.0,
  description: 'Offline-first database for the invoice PWA.',
});

/**
 * Individual data stores (like tables in a relational database).
 * This helps keep data types separate and queries clean.
 */
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

/**
 * A separate store for application metadata, like the seeding flag.
 */
export const metaStore = localforage.createInstance({
    name: APP_NAME,
    storeName: 'meta',
});
