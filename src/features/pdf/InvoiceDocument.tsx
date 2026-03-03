import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Template, Customer, CanvasLabel, LineItem } from '@/db/models';
import { CURRENCY_ICONS, getCurrencyIcon, SYMBOL_TO_ISO } from './currencyIcons';



// Helper function to safely parse numeric values from strings or numbers
const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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
  tableColAlt: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    backgroundColor: '#f9f9f9',
    padding: 5,
  },
  totalsBlockContainer: {
    position: 'absolute',
    padding: 6, // equivalent to p-2 (0.5rem ≈ 8px = 6pt)
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3, // equivalent to space-y-1 (0.25rem ≈ 4px = 3pt)
  },
  totalsLabel: {
    // default style
  },
  totalsAmount: {
    // default style
  },
  totalsGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    paddingTop: 3, // equivalent to pt-1 (0.25rem ≈ 4px = 3pt)
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#d1d5db', // gray-300
    fontWeight: 'bold',
  },
});

/**
 * A wrapper for Text that handles currency symbols by switching to Noto Sans
 * only for the symbol itself, while keeping the user-selected font for the rest.
 */
const SmartText = ({ 
  children, 
  style,
  ...props 
}: { 
  children: string | number | (string | number)[]; 
  style?: any;
  [key: string]: any;
}) => {
  if (children === undefined || children === null) return null;
  
  const text = Array.isArray(children) ? children.join('') : String(children);
  const userFontFamily = style?.fontFamily || 'Helvetica';
  
  // Regular expression to match common currency symbols including Rupee
  // \u20B9 is ₹
  const symbolRegex = /(\u20B9|\$|\u20AC|\u00A3|\u00A5|C\$|A\$)/;
  
  if (!symbolRegex.test(text)) {
    return <Text style={style} {...props}>{text}</Text>;
  }
  
  const parts = text.split(symbolRegex);
  
  return (
    <Text style={style} {...props}>
      {parts.map((part, i) => {
        const isSymbol = symbolRegex.test(part);
        const currencyIcon = isSymbol ? getCurrencyIcon(part) : null;
        
        if (currencyIcon) {
          // Render as image if a Base64 icon is available
          // Adjust width and height as needed to fit text properly
          return (
            <Image 
              key={i} 
              src={currencyIcon} 
              style={{
                width: (style?.fontSize || 10) * 0.7, // Approximate width based on font size
                height: (style?.fontSize || 10),
                // Maintain baseline alignment with text
                // verticalAlign: 'middle', // Not supported for Image
                // top: '-0.1em', // Not supported for Image
              }}
            />
          );
        } else {
          return (
            <Text 
              key={i} 
              style={{
                fontFamily: isSymbol ? 'Noto Sans' : userFontFamily
              }}
            >
              {part}
            </Text>
          );
        }

      })}
    </Text>
  );
};

// Helper to detect if a label is the totals block
function isTotalsBlock(label: CanvasLabel): boolean {
  if (label.id === 'totals-block') return true;
  const text = label.textValue;
  if (text.includes('Subtotal: $0.00') || text.includes('Tax 1 (10%): $0.00') || text.includes('Tax 2 (5%): $0.00') || text.includes('Total: $0.00')) {
    return true;
  }
  return false;
}

