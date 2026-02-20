# Martini Shot Invoices - Project Status & Roadmap

**Instructions for AI Agents:** This document is the single source of truth for the project's progress. Before starting any work, review this file to understand the current state. **After completing any significant task (e.g., creating a new component, adding a library, implementing a feature), you MUST update this file to reflect the changes.** This includes checking off completed tasks and adding notes where necessary.

---

## Overall Objective

Build an offline-first, industry-leading Progressive Web App (PWA) for generating custom invoices using React, TypeScript, Tailwind CSS, Zustand, and IndexedDB. The app will feature a template builder, customer/product management, dynamic invoice generation, PDF export, and Google Drive synchronization.

---

## Current Progress

### **Phase 1: Project Setup & Database Layer** `[COMPLETED]`

- [x] **Project Scaffolding:** Initialized a new project using Vite with the React + TypeScript template.
- [x] **Styling:** Installed and configured Tailwind CSS. Manually created `tailwind.config.js` and `postcss.config.js`. Added base styles and directives to `src/index.css`.
- [x] **Core Dependencies:** Installed `localforage`.
- [x] **Folder Structure:** Created a scalable folder structure separating `app`, `components`, `constants`, `db`, `features`, `hooks`, `lib`, and `store`.
- [x] **Data Models:** Defined all core TypeScript interfaces (`Template`, `Customer`, `Product`, `Invoice`, `GeneratedPDF`, etc.) in `src/db/models.ts`.
- [x] **Database Store:** Configured `localforage` instances for each data model in `src/db/store.ts`, including a `metaStore` for application flags.
- [x] **Database API:** Created a full CRUD abstraction layer in `src/db/api.ts` to handle all interactions with IndexedDB.
- [x] **Data Seeding:** Implemented seeding logic in `src/db/seed.ts` to populate the database with initial data on first load. This is triggered in `src/App.tsx`.

### **Phase 2: State Management & Dashboard UI** `[COMPLETED]`

- [x] **State Management:** Installed `zustand` and created a global store in `src/store/useStore.ts`.
- [x] **UI Framework:** Fully configured `shadcn/ui` by setting up `components.json`, path aliases in `tsconfig.app.json`, `vite.config.ts`, and installing necessary dependencies (`lucide-react`, `tailwindcss-animate`, `clsx`, `tailwind-merge`).
- [x] **UI Components:** Added `Button`, `Card`, and `Badge` from `shadcn/ui`.
- [x] **Data Fetching:** The `zustand` store now fetches all data from the database API on application load.
- [x] **Dashboard Page:** Created the main `DashboardPage` at `src/features/dashboard/DashboardPage.tsx`.
- [x] **Quick Actions:** Built the `QuickActions.tsx` component with placeholder buttons for creating new items.
- [x] **Combined Feed:**
    - Implemented logic in the `zustand` store to merge invoices, templates, and PDFs into a single, sorted feed.
    - Created `FeedList.tsx` and `FeedItem.tsx` to render the feed.
    - Each item in the feed has a distinct visual style and icon based on its type (`Invoice` (Draft/Locked), `Template`, `PDF`).
- [x] **App Integration:** The `DashboardPage` is now the main component rendered in `App.tsx`.

---

## Remaining Phases & Tasks

### **Phase 3: Template Builder (The Canvas & Engine)** `[COMPLETED]`

- [x] **Dependencies:** Install a drag-and-drop library (e.g., `react-dnd` or `dnd-kit`).
- [x] **Routing:** Set up a basic router (e.g., `react-router-dom`) to navigate to the template builder page.
- [x] **Builder Page:** Create the main page component at `src/features/template-builder/TemplateBuilderPage.tsx`.
- [x] **Canvas Component:**
    - [x] Create `src/features/template-builder/components/Canvas.tsx`.
    - [x] The canvas `div` should dynamically resize based on the selected `paperSize` ('A4'/'Letter').
    - [x] It should visually represent the `lineItemArea`.
