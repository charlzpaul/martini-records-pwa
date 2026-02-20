import { Routes, Route } from 'react-router-dom';
import { seedDatabaseIfNeeded } from '@/db/seed';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TemplateBuilderPage } from '@/features/template-builder/TemplateBuilderPage';
import { InvoiceBuilderPage } from '@/features/invoice-builder/InvoiceBuilderPage';

// Run seed logic on startup
seedDatabaseIfNeeded();

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/template/:id" element={<TemplateBuilderPage />} />
      <Route path="/invoice/:id" element={<InvoiceBuilderPage />} />
    </Routes>
  );
}

export default App;
