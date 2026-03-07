// src/app/AppLayout.tsx
import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { GoogleAuth } from '@/features/sync/GoogleAuth';
import { SupportDialog } from '@/components/SupportDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FilePlus2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      // Alt+N to create new record
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (location.pathname !== '/invoice/new') {
          navigate('/invoice/new');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <header className="py-4 px-4 sm:px-8 border-b">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/martini-records-pwa/martini.svg" alt="Martini Records" className="h-8 w-8" />
            <span className="font-bold hidden sm:inline-block">Record Builder</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <SupportDialog />
            <GoogleAuth />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        {children}
      </main>

      {/* Floating Action Button - Highly accessible for primary action */}
      {isDashboard && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center md:h-auto md:w-auto md:rounded-xl md:px-6 md:py-3 md:gap-2"
            onClick={() => navigate('/invoice/new')}
            title="Create New Record (Alt+N)"
            aria-label="Create New Record"
          >
            <FilePlus2 className="h-6 w-6" />
            <span className="hidden md:inline font-bold">Create New Record</span>
          </Button>
        </div>
      )}

      <Toaster />
    </div>
  );
}