- [x] **Image Handling:**
    - [x] Implement a file input to upload images. Convert images to `base64` and store them in the template's state.
    - [x] Make images draggable and resizable on the canvas.
    - [x] Implement opacity controls for selected images.
- [x] **Label Handling:**
    - [x] Make labels draggable.
    - [x] Allow inline editing of a label's `textValue`.
    - [x] Implement toggles to control the visibility of default labels (Subtotal, Total, etc.).
- [x] **Layer Management:**
    - [x] Create a side panel component `src/features/template-builder/components/LayerList.tsx`.
    - [x] List all images and labels in the side panel.
    - [x] Clicking an item in the list should select the corresponding element on the canvas.
- [x] **State & Saving:**
    - [x] Create a new `zustand` slice/store for managing the state of the template being edited.
    - [x] Implement "Save" logic to update the template in the database via `db/api.ts`.
    - [x] Implement "Save a Copy" logic to create a new template record.
- [x] **Preview Action:** Add a "Preview" button that (for now) opens a modal and will later contain the PDF preview.

### **Phase 4: Invoice Builder Screen** `[COMPLETED]`

- [x] **Routing:** Add a route for the invoice builder page.
- [x] **Builder Page:** Create `src/features/invoice-builder/InvoiceBuilderPage.tsx`.
- [x] **State Management:** Create a `zustand` store/slice for the invoice builder, including logic for unsaved changes.
- [x] **Header Form:**
    - Build the form for selecting a `Customer` and `Template`.
    - Implement an autocomplete input for `Customer` selection that queries the database.
    - Add a prompt to save a new customer if they don't exist.
- [x] **Line Items Table:**
    - Build a dynamic table for `lineItems`.
    - Implement an autocomplete (`@` mention style) for `Product` selection.
    - Automatically calculate the `amount` for each line (`rate * qty`).
    - Recalculate `Subtotal`, `Tax`, and `GrandTotal` whenever line items change.
- [x] **Saving Logic:**
    - Implement the "Save Copy" button.
    - Implement the unsaved changes navigation guard.
- [x] **Validation:** Prevent saving if `Customer` or `Template` are not selected.

### **Phase 5: PDF Generation & Cloud Sync** `[COMPLETED]`

- [x] **PDF Generation:**
    - Install `@react-pdf/renderer`.
    - Create a PDF document component (`src/features/pdf/InvoiceDocument.tsx`) that takes invoice data and renders it according to a template's structure.
    - Implement the "Generate PDF" action on the Invoice Builder screen.
        - This action should change the invoice `status` to `LOCKED`.
        - It should render the PDF to a `Blob`.
        - Save the `Blob` to IndexedDB by creating a `GeneratedPDF` record using `db/api.ts`.
- [x] **Immutability:** Once an invoice is `LOCKED`, disable editing features and force the user to "Save a Copy" to make further changes.
- [x] **Sharing:** Use the `navigator.share` API to open the system's share sheet with the generated PDF file.
- [x] **Google Drive Sync (Authentication):**
    - Install Google Identity Services (`@react-oauth/google`).
    - Add a "Sign in with Google" button.
    - Manage user authentication state.
- [x] **Google Drive Sync (API Logic):**
    - Create `src/features/sync/driveApi.ts` to handle file uploads and downloads to a designated app folder in Google Drive.
    - Implement a debounced background sync that triggers on any local database change.
    - On app load, check for a newer version of the data file on Google Drive and merge changes if necessary.
- [x] **Auth Persistence:** Store auth state in localStorage using Zustand persist middleware.
- [x] **PDF Blob Handling:** Handle PDF blobs separately in sync logic since they can't be serialized to JSON.
- [x] **Data Change Notifications:** Add notifyDataChange() calls to invoice and template stores.
- [x] **Environment Configuration:** Add .env.example and update main.tsx to use VITE_GOOGLE_CLIENT_ID.
