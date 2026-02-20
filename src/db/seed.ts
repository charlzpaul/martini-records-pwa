// src/db/seed.ts
import {
  templateStore,
  customerStore,
  productStore,
  invoiceStore,
  metaStore,
} from './store';
import type { Template, Customer, Product, Invoice } from './models';

const SEED_FLAG_KEY = 'databaseSeeded';

/**
 * Checks if the database is already seeded.
 * @returns {Promise<boolean>} - True if seeded, false otherwise.
 */
async function isSeeded(): Promise<boolean> {
  try {
    const seeded = await metaStore.getItem<boolean>(SEED_FLAG_KEY);
    return seeded === true;
  } catch (error) {
    console.error('Error checking seed status:', error);
    return false;
  }
}

/**
 * Generates and saves the initial data set.
 */
async function performSeeding() {
  const now = new Date().toISOString();

  // 1. Create a default customer
  const customerId = crypto.randomUUID();
  const defaultCustomer: Customer = {
    id: customerId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    address: '123 Main Street, Anytown, USA',
    phone: '555-123-4567',
  };
  await customerStore.setItem(customerId, defaultCustomer);
  console.log('Seeded customer:', defaultCustomer);

  // 2. Create a default product
  const productId = crypto.randomUUID();
  const defaultProduct: Product = {
    id: productId,
    name: 'Web Development Services',
    defaultRate: 100,
    unit: 'hour',
  };
  await productStore.setItem(productId, defaultProduct);
  console.log('Seeded product:', defaultProduct);

  // 3. Create a default template
  const templateId = crypto.randomUUID();
  const defaultTemplate: Template = {
    id: templateId,
    name: 'Standard A4 Template',
    paperSize: 'A4',
    images: [],
    labels: [
      { id: crypto.randomUUID(), type: 'Total', textValue: 'Total:', isVisible: true, x: 450, y: 750, fontSize: 14 },
    ],
    lineItemArea: { y: 200, height: 400 },
    createdAt: now,
    updatedAt: now,
  };
  await templateStore.setItem(templateId, defaultTemplate);
  console.log('Seeded template:', defaultTemplate);

  // 4. Create a default draft invoice
  const invoiceId = crypto.randomUUID();
  const defaultInvoice: Invoice = {
    id: invoiceId,
    customerId: customerId,
    templateId: templateId,
    date: now,
    lineItems: [
      { id: crypto.randomUUID(), itemName: 'Project Scoping', qty: 5, rate: 100, amount: 500 },
    ],
    appliedFees: { tax: 50 },
    subtotal: 500,
    taxAmount: 50,
    grandTotal: 550,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
  await invoiceStore.setItem(invoiceId, defaultInvoice);
  console.log('Seeded invoice:', defaultInvoice);
}

/**
 * Main function to run the seeding process. It checks the seed flag
 * and only populates the database if it hasn't been done before.
 */
export async function seedDatabaseIfNeeded() {
  const seeded = await isSeeded();
  if (!seeded) {
    console.log('Database not seeded. Seeding now...');
    try {
      await performSeeding();
      await metaStore.setItem(SEED_FLAG_KEY, true);
      console.log('Database seeding complete.');
    } catch (error) {
      console.error('Error during database seeding:', error);
      // In case of error, we don't want to set the flag, so it can retry on next load.
    }
  } else {
    console.log('Database already seeded.');
  }
}
