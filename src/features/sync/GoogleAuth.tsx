// src/features/sync/GoogleAuth.tsx
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useAuthStore } from './store/useAuthStore';
import axios from 'axios';

export function GoogleAuth() {
    const { isLoggedIn, setToken, setProfile, logout, profile } = useAuthStore();

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
            <div className="flex items-center space-x-4">
                <img src={profile.picture} alt={profile.name} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold">{profile.name}</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => logout()}>Logout</Button>
                </div>
            </div>
        );
    }

    return (
        <Button onClick={() => login()}>
            Sign in with Google
        </Button>
    );
}
