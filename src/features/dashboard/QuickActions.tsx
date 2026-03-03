// src/features/dashboard/QuickActions.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus2, PlusCircle, UserPlus, PackagePlus, Download } from "lucide-react";
import { toast } from 'sonner';
import { saveCustomer, saveProduct, getInvoices, getCustomers, getTemplates } from '@/db/api';
import { useStore } from '@/store/useStore';
import { convertInvoicesToCSV, downloadCSV } from '@/lib/exportUtils';

export function QuickActions() {
  const navigate = useNavigate();
  const fetchDashboardData = useStore((state) => state.fetchDashboardData);
  
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    taxId: ''
  });
  
  const [productForm, setProductForm] = useState({
    name: '',
    defaultRate: '',
    defaultQuantity: '1',
    unit: 'item' as 'hour' | 'item' | 'service'
  });

  const handleCreateTemplate = () => {
    navigate('/template/new');
  };

  const handleCreateRecord = () => {
    navigate('/invoice/new');
  };

  const handleAddCustomer = async () => {
    try {
      if (!customerForm.name.trim()) {
        toast.error('Validation Error', { description: 'Customer name is required' });
        return;
      }

      await saveCustomer({
        name: customerForm.name.trim(),
        address: customerForm.address.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        taxId: customerForm.taxId.trim() || undefined
      });

      toast.success('Customer Added', { description: `${customerForm.name} has been added successfully` });
      
      // Reset form
      setCustomerForm({
        name: '',
        address: '',
        email: '',
        phone: '',
        taxId: ''
      });
      
      setCustomerDialogOpen(false);
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error', { description: 'Failed to add customer' });
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!productForm.name.trim()) {
        toast.error('Validation Error', { description: 'Product name is required' });
        return;
      }

      const defaultRate = parseFloat(productForm.defaultRate);
      if (isNaN(defaultRate) || defaultRate < 0) {
        toast.error('Validation Error', { description: 'Please enter a valid rate' });
        return;
      }

      const defaultQuantity = parseFloat(productForm.defaultQuantity);
      if (isNaN(defaultQuantity) || defaultQuantity < 0) {
        toast.error('Validation Error', { description: 'Please enter a valid quantity' });
        return;
      }

      await saveProduct({
        name: productForm.name.trim(),
        defaultRate,
        defaultQuantity,
        unit: productForm.unit
      });

      toast.success('Product Added', { description: `${productForm.name} has been added successfully` });
      
      // Reset form
      setProductForm({
        name: '',
        defaultRate: '',
        defaultQuantity: '1',
        unit: 'item'
      });
      
      setProductDialogOpen(false);
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error', { description: 'Failed to add product' });
    }
  };

  const handleExportFinancials = async () => {
    try {
      const invoices = await getInvoices();
      const customers = await getCustomers();
      const templates = await getTemplates();
      
      if (invoices.length === 0) {
        toast.error('Export Error', { description: 'No records found to export' });
        return;
      }
      
      const csv = convertInvoicesToCSV(invoices, customers, templates);
      const fileName = `financials_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, fileName);
      
      toast.success('Export Successful', { description: 'Financials have been exported to CSV' });
    } catch (error) {
      console.error('Error exporting financials:', error);
      toast.error('Export Error', { description: 'Failed to export financials' });
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Button 
          variant="default" 
          size="lg" 
          className="px-3 md:px-8 bg-primary hover:bg-primary/90 shadow-md transition-all hover:shadow-lg active:scale-95 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
          onClick={handleCreateRecord}
          title="Create New Record (Alt+N)"
          aria-label="Create New Record"
        >
          <FilePlus2 className="h-5 w-5 mr-1" />
          <div className="flex flex-col items-start leading-tight">
            <span className="font-bold text-sm">Create Record</span>
            <span className="text-[10px] opacity-70 hidden md:inline">Alt+N</span>
          </div>
        </Button>
        <Button variant="outline" size="lg" className="px-3 md:px-8" onClick={handleCreateTemplate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>New Template</span>
        </Button>
        
        {/* Add Customer Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="px-3 md:px-8">
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Add Customer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="customer-name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Customer Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  className="col-span-3"
                  placeholder="customer@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="customer-phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="col-span-3"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-address" className="text-right">
                  Address
                </Label>
                <Textarea
                  id="customer-address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  className="col-span-3"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-taxId" className="text-right">
                  Tax ID
                </Label>
                <Input
                  id="customer-taxId"
                  value={customerForm.taxId}
                  onChange={(e) => setCustomerForm({...customerForm, taxId: e.target.value})}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Add Product Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="px-3 md:px-8">
              <PackagePlus className="h-4 w-4 mr-2" />
              <span>Add Product</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product/Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Product or Service Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-rate" className="text-right">
                  Default Rate *
                </Label>
                <Input
                  id="product-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.defaultRate}
                  onChange={(e) => setProductForm({...productForm, defaultRate: e.target.value})}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-quantity" className="text-right">
                  Default Quantity
                </Label>
                <Input
                  id="product-quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.defaultQuantity}
                  onChange={(e) => setProductForm({...productForm, defaultQuantity: e.target.value})}
                  className="col-span-3"
                  placeholder="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-unit" className="text-right">
                  Unit
                </Label>
                <Select value={productForm.unit} onValueChange={(value: 'hour' | 'item' | 'service') => setProductForm({...productForm, unit: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" size="lg" className="px-3 md:px-8" onClick={handleExportFinancials}>
          <Download className="h-4 w-4 mr-2" />
          <span>Export CSV</span>
        </Button>
      </div>
    </div>
  );
}