// Component to render totals block with proper formatting
const TotalsBlockPDF = ({
  invoice,
  template,
  left,
  top,
  width,
  height,
  fontSize,
  fontFamily,
  currencySymbol = '$'
}: {
  invoice: Invoice;
  template: Template;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  currencySymbol?: string;
}) => {
  const layers = template.totalsBlockGroupedLayers || [];
  const adjustmentLayers = layers.filter(layer =>
    layer.id !== 'subtotal-layer' && layer.id !== 'grand-total-layer'
  );
  const subtotalLayer = layers.find(layer => layer.id === 'subtotal-layer');
  const grandTotalLayer = layers.find(layer => layer.id === 'grand-total-layer');
  const subtotalLabel = subtotalLayer?.name || 'Subtotal';
  const grandTotalLabel = grandTotalLayer?.name || 'Total';

  return (
    <View style={[styles.totalsBlockContainer, { left, top, width, height }]}>
      {/* Subtotal row */}
      <View style={styles.totalsRow}>
        <SmartText style={{ fontSize, fontFamily }}>{subtotalLabel}</SmartText>
        <SmartText style={{ fontSize, fontFamily }}>{`${currencySymbol}${invoice.subtotal.toFixed(2)}`}</SmartText>
      </View>

      {/* Adjustment layers */}
      {adjustmentLayers.map(layer => {
        if (!layer.isVisible) return null;
        const amount = invoice.appliedFees?.[layer.name] || 0;
        const layerType = layer.type || 'percentage';
        const labelText = layerType === 'percentage'
          ? `${layer.name} (${layer.percentage}%)`
          : layer.name;
        return (
          <View key={layer.id} style={styles.totalsRow}>
            <SmartText style={{ fontSize, fontFamily }}>{labelText}</SmartText>
            <SmartText style={{ fontSize, fontFamily }}>{`${currencySymbol}${amount.toFixed(2)}`}</SmartText>
          </View>
        );
      })}

      {/* Grand total row with separator line */}
      <View style={styles.totalsGrandTotalRow}>
        <SmartText style={{ fontSize, fontFamily, fontWeight: 'bold' }}>{grandTotalLabel}</SmartText>
        <SmartText style={{ fontSize, fontFamily, fontWeight: 'bold' }}>{`${currencySymbol}${invoice.grandTotal.toFixed(2)}`}</SmartText>
      </View>
    </View>
  );
};

