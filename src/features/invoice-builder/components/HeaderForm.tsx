// src/features/invoice-builder/components/HeaderForm.tsx
import { useStore } from '@/store/useStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useState } from 'react';
import { format } from "date-fns"

export function HeaderForm() {
  const { customers, templates, fetchDashboardData } = useStore();
  const { activeInvoice, updateActiveInvoice } = useInvoiceStore();
  
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

  useEffect(() => {
    // Ensure customers and templates are loaded
    if (customers.length === 0 || templates.length === 0) {
      fetchDashboardData();
    }
  }, [customers.length, templates.length, fetchDashboardData]);

  if (!activeInvoice) return null;

  const selectedCustomer = customers.find(c => c.id === activeInvoice.customerId);
  const selectedTemplate = templates.find(t => t.id === activeInvoice.templateId);

  return (
    <div className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Customer Selector */}
      <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerPopoverOpen}
                className="w-full justify-between"
              >
                {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search customer..." />
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.name}
                      onSelect={() => {
                        updateActiveInvoice({ customerId: customer.id });
                        setCustomerPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          activeInvoice.customerId === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
      </div>

      {/* Template Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Template</label>
        <Select
          value={activeInvoice.templateId}
          onValueChange={(value) => updateActiveInvoice({ templateId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Invoice Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !activeInvoice.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {activeInvoice.date ? format(new Date(activeInvoice.date), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(activeInvoice.date)}
              onSelect={(date) => updateActiveInvoice({ date: date?.toISOString() || '' })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
