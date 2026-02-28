import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Template, Customer } from '@/db/models';
import * as dbApi from '@/db/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Download, Share2 } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  template: Template | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: 'white',
  },
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
    borderColor: 'hsl(var(--border))',
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
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--muted))',
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: 'hsl(var(--border))',
    padding: 5,
  },
});


function getLabelValue(label: any, invoice: Invoice, template: Template, customer?: Customer | null): string {
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
        const customerText = `Customer:\n${customer.name}\n${customer.address}\n${customer.email}\n${customer.phone}`;
        text = customerText;
      }
      
      // Check if this is the totals block (by ID or by content)
      const isTotalsBlock = label.id === 'totals-block' || text.includes('Subtotal: $0.00') || text.includes('HST (13%): $0.00') || text.includes('Tax 1 (10%): $0.00') || text.includes('Tax 2 (5%): $0.00') || text.includes('Total: $0.00');
      
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
            lines.push(`${layer.name} (${layer.percentage}%): $${amount.toFixed(2)}`);
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
      if (text.includes('HST (13%): $0.00')) {
        text = text.replace('HST (13%): $0.00', `HST (13%): $${invoice.taxAmount.toFixed(2)}`);
      }
      if (text.includes('Total: $0.00')) {
        text = text.replace('Total: $0.00', `Total: $${invoice.grandTotal.toFixed(2)}`);
      }
      
      return text;
  }
}

// Helper function to get react-pdf compatible font family
// TEMPORARY: Always return Helvetica to debug hanging issue
function getPdfFontFamily(_fontFamily?: string): string {
  return 'Helvetica';
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
  customer?: Customer | null;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template, customer }) => {

  const paperSize = (template.paperSize === 'Letter' ? 'LETTER' : 'A4') as 'A4' | 'LETTER';
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
                {template.images.map(image => (
                    <Image
                        key={image.id}
                        src={image.base64Data}
                        style={{
                            ...styles.canvasObject,
                            left: image.x * pxToPt, // Convert pixels to points - NO extra padding
                            top: image.y * pxToPt,
                            width: Math.max(1, image.currentWidth * pxToPt),
                            height: Math.max(1, image.currentHeight * pxToPt),
                            opacity: image.opacity,
                        }}
                    />
                ))}
                {template.labels.filter(l => l.isVisible).map(label => (
                    <Text
                        key={label.id}
                        style={{
                            ...styles.canvasObject,
                            left: label.x * pxToPt, // Convert pixels to points - NO extra padding
                            top: label.y * pxToPt,
                            fontSize: label.fontSize,
                            fontFamily: getPdfFontFamily(label.fontFamily),
                        }}
                    >
                        {getLabelValue(label, invoice, template, customer)}
                    </Text>
                ))}

                {/* Dynamic Content: Line Items */}
                <View style={{
                    position: 'absolute',
                    left: template.lineItemArea.x * pxToPt, // Convert pixels to points - NO extra padding
                    top: template.lineItemArea.y * pxToPt, // Convert pixels to points - NO extra padding
                    width: template.lineItemArea.width * pxToPt,
                    height: template.lineItemArea.height * pxToPt,
                }}>
                    <View style={styles.lineItemTable}>
                        {/* Rows (no header row) */}
                        {invoice.lineItems.map((item) => (
                            <View key={item.id} style={styles.tableRow}>
                                {/* Item Name Column */}
                                <Text style={{...styles.tableCol, width: `${columnPercentages[0]}%`}}>{item.itemName}</Text>
                                {/* Quantity Column */}
                                <Text style={{...styles.tableCol, width: `${columnPercentages[1]}%`}}>{item.qty}</Text>
                                {/* Rate Column */}
                                <Text style={{...styles.tableCol, width: `${columnPercentages[2]}%`}}>
                                  {item.unit ? `$${item.rate.toFixed(2)}/${item.unit}` : `$${item.rate.toFixed(2)}`}
                                </Text>
                                {/* Percentage Column (if enabled) */}
                                {template.hasPercentageColumn && (
                                    <Text style={{...styles.tableCol, width: `${columnPercentages[3]}%`}}>
                                        {/* Calculate percentage amount: base amount * (percentageValue / 100) */}
                                        {item.percentageValue ? `$${(item.rate * item.qty * (item.percentageValue / 100)).toFixed(2)}` : '$0.00'}
                                    </Text>
                                )}
                                {/* Amount Column (last column) */}
                                <Text style={{...styles.tableCol, width: `${columnPercentages[template.hasPercentageColumn ? 4 : 3]}%`}}>
                                    ${item.amount.toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
        </View>
            </Page>
        </Document>
    );
};

export function PDFPreviewModal({ isOpen, onClose, invoice, template }: PDFPreviewModalProps) {
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (isOpen && invoice && template) {
            setIsGenerating(true);
            
            // Load customer data before generating PDF
            const loadCustomerAndGeneratePdf = async () => {
                let customer = null;
                if (invoice.customerId) {
                    customer = await dbApi.getCustomerById(invoice.customerId);
                }
                
                import('@react-pdf/renderer').then(({ pdf }) => {
                    pdf(<InvoiceDocument invoice={invoice} template={template} customer={customer} />)
                        .toBlob()
                        .then((blob) => {
                            setPdfBlob(blob);
                            setIsGenerating(false);
                        })
                        .catch((err) => {
                            console.error('Error generating PDF:', err);
                            setIsGenerating(false);
                            toast.error('Failed to generate PDF preview');
                        });
                });
            };
            
            loadCustomerAndGeneratePdf();
        }
    }, [isOpen, invoice, template]);

    const handleDownload = async () => {
        if (!pdfBlob || !invoice) return;

        // Generate filename with invoice number and datetime stamp
        const invoiceNumber = invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8)}`;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:T]/g, '-'); // YYYY-MM-DD-HH-MM-SS
        const filename = `INVOICE-${invoiceNumber}-${dateStr}.pdf`;

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
    };

    const handleShare = async () => {
        if (!pdfBlob || !invoice) return;

        setIsSharing(true);
        // Generate filename with invoice number and datetime stamp
        const invoiceNumber = invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8)}`;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:T]/g, '-'); // YYYY-MM-DD-HH-MM-SS
        const filename = `INVOICE-${invoiceNumber}-${dateStr}.pdf`;
        
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Invoice ${invoice.id}`,
                    text: `Here is the invoice ${invoice.id}.`,
                });
                toast.success('PDF shared successfully');
            } catch (error) {
                // User cancelled or share failed
                if ((error as Error).name !== 'AbortError') {
                    toast.error('Failed to share PDF');
                }
            }
        } else {
            toast.warning('Share not supported', { description: 'Your browser does not support sharing files.' });
        }
        setIsSharing(false);
    };

    if (!invoice || !template) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>PDF Preview</span>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={handleShare}
                        disabled={isSharing || !pdfBlob}
                        className="flex items-center gap-2"
                    >
                        <Share2 className="h-4 w-4" />
                        {isSharing ? 'Sharing...' : 'Share'}
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={isGenerating || !pdfBlob}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Download'}
                    </Button>
                </div>

                <div className="mt-4 overflow-auto max-h-[60vh] flex justify-center">
                    {isGenerating ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow-lg p-4">
                            <InvoiceDocument invoice={invoice} template={template} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
