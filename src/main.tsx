import { StrictMode, Suspense, Component } from 'react';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <BrowserRouter basename="/martini-records-pwa/">
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);
