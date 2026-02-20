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
    padding: 40,
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


function getLabelValue(label: any, invoice: Invoice): string {
  switch (label.type) {
    case 'Subtotal':
      return `Subtotal: ${invoice.subtotal.toFixed(2)}`;
    case 'Tax':
      return `Tax: ${invoice.taxAmount.toFixed(2)}`;
    case 'Total':
      return `Total: ${invoice.grandTotal.toFixed(2)}`;
    default:
      return label.textValue;
  }
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      if (invoice.customerId) {
        const cust = await dbApi.getCustomerById(invoice.customerId);
        setCustomer(cust);
      }
    }
    loadCustomer();
  }, [invoice.customerId]);

  const paperSize = (template.paperSize === 'Letter' ? 'LETTER' : 'A4') as 'A4' | 'LETTER';

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
                {/* Static Content: Images and Labels */}
                {template.images.map(image => (
                    <Image
                        key={image.id}
                        src={image.base64Data}
                        style={{
                            ...styles.canvasObject,
                            left: image.x,
                            top: image.y,
                            width: image.currentWidth,
                            height: image.currentHeight,
                            opacity: image.opacity,
                        }}
                    />
                ))}
                {template.labels.filter(l => l.isVisible).map(label => (
                    <Text
                        key={label.id}
                        style={{
                            ...styles.canvasObject,
                            left: label.x,
                            top: label.y,
                            fontSize: label.fontSize,
                        }}
                    >
                        {getLabelValue(label, invoice)}
                    </Text>
                ))}

                {/* Dynamic Content: Line Items */}
                <View style={{
                    position: 'absolute',
                    left: 40,
                    right: 40,
                    top: template.lineItemArea.y,
                    height: template.lineItemArea.height,
                }}>
                    <View style={styles.lineItemTable}>
                        {/* Header */}
                        <View style={styles.tableRow}>
                            <Text style={{...styles.tableColHeader, width: '40%'}}>Item</Text>
                            <Text style={styles.tableColHeader}>Quantity</Text>
                            <Text style={styles.tableColHeader}>Rate</Text>
                            <Text style={styles.tableColHeader}>Amount</Text>
                        </View>
                        {/* Rows */}
                        {invoice.lineItems.map((item) => (
                            <View key={item.id} style={styles.tableRow}>
                                <Text style={{...styles.tableCol, width: '40%'}}>{item.itemName}</Text>
                                <Text style={styles.tableCol}>{item.qty}</Text>
                                <Text style={styles.tableCol}>${item.rate.toFixed(2)}</Text>
                                <Text style={styles.tableCol}>${item.amount.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                {/* Customer and Invoice Info */}
                <View style={{ position: 'absolute', top: 40, left: 40 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{customer?.name}</Text>
                    <Text>{customer?.address}</Text>
                    <Text>{customer?.email}</Text>
                    <Text>{customer?.phone}</Text>
                </View>
                <View style={{ position: 'absolute', top: 40, right: 40, alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Invoice #{invoice.id.substring(0,8)}</Text>
                    <Text>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
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
            import('@react-pdf/renderer').then(({ pdf }) => {
                pdf(<InvoiceDocument invoice={invoice} template={template} />)
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
        }
    }, [isOpen, invoice, template]);

    const handleDownload = async () => {
        if (!pdfBlob) return;

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoice?.id.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
    };

    const handleShare = async () => {
        if (!pdfBlob || !invoice) return;

        setIsSharing(true);
        const file = new File([pdfBlob], `Invoice-${invoice.id.substring(0, 8)}.pdf`, { type: 'application/pdf' });

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
