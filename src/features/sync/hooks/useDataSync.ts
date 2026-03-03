// src/features/sync/hooks/useDataSync.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '@/store/useStore';
import * as driveApi from '../driveApi';
import * as dbApi from '@/db/api';
import { toast } from 'sonner';
import type { Template, Customer, Product, Invoice } from '@/db/models';

export { notifyDataChange } from '@/db/events';

const getLocalDataMap = async () => {
    const [templates, customers, products, invoices] = await Promise.all([
        dbApi.getTemplates(),
        dbApi.getCustomers(),
        dbApi.getProducts(),
        dbApi.getInvoices()
    ]);
    const { currency } = useStore.getState();
    
    return {
        [driveApi.FILE_NAMES.TEMPLATES]: { templates, lastUpdated: new Date().toISOString() },
        [driveApi.FILE_NAMES.CUSTOMERS]: { customers, lastUpdated: new Date().toISOString() },
        [driveApi.FILE_NAMES.PRODUCTS]: { products, lastUpdated: new Date().toISOString() },
        [driveApi.FILE_NAMES.RECORDS]: { invoices, lastUpdated: new Date().toISOString() },
        [driveApi.FILE_NAMES.SETTINGS]: { currency, lastUpdated: new Date().toISOString() }
    };
};

const importFileData = async (fileName: string, data: any) => {
    const now = new Date().toISOString();
    console.log(`Importing ${fileName}...`, data);
    try {
        switch (fileName) {
            case driveApi.FILE_NAMES.TEMPLATES: {
                const templates = await dbApi.getTemplates();
                await Promise.all(templates.map(item => dbApi.deleteTemplate(item.id, true)));
                const itemsToSave = data.templates || [];
                if (Array.isArray(itemsToSave)) {
                    for (const i of itemsToSave) {
                        await dbApi.saveTemplate({ ...i, lastSyncedAt: now }, true);
                    }
                }
                break;
            }
            case driveApi.FILE_NAMES.CUSTOMERS: {
                const customers = await dbApi.getCustomers();
                await Promise.all(customers.map(item => dbApi.deleteCustomer(item.id, true)));
                const itemsToSave = data.customers || [];
                if (Array.isArray(itemsToSave)) {
                    for (const i of itemsToSave) {
                        await dbApi.saveCustomer({ ...i, lastSyncedAt: now }, true);
                    }
                }
                break;
            }
            case driveApi.FILE_NAMES.PRODUCTS: {
                const products = await dbApi.getProducts();
                await Promise.all(products.map(item => dbApi.deleteProduct(item.id, true)));
                const itemsToSave = data.products || [];
                if (Array.isArray(itemsToSave)) {
                    for (const i of itemsToSave) {
                        await dbApi.saveProduct({ ...i, lastSyncedAt: now }, true);
                    }
                }
                break;
            }
            case driveApi.FILE_NAMES.RECORDS: {
                const invoices = await dbApi.getInvoices();
                await Promise.all(invoices.map(item => dbApi.deleteInvoice(item.id, true)));
                const itemsToSave = data.invoices || [];
                if (Array.isArray(itemsToSave)) {
                    for (const i of itemsToSave) {
                        await dbApi.saveInvoice({ ...i, lastSyncedAt: now }, true);
                    }
                }
                break;
            }
            case driveApi.FILE_NAMES.SETTINGS:
                if (data.currency) {
                    useStore.getState().setCurrency(data.currency, true);
                }
                break;
        }
        console.log(`Imported ${fileName} successfully.`);
    } catch (error) {
        console.error(`Failed to import ${fileName}:`, error);
        throw error;
    }
};

