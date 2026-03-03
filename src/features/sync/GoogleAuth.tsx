// src/features/sync/GoogleAuth.tsx
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useAuthStore } from './store/useAuthStore';
import axios from 'axios';

import { useDataSync } from './hooks/useDataSync';
import { CloudUpload, CloudDownload, RefreshCw, CheckCircle2 } from 'lucide-react';

export function GoogleAuth() {
    const { isLoggedIn, setToken, setProfile, logout, profile } = useAuthStore();
    const { isSyncing, syncData, pendingUploadCount, pendingDownloadCount, syncedCount } = useDataSync();

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setToken(tokenResponse.access_token);
            try {
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                setProfile(userInfo.data);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            }
        },
        onError: error => console.error('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/drive.file',
    });

    if (isLoggedIn && profile) {
        return (
            <div className="flex items-center gap-1 sm:gap-6">
                <div className="flex items-center space-x-1.5 sm:space-x-4 bg-muted/30 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border/50">
                    <div className="flex items-center space-x-1.5 sm:space-x-3 text-[10px] sm:text-xs font-medium">
                        <div className="flex items-center space-x-1" title="Synced items">
                            <CheckCircle2 className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${syncedCount > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className={syncedCount > 0 ? 'text-green-600' : 'text-muted-foreground'}>{syncedCount}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Pending to upload">
                            <CloudUpload className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${pendingUploadCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            <span className={pendingUploadCount > 0 ? 'text-orange-600' : 'text-muted-foreground'}>{pendingUploadCount}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Pending to download">
                            <CloudDownload className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${pendingDownloadCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                            <span className={pendingDownloadCount > 0 ? 'text-blue-600' : 'text-muted-foreground'}>{pendingDownloadCount}</span>
                        </div>
                        {isSyncing && (
                            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 animate-spin" />
                        )}
                    </div>
                </div>

                <Button 
                    onClick={() => syncData()} 
                    disabled={isSyncing}
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 h-8 sm:h-9"
                >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Sync</span>
                </Button>
                
                <div className="flex items-center gap-1.5 sm:gap-3 border-l pl-1.5 sm:pl-6">
                    <img src={profile.picture} alt={profile.name} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full" referrerPolicy="no-referrer" />
                    <div className="flex flex-col">
                        <p className="text-xs sm:text-sm font-semibold leading-none hidden sm:block">{profile.name}</p>
                        <Button variant="link" className="p-0 h-auto text-[10px] text-muted-foreground hover:text-foreground justify-start" onClick={() => logout()}>Logout</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Button onClick={() => login()} size="sm" className="sm:h-10 sm:px-4 sm:py-2 px-2.5 h-8 sm:h-9">
            <span className="sm:hidden">Sign in</span>
            <span className="hidden sm:inline">Sign in to Backup</span>
        </Button>
    );
}
