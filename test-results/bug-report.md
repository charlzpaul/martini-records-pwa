# Bug Report - Invoice PW App Testing

**Date**: 2026-02-20  
**Test Environment**: iPhone 14 Pro Max (430x932px), Headful Mode  
**Base URL**: http://localhost:5173

---

## Issues Found

### 1. Template Builder - Infinite Loop Error ⚠️ CRITICAL

**Severity**: CRITICAL  
**Component**: `src/features/template-builder/components/DraggableImage.tsx`

**Description**: 
The Template Builder page crashes with a React error: "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate."

**Error Details**:
```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

**Affected Component**: `DraggableImage`

**Location**: 
- `src/features/template-builder/components/DraggableImage.tsx`

**Root Cause**: 
Likely an infinite loop in `useEffect` or `useState` hooks causing repeated re-renders.

**Steps to Reproduce**:
1. Navigate to Template Builder page
2. Click "Create New Template" button
3. Page crashes with infinite loop error

**Screenshot**: `test-results/template-builder-page.png`

---

### 2. Dashboard - Empty Content Display

**Severity**: HIGH  
**Component**: `src/features/dashboard/DashboardPage.tsx`

**Description**: 
The Dashboard page appears to be empty or not rendering content properly. No feed items, stats, or action buttons are visible.

**Expected Behavior**: 
Dashboard should display:
- Invoice summary statistics
- Recent invoices/feed items
- Quick action buttons

**Actual Behavior**: 
Page is blank or shows minimal content

**Screenshot**: `test-results/dashboard-page-full.png`

**Location**: 
- `src/features/dashboard/DashboardPage.tsx`

---

### 3. Sync Page - Empty Content Display

**Severity**: HIGH  
**Component**: `src/features/sync/GoogleAuth.tsx` or related sync components

**Description**: 
The Sync page appears to be empty or not rendering content properly. No sync status, Google Auth button, or data sync controls are visible.

**Expected Behavior**: 
Sync page should display:
- Google Auth button for login
- Sync status indicators
- Data sync controls

**Actual Behavior**: 
Page is blank or shows minimal content

**Screenshot**: `test-results/sync-page.png`

**Location**: 
- `src/features/sync/GoogleAuth.tsx`
- `src/features/sync/hooks/useDataSync.ts`

---

### 4. Customer Selection - No Data Available

**Severity**: MEDIUM  
**Component**: `src/features/invoice-builder/components/HeaderForm.tsx`

**Description**: 
When clicking "Select customer..." button, the customer selection dialog shows "No customer found." This indicates the database has no customer data.

**Expected Behavior**: 
- Either show a list of existing customers
- Or show an option to create a new customer

**Actual Behavior**: 
Dialog shows "No customer found."

**Location**: 
- `src/features/invoice-builder/components/HeaderForm.tsx`
- `src/db/seed.ts` (data seeding file)

**Screenshot**: `test-results/customer-selection-dialog.png`

**Recommendation**: 
Run the database seed script to populate initial data:
```bash
npm run seed
```

---

## Test Summary

| Feature | Status | Issues |
|---------|--------|--------|
| Homepage | ✅ PASS | None |
| Invoice Builder | ⚠️ PARTIAL | Customer selection shows no data |
| Template Builder | ❌ FAIL | Infinite loop error (CRITICAL) |
| Dashboard | ❌ FAIL | Empty content display |
| Sync | ❌ FAIL | Empty content display |

---

## Screenshots

1. [`homepage.png`](test-results/homepage.png) - Homepage with navigation buttons
2. [`homepage-full.png`](test-results/homepage-full.png) - Full homepage view
3. [`invoice-builder-page.png`](test-results/invoice-builder-page.png) - Invoice builder page
4. [`customer-selection-dialog.png`](test-results/customer-selection-dialog.png) - Customer selection dialog
5. [`template-builder-page.png`](test-results/template-builder-page.png) - Template builder page (with error)
6. [`dashboard-page.png`](test-results/dashboard-page.png) - Dashboard page
7. [`dashboard-page-full.png`](test-results/dashboard-page-full.png) - Full dashboard view
8. [`sync-page.png`](test-results/sync-page.png) - Sync page

---

## Recommendations

### Immediate Actions Required

1. **Fix DraggableImage Infinite Loop**
   - Review `src/features/template-builder/components/DraggableImage.tsx`
   - Check for circular dependencies in useEffect hooks
   - Add proper dependency arrays or use useRef for values that shouldn't trigger re-renders

2. **Fix Dashboard Rendering**
   - Review `src/features/dashboard/DashboardPage.tsx`
   - Check if data is being fetched properly
   - Verify state management in `src/store/useStore.ts`

3. **Fix Sync Page Rendering**
   - Review `src/features/sync/GoogleAuth.tsx`
   - Check authentication state management in `src/features/sync/store/useAuthStore.ts`
   - Verify sync hooks are properly connected

4. **Populate Database**
   - Run database seed script to add initial customers, products, and invoices
   - Verify data persistence in IndexedDB/local storage

### Additional Testing Needed

- [ ] Test PDF generation functionality
- [ ] Test form validation
- [ ] Test responsive design on various screen sizes
- [ ] Test navigation between all pages
- [ ] Test authentication flow (Sign in with Google)
