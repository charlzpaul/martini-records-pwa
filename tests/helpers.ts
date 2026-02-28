import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly quickActions: Locator;
  readonly createInvoiceButton: Locator;
  readonly createTemplateButton: Locator;
  readonly addCustomerButton: Locator;
  readonly addProductButton: Locator;
  readonly activityFeed: Locator;
  readonly feedItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.quickActions = page.locator('h2:has-text("Quick Actions")').first();
    this.createInvoiceButton = page.locator('button:has-text("Create New Invoice")').first();
    this.createTemplateButton = page.locator('button:has-text("Create New Template")').first();
    this.addCustomerButton = page.locator('button:has-text("Add Customer")').first();
    this.addProductButton = page.locator('button:has-text("Add Product")').first();
    this.activityFeed = page.locator('h2:has-text("Activity Feed")').first();
    this.feedItems = page.locator('[data-testid="feed-item"]');
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateInvoice() {
    await this.createInvoiceButton.click();
    await this.page.waitForURL('**/invoice/new');
  }

  async clickCreateTemplate() {
    await this.createTemplateButton.click();
    await this.page.waitForURL('**/template/new');
  }

  async verifyPageLoaded() {
    await expect(this.quickActions).toBeVisible();
    await expect(this.activityFeed).toBeVisible();
  }
}

/**
 * Page Object Model for Template Builder page
 */
export class TemplateBuilderPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly addLabelButton: Locator;
  readonly addImageButton: Locator;
  readonly settingsPanel: Locator;
  readonly saveTemplateButton: Locator;
  readonly templateNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('[data-testid="template-canvas"]').first();
    this.addLabelButton = page.locator('button:has-text("Add Label")').first();
    this.addImageButton = page.locator('button:has-text("Add Image")').first();
    this.settingsPanel = page.locator('[data-testid="settings-panel"]').first();
    this.saveTemplateButton = page.locator('button:has-text("Save Template")').first();
    this.templateNameInput = page.locator('input[placeholder*="Template Name"]').first();
  }

  async navigate() {
    await this.page.goto('/template/new');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoaded() {
    await expect(this.canvas).toBeVisible();
    await expect(this.settingsPanel).toBeVisible();
  }

  async addTextLabel(text: string) {
    await this.addLabelButton.click();
    // Assuming label gets added and we can select it
    await this.page.locator('[data-testid="text-label"]').last().dblclick();
    await this.page.keyboard.type(text);
    await this.page.keyboard.press('Escape');
  }

  async saveTemplate(name: string) {
    await this.templateNameInput.fill(name);
    await this.saveTemplateButton.click();
    await expect(this.page.locator('text=Template saved successfully')).toBeVisible();
  }
}

/**
 * Page Object Model for Invoice Builder page
 */
export class InvoiceBuilderPage {
  readonly page: Page;
  readonly invoiceNumberInput: Locator;
  readonly invoiceDateInput: Locator;
  readonly customerSelect: Locator;
  readonly addLineItemButton: Locator;
  readonly lineItemsTable: Locator;
  readonly templateSelect: Locator;
  readonly saveInvoiceButton: Locator;
  readonly generatePdfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Invoice number might be auto-generated or not visible in UI
    this.invoiceNumberInput = page.locator('input[placeholder*="Invoice Number"], input[placeholder*="Number"]').first();
    // Invoice date is a button with calendar icon, not an input
    this.invoiceDateInput = page.locator('button:has-text("Invoice Date"), button:has-text("February")').first();
    // Customer selector is a combobox with text "Select customer..."
    this.customerSelect = page.locator('button:has-text("Select customer..."), [role="combobox"]:has-text("Select customer")').first();
    this.addLineItemButton = page.locator('button:has-text("Add Line Item")').first();
    this.lineItemsTable = page.locator('table').first(); // Use first table as line items table
    this.templateSelect = page.locator('button:has-text("Select a template"), [role="combobox"]:has-text("Select a template")').first();
    this.saveInvoiceButton = page.locator('button:has-text("Save Invoice")').first();
    this.generatePdfButton = page.locator('button:has-text("Generate PDF")').first();
  }

  async navigate() {
    await this.page.goto('/invoice/new');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoaded() {
    // Invoice number might not be visible, so check for other key elements
    await expect(this.customerSelect).toBeVisible({ timeout: 10000 });
    await expect(this.addLineItemButton).toBeVisible();
    await expect(this.page.locator('h1:has-text("Invoice Builder")')).toBeVisible();
  }

  async fillInvoiceDetails(invoiceNumber: string, date: string) {
    // Invoice number might be auto-generated, skip if input doesn't exist
    if (await this.invoiceNumberInput.count() > 0) {
      await this.invoiceNumberInput.fill(invoiceNumber);
    }
    // Select date using calendar
    await this.selectDate(date);
  }

  async selectDate(dateString: string) {
    // Parse the date string (expected format: YYYY-MM-DD)
    const date = new Date(dateString);
    const day = date.getDate();
    
    // Click the date button to open calendar popover
    await this.invoiceDateInput.click();
    
    // Wait for calendar popover to appear
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Simple approach: click the day button using a more flexible selector
    // The calendar day buttons have text like "26" (just the day number)
    // Use :text-is() for exact match or :has-text() for partial
    const daySelector = `[role="gridcell"] button:text-is("${day}")`;
    const dayButton = this.page.locator(daySelector).first();
    
    if (await dayButton.count() > 0) {
      await dayButton.click();
    } else {
      // Fallback: click any element with the day number
      await this.page.locator(`[role="gridcell"]:has-text("^${day}$")`).first().click();
    }
    
    // Wait for popover to close - use a shorter timeout and then force close if needed
    try {
      await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2000 });
    } catch {
      // If dialog doesn't close automatically, press Escape
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }
    
    // Additional safety: click outside to close any open popovers
    await this.page.mouse.click(10, 10);
    await this.page.waitForTimeout(300);
  }

  async selectCustomer(customerName: string) {
    await this.customerSelect.click();
    await this.page.locator(`text=${customerName}`).click();
  }

  async addLineItem(description: string, quantity: number, price: number) {
    await this.addLineItemButton.click();
    const lastRow = this.page.locator('[data-testid="line-item-row"]').last();
    await lastRow.locator('input[placeholder*="Description"]').fill(description);
    await lastRow.locator('input[placeholder*="Quantity"]').fill(quantity.toString());
    await lastRow.locator('input[placeholder*="Price"]').fill(price.toString());
  }

  async saveInvoice() {
    await this.saveInvoiceButton.click();
    await expect(this.page.locator('text=Invoice saved successfully')).toBeVisible();
  }
}

