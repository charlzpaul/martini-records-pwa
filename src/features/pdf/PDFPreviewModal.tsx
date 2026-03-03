import { useState, useEffect } from 'react';
import type { Invoice, Template } from '@/db/models';
import * as dbApi from '@/db/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Download, Share2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { InvoiceDocument } from './InvoiceDocument';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  template: Template | null;
}

export function PDFPreviewModal({ isOpen, onClose, invoice, template }: PDFPreviewModalProps) {
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const currencySymbol = useStore((state) => state.currencySymbol);

    useEffect(() => {
        if (isOpen && invoice && template) {
            setIsGenerating(true);
            
            // Clean up previous URL
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
            
            // Load customer data before generating PDF
            const loadCustomerAndGeneratePdf = async () => {
                try {
                    let customer = null;
                    if (invoice.customerId) {
                        customer = await dbApi.getCustomerById(invoice.customerId);
                    }
                    
                    const { pdf } = await import('@react-pdf/renderer');
                    const blob = await pdf(
                        <InvoiceDocument 
                            invoice={invoice} 
                            template={template} 
                            customer={customer} 
                            currencySymbol={currencySymbol} 
                        />
                    ).toBlob();
                    
                    const url = URL.createObjectURL(blob);
                    setPdfBlob(blob);
                    setPdfUrl(url);
                    setIsGenerating(false);
                } catch (err) {
                    console.error('Error generating PDF:', err);
                    setIsGenerating(false);
                    toast.error('Failed to generate PDF preview');
                }
            };
            
            loadCustomerAndGeneratePdf();
        }
        
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, invoice, template, currencySymbol]);

    const handleDownload = async () => {
        if (!pdfBlob || !invoice) return;

        // Generate filename with record number and datetime stamp
        const invoiceNumber = invoice.invoiceNumber || `REC-${invoice.id.substring(0, 8)}`;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:T]/g, '-'); // YYYY-MM-DD-HH-MM-SS
        const filename = `RECORD-${invoiceNumber}-${dateStr}.pdf`;

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
        // Generate filename with record number and datetime stamp
        const invoiceNumber = invoice.invoiceNumber || `REC-${invoice.id.substring(0, 8)}`;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:T]/g, '-'); // YYYY-MM-DD-HH-MM-SS
        const filename = `RECORD-${invoiceNumber}-${dateStr}.pdf`;
        
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Record ${invoice.id}`,
                    text: `Here is the record ${invoice.id}.`,
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
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle>PDF Preview</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
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

                <div className="mt-4 flex-1 overflow-hidden flex justify-center bg-muted rounded-md border">
                    {isGenerating ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : pdfUrl ? (
                        <iframe 
                            src={pdfUrl} 
                            className="w-full h-full" 
                            title="Invoice PDF Preview"
                        />
                    ) : (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                            Waiting for PDF generation...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
