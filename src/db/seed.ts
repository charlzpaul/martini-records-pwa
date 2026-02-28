// src/db/seed.ts
import {
  templateStore,
  customerStore,
  productStore,
  invoiceStore,
  metaStore,
  initializeLocalForage,
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
    createdAt: now,
    updatedAt: now,
  };
  await customerStore.setItem(customerId, defaultCustomer);
  console.log('Seeded customer:', defaultCustomer);

  // 2. Create a default product
  const productId = crypto.randomUUID();
  const defaultProduct: Product = {
    id: productId,
    name: 'Web Development Services',
    defaultRate: 100,
    defaultQuantity: 1,
    unit: 'hour',
    createdAt: now,
    updatedAt: now,
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
      {
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
    lineItemArea: { x: 40, y: 250, width: 714, height: 400 },
    hasPercentageColumn: false,
    percentageColumnHeader: 'Percentage',
    percentageColumnValue: 10,
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
  await templateStore.setItem(templateId, defaultTemplate);
  console.log('Seeded template:', defaultTemplate);

  // 4. Create a default draft invoice
  const invoiceId = crypto.randomUUID();
  const defaultInvoice: Invoice = {
    id: invoiceId,
    invoiceNumber: 'JDO-250226-1234',
    nickname: 'Project Scoping Invoice',
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

export { initializeLocalForage };