export function useDataSync() {
    const { isLoggedIn } = useAuthStore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingUploadCount, setPendingUploadCount] = useState(0);
    const [pendingDownloadCount, setPendingDownloadCount] = useState(0);
    const [syncedCount, setSyncedCount] = useState(0);

    const calculatePendingCounts = useCallback(async () => {
        if (!isLoggedIn) return;
        
        console.log("Calculating pending counts...");
        try {
            const [templates, customers, products, invoices] = await Promise.all([
                dbApi.getTemplates(),
                dbApi.getCustomers(),
                dbApi.getProducts(),
                dbApi.getInvoices()
            ]);

            const allItems = [...templates, ...customers, ...products, ...invoices];
            
            const localPending = allItems.filter(item => !item.lastSyncedAt || new Date(item.updatedAt) > new Date(item.lastSyncedAt)).length;
            const localSynced = allItems.filter(item => item.lastSyncedAt && new Date(item.updatedAt) <= new Date(item.lastSyncedAt)).length;
            
            setPendingUploadCount(localPending);
            setSyncedCount(localSynced);

            // Check remote differences
            let remoteChangesCount = 0;
            for (const fileName of Object.values(driveApi.FILE_NAMES)) {
                if (fileName === driveApi.FILE_NAMES.SETTINGS) continue;

                const remoteFile = await driveApi.getFileMetadata(fileName);
                if (remoteFile) {
                    const remoteTimestamp = new Date(remoteFile.modifiedTime).getTime();
                    
                    let categoryItems: any[] = [];
                    if (fileName === driveApi.FILE_NAMES.TEMPLATES) categoryItems = templates;
                    else if (fileName === driveApi.FILE_NAMES.CUSTOMERS) categoryItems = customers;
                    else if (fileName === driveApi.FILE_NAMES.PRODUCTS) categoryItems = products;
                    else if (fileName === driveApi.FILE_NAMES.RECORDS) categoryItems = invoices;

                    const maxLastSynced = categoryItems.length > 0 
                        ? Math.max(...categoryItems.map(i => i.lastSyncedAt ? new Date(i.lastSyncedAt).getTime() : 0))
                        : 0;

                    if (remoteTimestamp > maxLastSynced + 1000) { 
                        const remoteData = await driveApi.downloadFile(remoteFile.id);
                        let items: any[] = [];
                        if (fileName === driveApi.FILE_NAMES.TEMPLATES) items = remoteData.templates || [];
                        else if (fileName === driveApi.FILE_NAMES.CUSTOMERS) items = remoteData.customers || [];
                        else if (fileName === driveApi.FILE_NAMES.PRODUCTS) items = remoteData.products || [];
                        else if (fileName === driveApi.FILE_NAMES.RECORDS) items = remoteData.invoices || [];

                        remoteChangesCount += items.length;
                    }
                }
            }
            setPendingDownloadCount(remoteChangesCount);
        } catch (e: any) {
            // Only log if it's not a 401 (which is handled by driveApi interceptor)
            if (e.response?.status !== 401) {
                console.error("Error calculating counts", e);
            }
        }
    }, [isLoggedIn]);

    const syncData = useCallback(async () => {
        if (!isLoggedIn || isSyncing) return;

        setIsSyncing(true);
        console.log("Starting manual sync...");
        const now = new Date().toISOString();
        let anyChanges = false;

        try {
            const localDataMap = await getLocalDataMap();

            for (const fileName of Object.values(driveApi.FILE_NAMES)) {
                try {
                    const localData = (localDataMap as any)[fileName];
                    const remoteFile = await driveApi.getFileMetadata(fileName);
                    
                    let hasLocalChanges = false;
                    if (fileName === driveApi.FILE_NAMES.TEMPLATES) hasLocalChanges = localData.templates.some((i: any) => !i.lastSyncedAt || new Date(i.updatedAt) > new Date(i.lastSyncedAt));
                    else if (fileName === driveApi.FILE_NAMES.CUSTOMERS) hasLocalChanges = localData.customers.some((i: any) => !i.lastSyncedAt || new Date(i.updatedAt) > new Date(i.lastSyncedAt));
                    else if (fileName === driveApi.FILE_NAMES.PRODUCTS) hasLocalChanges = localData.products.some((i: any) => !i.lastSyncedAt || new Date(i.updatedAt) > new Date(i.lastSyncedAt));
                    else if (fileName === driveApi.FILE_NAMES.RECORDS) hasLocalChanges = localData.invoices.some((i: any) => !i.lastSyncedAt || new Date(i.updatedAt) > new Date(i.lastSyncedAt));
                    else if (fileName === driveApi.FILE_NAMES.SETTINGS) hasLocalChanges = true; // Settings always synced for now

                    if (remoteFile) {
                        const remoteTimestamp = new Date(remoteFile.modifiedTime).getTime();
                        
                        let categoryItems: any[] = [];
                        if (fileName === driveApi.FILE_NAMES.TEMPLATES) categoryItems = localData.templates;
                        else if (fileName === driveApi.FILE_NAMES.CUSTOMERS) categoryItems = localData.customers;
                        else if (fileName === driveApi.FILE_NAMES.PRODUCTS) categoryItems = localData.products;
                        else if (fileName === driveApi.FILE_NAMES.RECORDS) categoryItems = localData.invoices;

                        const maxLastSynced = categoryItems.length > 0 
                            ? Math.max(...categoryItems.map(i => i.lastSyncedAt ? new Date(i.lastSyncedAt).getTime() : 0))
                            : 0;

                        console.log(`Checking ${fileName}: remote=${new Date(remoteTimestamp).toISOString()}, lastSynced=${new Date(maxLastSynced).toISOString()}, hasLocalChanges=${hasLocalChanges}`);

                        // Priority: Remote is newer than our last sync
                        if (remoteTimestamp > maxLastSynced + 2000) { // 2s buffer for clock skew
                            toast.info(`Downloading ${fileName}...`);
                            const remoteData = await driveApi.downloadFile(remoteFile.id);
                            await importFileData(fileName, remoteData);
                            anyChanges = true;
                            continue; // Move to next file after download
                        }
                    }

                    // If we didn't download, and we have local changes, upload them
                    if (hasLocalChanges) {
                        toast.info(`Uploading ${fileName}...`);
                        await driveApi.uploadFile(fileName, localData);
                        anyChanges = true;
                        
                        // Mark local items as synced
                        if (fileName === driveApi.FILE_NAMES.TEMPLATES) {
                            for (const i of localData.templates) await dbApi.saveTemplate({ ...i, lastSyncedAt: now }, true);
                        }
                        else if (fileName === driveApi.FILE_NAMES.CUSTOMERS) {
                            for (const i of localData.customers) await dbApi.saveCustomer({ ...i, lastSyncedAt: now }, true);
                        }
                        else if (fileName === driveApi.FILE_NAMES.PRODUCTS) {
                            for (const i of localData.products) await dbApi.saveProduct({ ...i, lastSyncedAt: now }, true);
                        }
                        else if (fileName === driveApi.FILE_NAMES.RECORDS) {
                            for (const i of localData.invoices) await dbApi.saveInvoice({ ...i, lastSyncedAt: now }, true);
                        }
                    }
                } catch (fileError: any) {
                    if (fileError.response?.status !== 401) {
                        console.error(`Failed to sync ${fileName}:`, fileError);
                        toast.error(`Failed to sync ${fileName}.`);
                    }
                    // Continue with other files
                }
            }

            if (anyChanges) {
                console.log("Sync changes applied, refreshing dashboard data...");
                await useStore.getState().fetchDashboardData(true);
                toast.success("Sync complete.");
            } else {
                toast.info("Everything is up to date.");
            }
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error("Sync process failed:", error);
                toast.error("Sync failed. Check console for details.");
            }
        } finally {
            setIsSyncing(false);
            await calculatePendingCounts();
        }
    }, [isLoggedIn, isSyncing, calculatePendingCounts]);

    useEffect(() => {
        if (isLoggedIn) {
            calculatePendingCounts();
        }
    }, [isLoggedIn, calculatePendingCounts]);

    return { isSyncing, syncData, pendingUploadCount, pendingDownloadCount, syncedCount, calculatePendingCounts };
}
