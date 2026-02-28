import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Template, Customer, CanvasLabel, LineItem } from '@/db/models';

// Helper function to get react-pdf compatible font family
// Map common font names to react-pdf compatible fonts
function getPdfFontFamily(fontFamily?: string): string {
  if (!fontFamily) return 'Helvetica';
  
  const fontMap: Record<string, string> = {
    'Arial': 'Helvetica',
    'Helvetica': 'Helvetica',
    'Times New Roman': 'Times-Roman',
    'Georgia': 'Times-Roman',
    'Courier New': 'Courier',
  };
  
  return fontMap[fontFamily] || 'Helvetica';
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: 'white',
  },
  // Use absolute positioning for canvas elements
  canvasObject: {
    position: 'absolute',
  },
  lineItemTable: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#dfdfdf',
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    backgroundColor: '#f2f2f2',
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    padding: 5,
  },
});

function getLabelValue(label: CanvasLabel, invoice: Invoice, template: Template, customer?: Customer | null): string {
  switch (label.type) {
    case 'Subtotal':
      return `Subtotal: $${invoice.subtotal.toFixed(2)}`;
    case 'Tax':
      return `Tax: $${invoice.taxAmount.toFixed(2)}`;
    case 'Total':
      return `Total: $${invoice.grandTotal.toFixed(2)}`;
    default:
      let text = label.textValue;
      
      // Replace invoice number placeholder
      if (text.includes('INV-2023-001') && invoice.invoiceNumber) {
        text = text.replace('INV-2023-001', invoice.invoiceNumber);
      }
      
      // Replace date placeholder
      if (text.includes('January 1, 2023') && invoice.date) {
        const dateObj = new Date(invoice.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        text = text.replace('January 1, 2023', formattedDate);
      }
      
      // Replace customer info placeholder
      if (customer && text.includes('John Doe')) {
        const customerText = `${customer.name}\n${customer.address}\nPhone: ${customer.phone}\nTax ID: ${customer.taxId || 'N/A'}`;
        text = customerText;
      }
      
      // Check if this is the totals block (by ID or by content)
      const isTotalsBlock = label.id === 'totals-block' || text.includes('Subtotal: $0.00') || text.includes('Tax 1 (10%): $0.00') || text.includes('Tax 2 (5%): $0.00') || text.includes('Total: $0.00');
      
      if (isTotalsBlock && template.totalsBlockGroupedLayers && template.totalsBlockGroupedLayers.length > 0) {
        // Generate totals text based on template's totalsBlockGroupedLayers
        const layers = template.totalsBlockGroupedLayers;
        const lines: string[] = [];
        
        // Filter out subtotal and grand total layers as they are handled separately
        const adjustmentLayers = layers.filter(layer =>
          layer.id !== 'subtotal-layer' && layer.id !== 'grand-total-layer'
        );
        
        // Find subtotal and grand total layer names
        const subtotalLayer = layers.find(layer => layer.id === 'subtotal-layer');
        const grandTotalLayer = layers.find(layer => layer.id === 'grand-total-layer');
        const subtotalLabel = subtotalLayer?.name || 'Subtotal';
        const grandTotalLabel = grandTotalLayer?.name || 'Total';
        
        // Subtotal line
        lines.push(`${subtotalLabel}: $${invoice.subtotal.toFixed(2)}`);
        
        // Adjustment layers
        adjustmentLayers.forEach(layer => {
          if (layer.isVisible) {
            const amount = invoice.appliedFees?.[layer.name] || 0;
            const layerType = layer.type || 'percentage';
            if (layerType === 'percentage') {
              lines.push(`${layer.name} (${layer.percentage}%): $${amount.toFixed(2)}`);
            } else {
              // For value type, show as fixed amount
              lines.push(`${layer.name}: $${amount.toFixed(2)}`);
            }
          }
        });
        
        // Grand total line
        lines.push(`${grandTotalLabel}: $${invoice.grandTotal.toFixed(2)}`);
        
        return lines.join('\n');
      }
      
      // Fallback to original placeholder replacement for backward compatibility
      if (text.includes('Subtotal: $0.00')) {
        text = text.replace('Subtotal: $0.00', `Subtotal: $${invoice.subtotal.toFixed(2)}`);
      }
      // Replace tax placeholders
      if (text.includes('Tax 1 (10%): $0.00')) {
        // For simplicity, use half of taxAmount for each tax line
        const tax1Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 1 (10%): $0.00', `Tax 1 (10%): $${tax1Amount.toFixed(2)}`);
      }
      if (text.includes('Tax 2 (5%): $0.00')) {
        const tax2Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 2 (5%): $0.00', `Tax 2 (5%): $${tax2Amount.toFixed(2)}`);
      }
      if (text.includes('Total: $0.00')) {
        text = text.replace('Total: $0.00', `Total: $${invoice.grandTotal.toFixed(2)}`);
      }
      
      return text;
  }
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
  customer?: Customer | null;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template, customer }) => {
const paperSize = (template.paperSize === 'Letter' ? 'LETTER' : 'A4') as 'A4' | 'LETTER';

// Page dimensions in points (react-pdf units)
const pageWidth = paperSize === 'A4' ? 595 : 612;
const pageHeight = paperSize === 'A4' ? 842 : 792;

// Convert pixel to point (approximate: 1px = 0.75pt at 96 DPI)
const pxToPt = 0.75;

// Get column widths from template or use defaults
const columnWidths = template.lineItemArea.columnWidths ||
  (template.hasPercentageColumn ? [200, 80, 80, 80, 100] : [200, 80, 80, 100]);

// Calculate total width of all columns
const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width, 0);

