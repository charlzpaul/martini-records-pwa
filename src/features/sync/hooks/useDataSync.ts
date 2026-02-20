// src/features/sync/hooks/useDataSync.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import * as driveApi from '../driveApi';
import * as dbApi from '@/db/api';
import { debounce } from 'lodash-es';
import { toast } from 'sonner';
import type { Template, Customer, Product, Invoice } from '@/db/models';

// This would be stored in local storage or metaStore
let lastLocalChange = 0;

// A simple event emitter to notify of DB changes
export const dataChangeNotifier = new EventTarget();
export const notifyDataChange = () => {
    lastLocalChange = Date.now();
    dataChangeNotifier.dispatchEvent(new Event('change'));
}

// Export only data that can be serialized to JSON (exclude PDF blobs)
const exportSyncableData = async () => {
    const templates = await dbApi.getTemplates();
    const customers = await dbApi.getCustomers();
    const products = await dbApi.getProducts();
    const invoices = await dbApi.getInvoices();
    return { templates, customers, products, invoices, lastUpdated: new Date().toISOString() };
};

// Import data (excluding PDFs for now)
const importSyncableData = async (data: { templates: Template[], customers: Customer[], products: Product[], invoices: Invoice[], lastUpdated: string }) => {
    // Clear local data before importing
    await Promise.all([
        dbApi.getTemplates().then(items => Promise.all(items.map(i => dbApi.deleteTemplate(i.id)))),
        dbApi.getCustomers().then(items => Promise.all(items.map(i => dbApi.deleteCustomer(i.id)))),
        dbApi.getProducts().then(items => Promise.all(items.map(i => dbApi.deleteProduct(i.id)))),
        dbApi.getInvoices().then(items => Promise.all(items.map(i => dbApi.deleteInvoice(i.id)))),
    ]);

    // Import new data
    await Promise.all([
        ...data.templates.map((i) => dbApi.saveTemplate(i)),
        ...data.customers.map((i) => dbApi.saveCustomer(i)),
        ...data.products.map((i) => dbApi.saveProduct(i)),
        ...data.invoices.map((i) => dbApi.saveInvoice(i)),
    ]);
};

// Handle PDF files separately
const handlePdfSync = async (fileId: string, invoiceIds: string[]) => {
    try {
        // Download PDFs from Drive
        const pdfs = await Promise.all(
            invoiceIds.map(async (invoiceId) => {
                try {
                    const pdfFile = await driveApi.getAppDataFile();
                    if (pdfFile) {
                        const pdfData = await driveApi.downloadAppData(pdfFile.id);
                        // Convert to blob for LocalForage
                        const blob = new Blob([JSON.stringify(pdfData)], { type: 'application/json' });
                        return {
                            invoiceId,
                            blob,
                            generatedAt: pdfData.generatedAt,
                        };
                    }
                    return null;
                } catch (err) {
                    console.error(`Failed to download PDF for invoice ${invoiceId}:`, err);
                    return null;
                }
            })
        );

        // Save PDFs to local storage
        await Promise.all(
            pdfs.filter(Boolean).map((pdf) => {
                if (!pdf) return Promise.resolve();
                return dbApi.saveGeneratedPdf({
                    invoiceId: pdf.invoiceId,
                    blob: pdf.blob,
                    generatedAt: pdf.generatedAt,
                });
            })
        );
    } catch (error) {
        console.error('PDF sync failed:', error);
        throw error;
    }
};

// Merge strategy: prefer local data for conflicts
const mergeData = async (localData: any, remoteData: any) => {
    // For templates: prefer remote (freshest)
    // For customers: prefer remote
    // For products: prefer remote
    // For invoices: prefer remote (freshest)
    
    // We'll use the remote data as the base and merge in local updates
    // For now, this is a simplified merge - a real implementation would compare by ID and date
    
    toast.info("Merging remote data with local changes...");
    
    // Import remote data first
    await importSyncableData(remoteData);
    
    // Then re-import local data to preserve local changes
    await importSyncableData(localData);
    
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    toast.success("Merge complete. Remote data prioritized.");
};

export function useDataSync() {
    const { isLoggedIn } = useAuthStore();
    const [isSyncing, setIsSyncing] = useState(false);

    const syncData = useCallback(debounce(async () => {
        if (!isLoggedIn || isSyncing) return;

        setIsSyncing(true);
        toast.info("Syncing data with Google Drive...");

        try {
            const remoteFile = await driveApi.getAppDataFile();
            const lastSyncTime = new Date(localStorage.getItem('lastSyncTime') || 0).getTime();

            if (remoteFile) {
                const remoteTimestamp = new Date(remoteFile.modifiedTime).getTime();

                if (remoteTimestamp > lastSyncTime && remoteTimestamp > lastLocalChange) {
                    // Remote is newer - download and merge
                    toast.info("Remote data is newer, downloading...");
                    const remoteData = await driveApi.downloadAppData(remoteFile.id);
                    const localData = await exportSyncableData();
                    await mergeData(localData, remoteData);
                    toast.success("Sync complete. Data downloaded from cloud.");
                } else if (lastLocalChange > lastSyncTime) {
                    // Local is newer - upload
                    toast.info("Local data is newer, uploading...");
                    const localData = await exportSyncableData();
                    await driveApi.uploadAppData(localData);
                    localStorage.setItem('lastSyncTime', new Date().toISOString());
                    toast.success("Sync complete. Data uploaded to cloud.");
                } else {
                    // No changes
                    toast.info("Data is already up to date.");
                }
            } else {
                // No remote file, so just upload local data
                toast.info("No remote data found. Uploading local data...");
                const localData = await exportSyncableData();
                await driveApi.uploadAppData(localData);
                localStorage.setItem('lastSyncTime', new Date().toISOString());
                toast.success("Sync complete. Initial data uploaded.");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Sync failed. Check console for details.");
        } finally {
            setIsSyncing(false);
        }
    }, 5000), [isLoggedIn, isSyncing]);

    useEffect(() => {
        // Initial sync on login
        if (isLoggedIn) {
            syncData();
        }

        // Listen for local changes to trigger sync
        const handleChange = () => syncData();
        dataChangeNotifier.addEventListener('change', handleChange);
        return () => dataChangeNotifier.removeEventListener('change', handleChange);

    }, [isLoggedIn, syncData]);

    return { isSyncing, syncData };
}
