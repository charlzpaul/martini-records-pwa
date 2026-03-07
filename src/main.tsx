import { StrictMode, Suspense, Component } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'next-themes';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Register Service Worker for PWA
registerSW({ immediate: true });

// Error Boundary component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: 'red',
          fontFamily: 'monospace',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
          <p>Please refresh the page or check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Google OAuth Error Boundary to catch "_.md" errors from the library
function GoogleOAuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('_.md')) {
        console.warn('Google OAuth error suppressed:', e.message);
        e.preventDefault();
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '20px',
        color: 'orange',
        fontFamily: 'monospace',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h2>Google Authentication</h2>
        <p>Authentication is temporarily unavailable. Please refresh the page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🥃</div>
      <p>Loading Martini Shot...</p>
    </div>
  );
}

// Diagnostic logging
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('Environment variables:', {
  VITE_GOOGLE_CLIENT_ID: clientId ? 'Set (length: ' + clientId.length + ')' : 'NOT SET',
  BASE_URL: import.meta.env.BASE_URL,
});

// Safety check for missing clientId
if (!clientId) {
  console.warn('WARNING: VITE_GOOGLE_CLIENT_ID is not set. Google Drive synchronization will not work.');
  console.warn('To fix this, add VITE_GOOGLE_CLIENT_ID to your .env file in the project root.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GoogleOAuthErrorBoundary>
          <GoogleOAuthProvider clientId={clientId || ''}>
            <BrowserRouter basename="/martini-records-pwa/">
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
          </GoogleOAuthProvider>
        </GoogleOAuthErrorBoundary>
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);
