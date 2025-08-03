export interface PostDraft {
  content: string;
  category: string;
  tags: string[];
  timestamp: number;
}

const DRAFT_KEY = 'teaspill-post-draft';
const DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function saveDraft(draft: Omit<PostDraft, 'timestamp'>) {
  const draftWithTimestamp: PostDraft = {
    ...draft,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTimestamp));
  } catch (error) {
    console.warn('Failed to save draft:', error);
  }
}

export function loadDraft(): PostDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    
    const draft: PostDraft = JSON.parse(stored);
    
    // Check if draft has expired
    if (Date.now() - draft.timestamp > DRAFT_EXPIRY) {
      clearDraft();
      return null;
    }
    
    return draft;
  } catch (error) {
    console.warn('Failed to load draft:', error);
    clearDraft();
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn('Failed to clear draft:', error);
  }
}

export function hasDraft(): boolean {
  const draft = loadDraft();
  return draft !== null && (draft.content.trim() || draft.category || draft.tags.length > 0);
}