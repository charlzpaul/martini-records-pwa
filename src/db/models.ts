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
  fileName?: string; // Optional original filename
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
  fontFamily?: string; // Font family for the label
  width?: number; // Optional width for resizable labels
  height?: number; // Optional height for resizable labels
}

/**
 * Represents a grouped layer within the totals block.
 * Each layer can be a tax, discount, or custom charge with either a percentage or fixed value.
 */
export interface TotalsBlockGroupedLayer {
  id: string;
  name: string; // Display name (e.g., "Tax", "Discount", "Shipping")
  type: 'percentage' | 'value'; // Whether this layer uses percentage or fixed value
  percentage: number; // Percentage value (0-100) - used when type is 'percentage'
  value: number; // Fixed value amount (positive or negative) - used when type is 'value'
  isVisible: boolean;
  isUndeletable?: boolean; // Whether this layer cannot be deleted (e.g., percentage column layer)
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
    x: number; // x-coordinate starting point
    y: number; // y-coordinate starting point
    width: number; // Width of the line item block
    height: number; // Height of the line item block
    columnWidths?: number[]; // Optional array of column widths in pixels
    fontFamily?: string; // Font family for line items text
    fontSize?: number; // Font size for line items text
  };
  hasPercentageColumn?: boolean; // Whether to show percentage column in line items table
  percentageColumnHeader?: string; // Custom header name for percentage column
  percentageColumnValue?: number; // Percentage value (1-100) for the column
  totalsBlockGroupedLayers?: TotalsBlockGroupedLayer[]; // Grouped layers within the totals block
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
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Represents a product or service that can be added to an invoice.
 */
export interface Product {
  id: string;
  name: string;
  defaultRate: number;
  defaultQuantity: number;
  unit: 'hour' | 'item' | 'service';
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Represents a single line item within an invoice.
 */
export interface LineItem {
  id: string; // Unique within the invoice
  itemName: string;
  rate: number;
  qty: number;
  amount: number; // Calculated: rate * qty (or rate * qty * (1 + percentageValue/100) if percentage column exists)
  percentageValue?: number; // Percentage value for this line item (1-100)
  unit?: 'hour' | 'item' | 'service'; // Unit from product if item was selected from product catalog
}

/**
 * Represents the main invoice document.
 */
export interface Invoice {
  id:string;
  invoiceNumber?: string; // Auto-generated invoice number (read-only)
  nickname?: string; // User-provided nickname for the invoice
  templateId: string;
  customerId: string;
  date: string; // ISO 8601 date string
  lineItems: LineItem[];
  // Example for appliedFees: { tax: 10, discount: 5 }
  appliedFees: Record<string, number>;
  // Stores user-input values for value-based adjustments, keyed by adjustment layer ID
  adjustmentValues?: Record<string, number>;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
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
