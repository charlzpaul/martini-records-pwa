// src/features/template-builder/TemplateBuilderPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTemplateStore } from './store/useTemplateStore';
import { AppLayout } from '@/app/AppLayout';
import { Canvas } from './components/Canvas';
import { SettingsPanel } from './components/SettingsPanel';

export function TemplateBuilderPage() {
  const { id } = useParams<{ id:string }>();
  
  // Select state and actions from the store
  const { 
    activeTemplate, 
    loading, 
    error, 
    loadTemplate, 
    createNewTemplate 
  } = useTemplateStore();

  useEffect(() => {
    if (id) {
      if (id === 'new') {
        createNewTemplate();
      } else {
        loadTemplate(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Note: We remove store functions from deps to avoid re-triggering on every render

  return (
    <AppLayout>
      {loading && <p>Loading template...</p>}
      {error && <p className="text-destructive">Error: {error}</p>}
      {activeTemplate && (
        <div className="flex flex-col h-full">
          <header className="mb-4">
            <h1 className="text-3xl font-bold">Template Builder</h1>
            <p className="text-muted-foreground">Editing: {activeTemplate.name}</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow">
            <div className="md:col-span-2">
              <Canvas />
            </div>
            <div className="md:col-span-1">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
