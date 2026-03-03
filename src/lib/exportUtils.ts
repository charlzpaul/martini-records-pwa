// src/lib/exportUtils.ts
import type { Invoice, Customer, Template } from '@/db/models';

/**
 * Converts a list of invoices, customers, and templates into a CSV string.
 * This function dynamically determines the columns for adjustments and custom names for totals.
 */
export function convertInvoicesToCSV(invoices: Invoice[], customers: Customer[], templates: Template[]): string {
  const customerMap = new Map(customers.map(c => [c.id, c]));
  const templateMap = new Map(templates.map(t => [t.id, t]));

  // Find all unique adjustment names across all invoices
  const allAdjustmentNames = new Set<string>();
  invoices.forEach(invoice => {
    Object.keys(invoice.appliedFees).forEach(feeName => {
      allAdjustmentNames.add(feeName);
    });
  });
  const adjustmentNames = Array.from(allAdjustmentNames).sort();

  // Find custom names for Subtotal and Grand Total from templates
  // Since multiple templates might have different names, we'll try to find the most common or just use the first one
  let subtotalHeader = 'Subtotal';
  let grandTotalHeader = 'Grand Total';

  // Try to find custom names from the first template used by an invoice
  if (invoices.length > 0) {
    const firstInvoiceTemplate = templateMap.get(invoices[0].templateId);
    if (firstInvoiceTemplate) {
      const subtotalLabel = firstInvoiceTemplate.labels.find(l => l.type === 'Subtotal');
      if (subtotalLabel && subtotalLabel.textValue) {
        subtotalHeader = subtotalLabel.textValue;
      }
      const totalLabel = firstInvoiceTemplate.labels.find(l => l.type === 'Total');
      if (totalLabel && totalLabel.textValue) {
        grandTotalHeader = totalLabel.textValue;
      }
    }
  }

  const baseHeaders = [
    'Invoice Number',
    'Nickname',
    'Date',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Customer Tax ID',
    'Template Name',
    subtotalHeader,
  ];

  const headers = [
    ...baseHeaders,
    ...adjustmentNames,
    grandTotalHeader,
    'Created At',
    'Updated At',
    'Line Items Count'
  ];

  const rows = invoices.map(invoice => {
    const customer = customerMap.get(invoice.customerId);
    const template = templateMap.get(invoice.templateId);
    const templateName = template?.name || 'Unknown Template';

    const row: (string | number)[] = [
      invoice.invoiceNumber || '',
      invoice.nickname || '',
      invoice.date,
      customer?.name || 'Unknown Customer',
      customer?.email || '',
      customer?.phone || '',
      customer?.taxId || '',
      templateName,
      invoice.subtotal.toFixed(2),
    ];

    // Add adjustment amounts
    adjustmentNames.forEach(name => {
      const amount = invoice.appliedFees[name] || 0;
      row.push(amount.toFixed(2));
    });

    row.push(invoice.grandTotal.toFixed(2));
    row.push(invoice.createdAt);
    row.push(invoice.updatedAt);
    row.push(invoice.lineItems.length);

    return row.map(field => {
      // Escape commas and quotes for CSV
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    });
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Triggers a browser download of the given CSV content.
 */
export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