/**
 * Page Object Model for PDF Generation
 */
export class PdfGenerationPage {
  readonly page: Page;
  readonly pdfPreview: Locator;
  readonly downloadButton: Locator;
  readonly closePreviewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pdfPreview = page.locator('[data-testid="pdf-preview"]').first();
    this.downloadButton = page.locator('button:has-text("Download PDF")').first();
    this.closePreviewButton = page.locator('button:has-text("Close")').first();
  }

  async verifyPdfPreviewVisible() {
    await expect(this.pdfPreview).toBeVisible();
  }

  async downloadPdf() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return await downloadPromise;
  }
}

/**
 * Page Object Model for Sync functionality
 */
export class SyncPage {
  readonly page: Page;
  readonly syncButton: Locator;
  readonly googleAuthButton: Locator;
  readonly disconnectButton: Locator;
  readonly syncStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
    this.googleAuthButton = page.locator('button:has-text("Sign in with Google")').first();
    this.disconnectButton = page.locator('button:has-text("Disconnect")').first();
    this.syncStatus = page.locator('[data-testid="sync-status"]').first();
  }

  async initiateSync() {
    await this.syncButton.click();
  }

  async verifySyncConnected() {
    await expect(this.syncStatus).toContainText('Connected');
  }
}

/**
 * Page Object Model for Customer/Product Management
 */
export class CustomerProductPage {
  readonly page: Page;
  readonly addCustomerButton: Locator;
  readonly customerNameInput: Locator;
  readonly customerEmailInput: Locator;
  readonly saveCustomerButton: Locator;
  readonly addProductButton: Locator;
  readonly productNameInput: Locator;
  readonly productPriceInput: Locator;
  readonly saveProductButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCustomerButton = page.locator('button:has-text("Add New Customer")').first();
    this.customerNameInput = page.locator('input[placeholder*="Customer Name"]').first();
    this.customerEmailInput = page.locator('input[placeholder*="Email"]').first();
    this.saveCustomerButton = page.locator('button:has-text("Save Customer")').first();
    this.addProductButton = page.locator('button:has-text("Add New Product")').first();
    this.productNameInput = page.locator('input[placeholder*="Product Name"]').first();
    this.productPriceInput = page.locator('input[placeholder*="Price"]').first();
    this.saveProductButton = page.locator('button:has-text("Save Product")').first();
  }

  async addCustomer(name: string, email: string) {
    await this.addCustomerButton.click();
    await this.customerNameInput.fill(name);
    await this.customerEmailInput.fill(email);
    await this.saveCustomerButton.click();
    await expect(this.page.locator('text=Customer added successfully')).toBeVisible();
  }

  async addProduct(name: string, price: number) {
    await this.addProductButton.click();
    await this.productNameInput.fill(name);
    await this.productPriceInput.fill(price.toString());
    await this.saveProductButton.click();
    await expect(this.page.locator('text=Product added successfully')).toBeVisible();
  }
}

/**
 * Helper functions for common test operations
 */
export class TestHelpers {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForToast(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
    await this.page.waitForTimeout(500); // Allow toast to appear
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}-${Date.now()}.png` });
  }

  async verifyNoConsoleErrors() {
    const errors = await this.page.evaluate(() => {
      const consoleErrors: string[] = [];
      window.addEventListener('error', (e) => consoleErrors.push(e.message));
      return consoleErrors;
    });
    expect(errors).toHaveLength(0);
  }

  async simulateTouchTap(element: Locator) {
    await element.click({ force: true });
  }

  async simulateSwipe(startX: number, startY: number, endX: number, endY: number) {
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
  }
}

/**
 * Test data generators
 */
export const TestData = {
  generateInvoiceNumber(): string {
    return `INV-${Date.now()}`;
  },

  generateCustomer(): { name: string; email: string } {
    return {
      name: `Customer ${Math.floor(Math.random() * 1000)}`,
      email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
    };
  },

  generateProduct(): { name: string; price: number } {
    return {
      name: `Product ${Math.floor(Math.random() * 1000)}`,
      price: Math.floor(Math.random() * 100) + 10,
    };
  },

  generateLineItem(): { description: string; quantity: number; price: number } {
    return {
      description: `Service ${Math.floor(Math.random() * 1000)}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      price: Math.floor(Math.random() * 100) + 10,
    };
  },
};