import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { seedDatabaseIfNeeded, initializeLocalForage } from '@/db/seed';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TemplateBuilderPage } from '@/features/template-builder/TemplateBuilderPage';
import { InvoiceBuilderPage } from '@/features/invoice-builder/InvoiceBuilderPage';

function App() {
  // Run seed logic on startup
  useEffect(() => {
    async function init() {
      try {
        await initializeLocalForage();
        await seedDatabaseIfNeeded();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    }
    init();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/template/:id" element={<TemplateBuilderPage />} />
      <Route path="/invoice/:id" element={<InvoiceBuilderPage />} />
    </Routes>
  );
}

export default App;
