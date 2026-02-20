// src/features/invoice-builder/InvoiceBuilderPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore } from './store/useInvoiceStore';
import { useTemplateStore } from '@/features/template-builder/store/useTemplateStore';
import { AppLayout } from '@/app/AppLayout';
import { HeaderForm } from './components/HeaderForm';
import { LineItemsTable } from './components/LineItemsTable';
import { PDFPreviewModal } from '@/features/pdf/PDFPreviewModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import * as dbApi from '@/db/api';

export function InvoiceBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeInvoice,
    loading,
    error,
    isDirty,
    loadInvoice,
    createNewInvoice,
    saveInvoice,
    saveAsCopy,
    generatePdf,
  } = useInvoiceStore();
  const { activeTemplate, loadTemplate } = useTemplateStore();
  const [showPdfModal, setShowPdfModal] = useState(false);

  useUnsavedChangesGuard(isDirty && activeInvoice?.status !== 'LOCKED');

  useEffect(() => {
    if (id) {
      if (id === 'new') {
        createNewInvoice();
      } else {
        loadInvoice(id);
      }
    }
  }, [id, loadInvoice, createNewInvoice]);

  // Load template when invoice is loaded
  useEffect(() => {
    if (activeInvoice?.templateId && !activeTemplate) {
      loadTemplate(activeInvoice.templateId);
    }
  }, [activeInvoice?.templateId, activeTemplate, loadTemplate]);

  const handleSave = () => {
    if (!activeInvoice?.customerId || !activeInvoice?.templateId) {
        toast.error("Validation Error", {
            description: "Please select a customer and a template before saving.",
        });
        return;
    }
    
    toast.promise(saveInvoice, {
      loading: 'Saving invoice...',
      success: (saved) => {
        if (id === 'new' && saved?.id) {
            navigate(`/invoice/${saved.id}`, { replace: true });
        }
        return 'Invoice saved successfully!';
      },
      error: 'Failed to save invoice.',
    });
  };

  const handleSaveAsCopy = () => {
     if (!activeInvoice?.customerId || !activeInvoice?.templateId) {
        toast.error("Validation Error", {
            description: "Please select a customer and a template before saving.",
        });
        return;
    }
    toast.promise(saveAsCopy, {
        loading: 'Saving a copy...',
        success: (saved) => {
            navigate(`/invoice/${saved.id}`);
            return 'Invoice copy created successfully!';
        },
        error: 'Failed to save copy.',
    });
  };

  const handleGeneratePdf = async () => {
    if (activeInvoice?.id === 'new') {
        toast.error("Save Required", {
            description: "Please save the invoice before generating a PDF.",
        });
        return;
    }
    
    try {
        await generatePdf();
        setShowPdfModal(true);
    } catch (error) {
        // Error is already handled by the store
    }
  };
  
  const handleShare = async () => {
    if (!activeInvoice || activeInvoice.status !== 'LOCKED') return;

    const pdfRecord = await dbApi.getGeneratedPdfByInvoiceId(activeInvoice.id);
    if (!pdfRecord) {
        toast.error("PDF not found", { description: "Could not find the generated PDF to share."});
        return;
    }

    const file = new File([pdfRecord.blob], `Invoice-${activeInvoice.id.substring(0,8)}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: `Invoice ${activeInvoice.id}`,
                text: `Here is the invoice ${activeInvoice.id}.`,
            });
            toast.success('PDF shared successfully');
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                toast.error("Share failed", { description: "Could not share the PDF."});
            }
        }
    } else {
        toast.warning("Share not supported", { description: "Your browser does not support sharing files."});
    }
  };

  const isLocked = activeInvoice?.status === 'LOCKED';

  return (
    <AppLayout>
      {loading && <p>Loading invoice...</p>}
      {error && <p className="text-destructive">Error: {error}</p>}
      {activeInvoice && (
        <div className="space-y-8">
          <header className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold">Invoice Builder</h1>
                <p className="text-muted-foreground">
                    {activeInvoice.id === 'new'
                        ? 'Creating a new invoice'
                        : `Editing Invoice #${activeInvoice.id.substring(0, 8)}`
                    }
                    {isLocked && <span className="text-destructive font-semibold ml-2">(LOCKED)</span>}
                </p>
            </div>
            <div className="flex space-x-2">
                {isLocked && <Button variant="outline" onClick={handleShare}>Share</Button>}
                <Button variant="outline" onClick={handleGeneratePdf} disabled={isLocked}>
                    {isLocked ? 'PDF Generated' : 'Generate PDF'}
                </Button>
                <Button variant="secondary" onClick={handleSaveAsCopy}>Save as Copy</Button>
                <Button onClick={handleSave} disabled={isLocked}>Save Invoice</Button>
            </div>
          </header>
          
          <HeaderForm />
          <LineItemsTable />
        </div>
      )}
      
      <PDFPreviewModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        invoice={activeInvoice}
        template={activeTemplate}
      />
    </AppLayout>
  );
}

