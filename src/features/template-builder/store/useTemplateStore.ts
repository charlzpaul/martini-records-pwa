// src/features/template-builder/store/useTemplateStore.ts
import { create } from 'zustand';
import type { Template } from '@/db/models';
import * as dbApi from '@/db/api';
import { notifyDataChange } from '@/features/sync/hooks/useDataSync';

interface TemplateState {
  // The original template, as it exists in the database.
  originalTemplate: Template | null;
  // The working copy of the template that the user is editing.
  activeTemplate: Template | null;
  // ID of the currently selected canvas item (image or label).
  selectedItemId: string | null;
  
  loading: boolean;
  error: string | null;

  // --- Actions ---
  loadTemplate: (id: string) => Promise<void>;
  createNewTemplate: () => void;
  updateActiveTemplate: (data: Partial<Template>) => void;
  saveTemplate: () => Promise<any>;
  saveAsCopy: () => Promise<any>;
  setSelectedItemId: (id: string | null) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  originalTemplate: null,
  activeTemplate: null,
  selectedItemId: null,
  loading: false,
  error: null,

  loadTemplate: async (id: string) => {
    set({ loading: true, error: null, originalTemplate: null, activeTemplate: null, selectedItemId: null });
    try {
      const template = await dbApi.getTemplateById(id);
      if (template) {
        set({
          originalTemplate: template,
          activeTemplate: structuredClone(template),
          loading: false,
        });
      } else {
        throw new Error(`Template with id "${id}" not found.`);
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  createNewTemplate: () => {
    const now = new Date().toISOString();
    const newTemplate: Template = {
      id: 'new', // Temporary ID
      name: 'Untitled Template',
      paperSize: 'A4',
      images: [
        {
          id: 'placeholder-image-1',
          base64Data: 'data:image/gif;base64,R0lGODlhZABkAPQAAKyvrLq6uu/v79ra2uTk5OTk5Pf39/f39/j4+Pj4+Pn5+fr6+vv7+/v7+/z8/Pz8/P39/f39/f7+/v7+/v///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABIALAAAAABkAGQAAAX/ICSOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2Kx2y+16v+CweEwum8/otHrNbrvf8Lh8Tq/b7/i8fs/v+/+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dfr0wADAgQSBQMFBwzX29/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KVOhAkgYnSqq0qFGjSZMqXcq0qVOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOG7Cg8jZszIsKPHkCNLnky5suXLmDNr3sy5s+fPoEOLHk26tOnTqFOrXs26tevXsGPLnk27tu3buHPr3s27t+/fwIMLH068uPHjyJMrX868ufPn0KNLn069uvXr2LNr3869u/fv4MOL/x9Pvrz58+jTq1/Pvr379/Djy59Pv779+/jz69/Pv7///wABiOCABBZooIMHImio4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmjiiSimqOKKLLbo4oswxijjjDTWaOONOOao44489ujjj0AGKeSQRBZp5JFIJqnkkkw26eSTUEYp5ZRVVmnllVhmqeWWXHbp5ZdghinmmGSWaeaZaKap5ppstunmm3DGKeecdNZp55145qnnnnz26eefgAYq6KCEFmrooYgmquiijDbq6KOQRirppJRWaumlmGaq6aacdurpp6CGKuqopJZq6qmsubDKA6w01uhXrWjG6gCuPOi6K6/EFmvsscgmq+yyrN6qgK033irrrL7WausAsTbr6q/CFivttNRWa+212Gar7bbcduvtt+CGK+645JZr7rnopqvuuuy26+678MYr77z01mvvvfjmq+++/Pbr778AByzwwAQXbPDBCCes8MIMN+zwwxBHLPHEFFds8cUYZ6zxxhx37PHHIIcs8sgkl2zyySinrPLKLLfs8sswxyzzzDTXbPPNOOes88489+zzz0AHLfTQRBdt9NFIJ6300kw37fTTUEct9dRVV2311VhnrfXWXHft9ddghy322GSXbfbZaKet9tpst+3223DHLffcdNdt991456333nz37fffgAcu+OCEF2744YgnrvjijDfu+OOQRy755JRXbvnlmGeu+eacd+7556CHLvrnpAMBADs=',
          originalWidth: 100,
          originalHeight: 100,
          currentWidth: 100,
          currentHeight: 100,
          x: 50,
          y: 50,
          opacity: 1,
        }
      ],
      labels: [
        {
          id: 'placeholder-label-1',
          type: 'Custom',
          textValue: 'INVOICE',
          isVisible: true,
          x: 250,
          y: 50,
          fontSize: 24,
        }
      ],
      lineItemArea: { y: 250, height: 400 },
      createdAt: now,
      updatedAt: now,
    };
    set({
      originalTemplate: null, // No original, it's new
      activeTemplate: newTemplate,
      loading: false,
      error: null,
    });
  },

  updateActiveTemplate: (data: Partial<Template>) => {
    set((state) => ({
      activeTemplate: state.activeTemplate
        ? { ...state.activeTemplate, ...data, updatedAt: new Date().toISOString() }
        : null,
    }));
  },

  saveTemplate: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const isNew = activeTemplate.id === 'new';
      const payload = { ...activeTemplate };
      if (isNew) {
        const { id, ...rest } = payload;
        const savedTemplate = await dbApi.saveTemplate(rest);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false });
        notifyDataChange();
        return savedTemplate;
      } else {
        const savedTemplate = await dbApi.saveTemplate(payload);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false });
        notifyDataChange();
        return savedTemplate;
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save template.' });
      throw err;
    }
  },

  saveAsCopy: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const { id, ...rest } = activeTemplate;
      const newName = `${rest.name} (Copy)`;
      const savedTemplate = await dbApi.saveTemplate({ ...rest, name: newName });
      set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false });
      notifyDataChange();
      return savedTemplate;
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save copy.' });
      throw err;
    }
  },

  setSelectedItemId: (id: string | null) => {
    set({ selectedItemId: id });
  },
}));
