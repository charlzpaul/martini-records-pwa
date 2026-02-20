// src/features/dashboard/QuickActions.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FilePlus2, PlusCircle, UserPlus, PackagePlus } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  const handleCreateTemplate = () => {
    navigate('/template/new');
  };

  const handleCreateInvoice = () => {
    navigate('/invoice/new');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" size="lg" onClick={handleCreateInvoice}>
          <FilePlus2 className="mr-2 h-4 w-4" /> Create New Invoice
        </Button>
        <Button variant="outline" size="lg" onClick={handleCreateTemplate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
        </Button>
        <Button variant="outline" size="lg" onClick={() => console.log('Add Customer clicked')}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
        <Button variant="outline" size="lg" onClick={() => console.log('Add Product clicked')}>
          <PackagePlus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
    </div>
  );
}