// Calculate percentage for each column
const columnPercentages = columnWidths.map(width => (width / totalColumnWidth) * 100);

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
        {/* Main container for all template elements */}
        <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Static Content: Images and Labels */}
                {template.images.map(image => {
                  // Convert pixel dimensions to points
                  let width = Math.max(1, image.currentWidth * pxToPt);
                  let height = Math.max(1, image.currentHeight * pxToPt);
                  let left = image.x * pxToPt; // NO page padding
                  let top = image.y * pxToPt; // NO page padding
                    
                  // Calculate available space within page (no padding)
                  const maxRight = pageWidth;
                  const maxBottom = pageHeight;
                    
                  // Ensure image stays within page bounds - adjust position if needed
                  if (left < 0) left = 0;
                  if (top < 0) top = 0;
                  if (left > maxRight) left = maxRight - width;
                  if (top > maxBottom) top = maxBottom - height;
                    
                  // Calculate how much the image exceeds page bounds
                  const excessRight = Math.max(0, left + width - maxRight);
                  const excessBottom = Math.max(0, top + height - maxBottom);
                    
                  // If image exceeds bounds, scale it down proportionally
                  if (excessRight > 0 || excessBottom > 0) {
                    // Calculate scaling factors for width and height
                    // Ensure we don't divide by zero and scale is positive
                    const widthScale = excessRight > 0 && width > 0 ? Math.max(0.01, (maxRight - left) / width) : 1;
                    const heightScale = excessBottom > 0 && height > 0 ? Math.max(0.01, (maxBottom - top) / height) : 1;
                    
                    // Use the more restrictive scale to maintain aspect ratio
                    const scale = Math.min(widthScale, heightScale, 1); // Don't scale up
                    
                    // Apply scaling
                    width = Math.max(1, width * scale);
                    height = Math.max(1, height * scale);
                  }
                   
                  return (
                    <React.Fragment key={image.id}>
                      <Image
                          src={image.base64Data}
                          style={{
                              ...styles.canvasObject,
                              left,
                              top,
                              width,
                              height,
                              opacity: image.opacity,
                          }}
                      />
                    </React.Fragment>
                  );
                })}
                {template.labels.filter(l => l.isVisible).map(label => {
                  // Convert pixel position to points - NO padding
                  let left = label.x * pxToPt;
                  let top = label.y * pxToPt;
                   
                  // Ensure label stays within page bounds
                  if (left < 0) left = 0;
                  if (top < 0) top = 0;
                  if (left > pageWidth) left = pageWidth;
                  if (top > pageHeight) top = pageHeight;
                   
                  return (
                    <React.Fragment key={label.id}>
                      <Text
                          style={{
                              ...styles.canvasObject,
                              left,
                              top,
                              fontSize: label.fontSize * pxToPt,
                              fontFamily: getPdfFontFamily(label.fontFamily),
                          }}
                      >
                          {getLabelValue(label, invoice, template, customer)}
                      </Text>
                    </React.Fragment>
                  );
                })}

                {/* Dynamic Content: Line Items */}
                <View style={{
                    position: 'absolute',
                    left: template.lineItemArea.x * pxToPt, // Convert pixels to points - NO page padding
                    top: template.lineItemArea.y * pxToPt, // Convert pixels to points - NO page padding
                    width: template.lineItemArea.width * pxToPt,
                    height: template.lineItemArea.height * pxToPt,
                }}>
                    <View style={styles.lineItemTable}>
                        {/* Rows (no header row) */}
                        {invoice.lineItems.map((item: LineItem) => (
                            <React.Fragment key={item.id}>
                              <View style={styles.tableRow}>
                                  {/* Item Name Column */}
                                  <Text style={{
                                    ...styles.tableCol,
                                    width: `${columnPercentages[0]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>{item.itemName}</Text>
                                  {/* Quantity Column */}
                                  <Text style={{
                                    ...styles.tableCol,
                                    width: `${columnPercentages[1]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>{item.qty}</Text>
                                  {/* Rate Column */}
                                  <Text style={{
                                    ...styles.tableCol,
                                    width: `${columnPercentages[2]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>
                                    {item.unit ? `$${item.rate.toFixed(2)}/${item.unit}` : `$${item.rate.toFixed(2)}`}
                                  </Text>
                                  {/* Percentage Column (if enabled) */}
                                  {template.hasPercentageColumn && (
                                      <Text style={{
                                        ...styles.tableCol,
                                        width: `${columnPercentages[3]}%`,
                                        fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                        fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                      }}>
                                          {/* Calculate percentage amount: base amount * (percentageValue / 100) */}
                                          {item.percentageValue ? `$${(item.rate * item.qty * (item.percentageValue / 100)).toFixed(2)}` : '$0.00'}
                                      </Text>
                                  )}
                                  {/* Amount Column (last column) */}
                                  <Text style={{
                                    ...styles.tableCol,
                                    width: `${columnPercentages[template.hasPercentageColumn ? 4 : 3]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>
                                      ${item.amount.toFixed(2)}
                                  </Text>
                              </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>
        </View>

           </Page>
        </Document>
    );
};
