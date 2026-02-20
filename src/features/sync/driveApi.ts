// src/features/sync/driveApi.ts
import axios from 'axios';
import { useAuthStore } from './store/useAuthStore';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const APP_DATA_FILE_NAME = 'martinishot-data.json';
const APP_DATA_FOLDER = 'MartiniShot-Invoices';

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
    const searchResponse = await axios.get(`${DRIVE_API_URL}/files`, {
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
        const createFolderResponse = await axios.post(`${DRIVE_API_URL}/files`, {
            name: APP_DATA_FOLDER,
            mimeType: 'application/vnd.google-apps.folder',
        }, { headers: await getHeaders() });
        folderId = createFolderResponse.data.id;
    }

    return folderId!;
}


// Function to get the app data file's metadata (if it exists)
export async function getAppDataFile() {
    const folderId = await getAppDataFolderId();
    
    const response = await axios.get(`${DRIVE_API_URL}/files`, {
        headers: await getHeaders(),
        params: {
            q: `'${folderId}' in parents and name='${APP_DATA_FILE_NAME}' and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
        },
    });

    return response.data.files.length > 0 ? response.data.files[0] : null;
}

// Function to download the app data file
export async function downloadAppData(fileId: string) {
    const response = await axios.get(`${DRIVE_API_URL}/files/${fileId}`, {
        headers: await getHeaders(),
        params: { alt: 'media' },
    });
    return response.data;
}

// Function to upload/update the app data file
export async function uploadAppData(content: object) {
    const folderId = await getAppDataFolderId();
    const fileMetadata = await getAppDataFile();
    
    const metadata = {
        name: APP_DATA_FILE_NAME,
        mimeType: 'application/json',
        parents: [folderId],
    };

    const fileContent = new Blob([JSON.stringify(content)], { type: 'application/json' });
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileContent);

    const uploadUrl = fileMetadata 
        ? `${DRIVE_UPLOAD_URL}/files/${fileMetadata.id}?uploadType=multipart`
        : `${DRIVE_UPLOAD_URL}/files?uploadType=multipart`;
    
    const method = fileMetadata ? 'PATCH' : 'POST';

    await axios({
        method,
        url: uploadUrl,
        data: form,
        headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
    });
}