function getLabelValue(label: CanvasLabel, invoice: Invoice, template: Template, customer?: Customer | null, currencySymbol: string = '$'): string {
  switch (label.type) {
    case 'Subtotal':
      return `Subtotal: ${currencySymbol}${invoice.subtotal.toFixed(2)}`;
    case 'Tax':
      return `Tax: ${currencySymbol}${invoice.taxAmount.toFixed(2)}`;
    case 'Total':
      return `Total: ${currencySymbol}${invoice.grandTotal.toFixed(2)}`;
    default:
      let text = label.textValue;

      // Replace invoice number placeholder
      // Handle both the default placeholder and any invoice number that might be in the template
      if (invoice.invoiceNumber) {
        // Replace the default placeholder if present
        if (text.includes('INV-2023-001')) {
          text = text.replace('INV-2023-001', invoice.invoiceNumber);
        }
        // Also try to replace any text that looks like an invoice number pattern
        // This handles cases where the template might have a different sample number
        const invoiceNumberPattern = /INV-\d{4}-\d{3}/; // Pattern like INV-2023-001
        if (invoiceNumberPattern.test(text)) {
          text = text.replace(invoiceNumberPattern, invoice.invoiceNumber);
        }
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
        lines.push(`${subtotalLabel}: ${currencySymbol}${invoice.subtotal.toFixed(2)}`);

        // Adjustment layers
        adjustmentLayers.forEach(layer => {
          if (layer.isVisible) {
            const amount = invoice.appliedFees?.[layer.name] || 0;
            const layerType = layer.type || 'percentage';
            if (layerType === 'percentage') {
              lines.push(`${layer.name} (${layer.percentage}%): ${currencySymbol}${amount.toFixed(2)}`);
            } else {
              // For value type, show as fixed amount
              lines.push(`${layer.name}: ${currencySymbol}${amount.toFixed(2)}`);
            }
          }
        });

        // Grand total line
        lines.push(`${grandTotalLabel}: ${currencySymbol}${invoice.grandTotal.toFixed(2)}`);

        return lines.join('\n');
      }

      // Fallback to original placeholder replacement for backward compatibility
      if (text.includes('Subtotal: $0.00')) {
        text = text.replace('Subtotal: $0.00', `Subtotal: ${currencySymbol}${invoice.subtotal.toFixed(2)}`);
      }
      // Replace tax placeholders
      if (text.includes('Tax 1 (10%): $0.00')) {
        // For simplicity, use half of taxAmount for each tax line
        const tax1Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 1 (10%): $0.00', `Tax 1 (10%): ${currencySymbol}${tax1Amount.toFixed(2)}`);
      }
      if (text.includes('Tax 2 (5%): $0.00')) {
        const tax2Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 2 (5%): $0.00', `Tax 2 (5%): ${currencySymbol}${tax2Amount.toFixed(2)}`);
      }
      if (text.includes('Total: $0.00')) {
        text = text.replace('Total: $0.00', `Total: ${currencySymbol}${invoice.grandTotal.toFixed(2)}`);
      }

      return text;
  }
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
  customer?: Customer | null;
  currencySymbol: string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template, customer, currencySymbol = '$' }) => {
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

                  // Check if this label is the totals block
                  if (isTotalsBlock(label) && template.totalsBlockGroupedLayers && template.totalsBlockGroupedLayers.length > 0) {
                    const width = (label.width || 200) * pxToPt;
                    const height = (label.height || 30) * pxToPt;
                    return (
                      <TotalsBlockPDF
                        key={label.id}
                        invoice={invoice}
                        template={template}
                        left={left}
                        top={top}
                        width={width}
                        height={height}
                        fontSize={label.fontSize * pxToPt}
                        fontFamily={getPdfFontFamily(label.fontFamily)}
                        currencySymbol={currencySymbol}
                      />
                    );
                  }
                    
                  return (
                    <React.Fragment key={label.id}>
                      <SmartText
                          style={{
                              ...styles.canvasObject,
                              left,
                              top,
                              fontSize: label.fontSize * pxToPt,
                              fontFamily: getPdfFontFamily(label.fontFamily),
                          }}
                      >
                          {getLabelValue(label, invoice, template, customer, currencySymbol)}
                      </SmartText>
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
                        {invoice.lineItems.map((item: LineItem, index: number) => (
                            <React.Fragment key={item.id}>
                              <View style={styles.tableRow}>
                                  {/* Item Name Column */}
                                  <SmartText style={{
                                    ...(index % 2 === 0 ? styles.tableColAlt : styles.tableCol),
                                    width: `${columnPercentages[0]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>{item.itemName}</SmartText>
                                  {/* Quantity Column */}
                                  <SmartText style={{
                                    ...(index % 2 === 0 ? styles.tableColAlt : styles.tableCol),
                                    width: `${columnPercentages[1]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>{parseNumber(item.qty)}</SmartText>
                                  {/* Rate Column */}
                                  <SmartText style={{
                                    ...(index % 2 === 0 ? styles.tableColAlt : styles.tableCol),
                                    width: `${columnPercentages[2]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>
                                    {item.unit ? `${currencySymbol}${parseNumber(item.rate).toFixed(2)}/${item.unit}` : `${currencySymbol}${parseNumber(item.rate).toFixed(2)}`}
                                  </SmartText>
                                  {/* Percentage Column (if enabled) */}
                                  {template.hasPercentageColumn && (
                                      <SmartText style={{
                                        ...(index % 2 === 0 ? styles.tableColAlt : styles.tableCol),
                                        width: `${columnPercentages[3]}%`,
                                        fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                        fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                      }}>
                                          {/* Calculate percentage amount: base amount * (percentageValue / 100) */}
                                          {item.percentageValue ? `${currencySymbol}${(parseNumber(item.rate) * parseNumber(item.qty) * (parseNumber(item.percentageValue) / 100)).toFixed(2)}` : `${currencySymbol}0.00`}
                                      </SmartText>
                                  )}
                                  {/* Amount Column (last column) */}
                                  <SmartText style={{
                                    ...(index % 2 === 0 ? styles.tableColAlt : styles.tableCol),
                                    width: `${columnPercentages[template.hasPercentageColumn ? 4 : 3]}%`,
                                    fontFamily: getPdfFontFamily(template.lineItemArea.fontFamily),
                                    fontSize: (template.lineItemArea.fontSize || 10) * pxToPt
                                  }}>
                                      {currencySymbol}{parseNumber(item.amount).toFixed(2)}
                                  </SmartText>
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
