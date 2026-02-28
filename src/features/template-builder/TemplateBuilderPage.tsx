// src/features/template-builder/TemplateBuilderPage.tsx
import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTemplateStore } from './store/useTemplateStore';
import { AppLayout } from '@/app/AppLayout';
import { Canvas } from './components/Canvas';
import { SettingsPanel } from './components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { toast } from 'sonner';

export function TemplateBuilderPage() {
  const { id } = useParams<{ id:string }>();
  const navigate = useNavigate();
  const hasInitialized = useRef(false);
  
  // Select state and actions from the store
  const {
    activeTemplate,
    loading,
    error,
    isDirty,
    loadTemplate,
    createNewTemplate,
    saveTemplate,
    saveAsCopy
  } = useTemplateStore();

  // Use unsaved changes guard
  useUnsavedChangesGuard(isDirty);

  const handleSave = async () => {
    toast.promise(saveTemplate, {
      loading: 'Saving template...',
      success: (savedTemplate) => {
        // Navigate to home page after successful save
        navigate('/');
        return `Template "${savedTemplate?.name}" saved successfully!`;
      },
      error: 'Failed to save template.',
    });
  };

  const handleSaveAsCopy = async () => {
    toast.promise(saveAsCopy, {
      loading: 'Saving a copy...',
      success: (savedTemplate) => {
        // Navigate to home page after successful save
        navigate('/');
        return `Template copy "${savedTemplate?.name}" created successfully!`;
      },
      error: 'Failed to save copy.',
    });
  };

  const handlePreview = () => {
    alert("Preview functionality coming soon!");
  };

  useEffect(() => {
    // Prevent running multiple times in Strict Mode
    if (hasInitialized.current) return;
    
    if (id) {
      if (id === 'new') {
        // Only create if we don't already have an active template
        if (!activeTemplate || activeTemplate.id === 'new') {
          createNewTemplate();
        }
      } else {
        loadTemplate(id);
      }
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Note: We remove store functions from deps to avoid re-triggering on every render

  const handleGoHome = () => {
    if (isDirty && !window.confirm(
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
    )) {
      return;
    }
    navigate('/');
  };

  return (
    <AppLayout>
      {loading && <p>Loading template...</p>}
      {error && <p className="text-destructive">Error: {error}</p>}
      {activeTemplate && (
        <div className="flex flex-col h-full">
          <header className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold">Template Builder</h1>
              <p className="text-muted-foreground">Editing: {activeTemplate.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                Preview
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveAsCopy}
                className="flex items-center gap-2"
              >
                Save as Copy
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </div>
          </header>
          
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 flex-grow">
            {/* On mobile: SettingsPanel first, Canvas second */}
            <div className="lg:hidden order-1">
              <SettingsPanel />
            </div>
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Canvas />
            </div>
            <div className="hidden lg:block lg:col-span-1 order-3 lg:order-2">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
