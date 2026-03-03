// src/features/sync/driveApi.ts
import axios from 'axios';
import { useAuthStore } from './store/useAuthStore';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const APP_DATA_FOLDER = 'Martini-Records-Backup';

// Create a dedicated axios instance for Drive API
const driveInstance = axios.create();

// Add a response interceptor to handle 401 Unauthorized errors
driveInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Google Drive session expired, logging out...');
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export const FILE_NAMES = {
    RECORDS: 'records.json',
    TEMPLATES: 'templates.json',
    CUSTOMERS: 'customers.json',
    PRODUCTS: 'products.json',
    SETTINGS: 'settings.json'
};

async function getHeaders() {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Not authenticated');
    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    return headers;
}

// Function to find or create the app data folder
async function getAppDataFolderId(): Promise<string> {
    let folderId: string | null = null;

    // Search for the folder
    const searchResponse = await driveInstance.get(`${DRIVE_API_URL}/files`, {
        headers: await getHeaders(),
        params: {
            q: `name='${APP_DATA_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)',
        },
    });

    if (searchResponse.data.files.length > 0) {
        folderId = searchResponse.data.files[0].id;
    } else {
        // Create the folder if it doesn't exist
        const createFolderResponse = await driveInstance.post(`${DRIVE_API_URL}/files`, {
            name: APP_DATA_FOLDER,
            mimeType: 'application/vnd.google-apps.folder',
        }, { headers: await getHeaders() });
        folderId = createFolderResponse.data.id;
    }

    return folderId!;
}


// Function to get a file's metadata (if it exists)
export async function getFileMetadata(fileName: string) {
    const folderId = await getAppDataFolderId();
    
    const response = await driveInstance.get(`${DRIVE_API_URL}/files`, {
        headers: await getHeaders(),
        params: {
            q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
        },
    });

    return response.data.files.length > 0 ? response.data.files[0] : null;
}

// Function to download a file by ID
export async function downloadFile(fileId: string) {
    const response = await driveInstance.get(`${DRIVE_API_URL}/files/${fileId}`, {
        headers: await getHeaders(),
        params: { alt: 'media' },
    });
    return response.data;
}

// Function to upload/update a file
export async function uploadFile(fileName: string, content: object) {
    const folderId = await getAppDataFolderId();
    const fileMetadata = await getFileMetadata(fileName);
    
    const fileContent = JSON.stringify(content);
    
    if (fileMetadata) {
        // Update existing file content only - much safer with PATCH
        await driveInstance({
            method: 'PATCH',
            url: `${DRIVE_UPLOAD_URL}/files/${fileMetadata.id}?uploadType=media`,
            data: fileContent,
            headers: {
                Authorization: `Bearer ${useAuthStore.getState().token}`,
                'Content-Type': 'application/json',
            },
        });
    } else {
        // Create new file with metadata and content
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [folderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        await driveInstance({
            method: 'POST',
            url: `${DRIVE_UPLOAD_URL}/files?uploadType=multipart`,
            data: form,
            headers: {
                Authorization: `Bearer ${useAuthStore.getState().token}`,
            },
        });
    }
}

// Legacy support (to be removed once useDataSync is updated)
export async function getAppDataFile() {
    return getFileMetadata('martinishot-data.json');
}

export async function downloadAppData(fileId: string) {
    return downloadFile(fileId);
}

export async function uploadAppData(content: object) {
    return uploadFile('martinishot-data.json', content);
}
