// src/db/models.ts

/**
 * Represents a resizable, draggable image on a template canvas.
 */
export interface CanvasImage {
  id: string;
  base64Data: string;
  originalWidth: number;
  originalHeight: number;
  currentWidth: number;
  currentHeight: number;
  x: number;
  y: number;
  opacity: number;
}

/**
 * Represents a draggable text label on a template canvas.
 * Its value can be static text or a dynamic placeholder for invoice totals.
 */
export interface CanvasLabel {
  id: string;
  type: 'Subtotal' | 'Total' | 'Tax' | 'Discount' | 'Custom';
  textValue: string;
  isVisible: boolean;
  x: number;
  y: number;
  fontSize: number; // Added for more control
}

/**
 * Defines the structure for an invoice template, including paper size,
 * visual elements, and the area designated for line items.
 */
export interface Template {
  id: string;
  name: string;
  paperSize: 'A4' | 'Letter';
  images: CanvasImage[];
  labels: CanvasLabel[];
  lineItemArea: {
    y: number; // y-coordinate starting point
    height: number; // Maximum height for the line item block
  };
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Represents a customer entity.
 */
export interface Customer {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId?: string; // Optional as not all customers may have one
}

/**
 * Represents a product or service that can be added to an invoice.
 */
export interface Product {
  id: string;
  name: string;
  defaultRate: number;
  unit: 'hour' | 'item' | 'service';
}

/**
 * Represents a single line item within an invoice.
 */
export interface LineItem {
  id: string; // Unique within the invoice
  itemName: string;
  rate: number;
  qty: number;
  amount: number; // Calculated: rate * qty
}

/**
 * Represents the main invoice document. The status determines its mutability.
 * 'DRAFT' invoices can be edited.
 * 'LOCKED' invoices are finalized and cannot be changed.
 */
export interface Invoice {
  id:string;
  templateId: string;
  customerId: string;
  date: string; // ISO 8601 date string
  lineItems: LineItem[];
  // Example for appliedFees: { tax: 10, discount: 5 }
  appliedFees: Record<string, number>;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'LOCKED';
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Stores the generated PDF blob data, linking it to a finalized invoice.
 */
export interface GeneratedPDF {
  id: string;
  invoiceId: string; // The LOCKED invoice this PDF belongs to
  blob: Blob;
  generatedAt: string; // ISO 8601 date string
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
