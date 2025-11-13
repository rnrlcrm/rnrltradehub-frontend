/**
 * Draft Management Service
 * 
 * Automatically saves form data to localStorage to prevent data loss
 * Implements auto-save functionality with expiration
 */

import { CommodityFormData } from '../schemas/settingsSchemas';

const DRAFT_KEY_PREFIX = 'commodity_draft_';
const DRAFT_EXPIRY_HOURS = 24; // Drafts expire after 24 hours

export interface CommodityDraft {
  id: string;
  commodityId?: number; // undefined for new commodity, set for editing
  formData: CommodityFormData;
  savedAt: string;
  expiresAt: string;
}

/**
 * Draft Management Service
 */
export class DraftManager {
  /**
   * Save a draft to localStorage
   */
  static saveDraft(
    formData: CommodityFormData,
    commodityId?: number
  ): void {
    try {
      const draftId = commodityId ? `edit_${commodityId}` : 'new';
      const now = new Date();
      const expiresAt = new Date(now.getTime() + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000);

      const draft: CommodityDraft = {
        id: draftId,
        commodityId,
        formData,
        savedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(
        `${DRAFT_KEY_PREFIX}${draftId}`,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Silently fail - don't disrupt user experience
    }
  }

  /**
   * Load a draft from localStorage
   */
  static loadDraft(commodityId?: number): CommodityDraft | null {
    try {
      const draftId = commodityId ? `edit_${commodityId}` : 'new';
      const draftJson = localStorage.getItem(`${DRAFT_KEY_PREFIX}${draftId}`);

      if (!draftJson) return null;

      const draft: CommodityDraft = JSON.parse(draftJson);

      // Check if draft has expired
      if (new Date(draft.expiresAt) < new Date()) {
        this.deleteDraft(commodityId);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Delete a draft from localStorage
   */
  static deleteDraft(commodityId?: number): void {
    try {
      const draftId = commodityId ? `edit_${commodityId}` : 'new';
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${draftId}`);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }

  /**
   * Check if a draft exists
   */
  static hasDraft(commodityId?: number): boolean {
    return this.loadDraft(commodityId) !== null;
  }

  /**
   * Get all drafts (for cleanup or listing)
   */
  static getAllDrafts(): CommodityDraft[] {
    const drafts: CommodityDraft[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
          const draftJson = localStorage.getItem(key);
          if (draftJson) {
            try {
              const draft: CommodityDraft = JSON.parse(draftJson);
              drafts.push(draft);
            } catch {
              // Skip invalid drafts
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all drafts:', error);
    }

    return drafts;
  }

  /**
   * Clean up expired drafts
   */
  static cleanupExpiredDrafts(): void {
    try {
      const now = new Date();
      const keys: string[] = [];

      // Collect keys to delete
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
          keys.push(key);
        }
      }

      // Delete expired drafts
      keys.forEach(key => {
        try {
          const draftJson = localStorage.getItem(key);
          if (draftJson) {
            const draft: CommodityDraft = JSON.parse(draftJson);
            if (new Date(draft.expiresAt) < now) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Remove invalid drafts
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error);
    }
  }

  /**
   * Get draft age in minutes
   */
  static getDraftAge(commodityId?: number): number | null {
    const draft = this.loadDraft(commodityId);
    if (!draft) return null;

    const savedAt = new Date(draft.savedAt);
    const now = new Date();
    const ageMs = now.getTime() - savedAt.getTime();
    return Math.floor(ageMs / (1000 * 60)); // Convert to minutes
  }
}

/**
 * Auto-save hook for use in forms
 */
export const useAutoSave = (
  formData: CommodityFormData,
  commodityId?: number,
  debounceMs: number = 2000
) => {
  let timeoutId: NodeJS.Timeout;

  const autoSave = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      DraftManager.saveDraft(formData, commodityId);
    }, debounceMs);
  };

  return { autoSave };
};
