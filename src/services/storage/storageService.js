/**
 * Basic localStorage wrapper with JSON serialization
 */

export function get(key) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item);
  } catch {
    return null;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Handle QuotaExceededError specifically
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error(`[Storage] Quota exceeded when saving ${key}. Clearing old data...`);
      // Try to clear cache and retry
      try {
        // Clear question cache first (least critical data)
        localStorage.removeItem('questionCache');
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`[Storage] Successfully saved ${key} after clearing cache`);
        return true;
      } catch (retryError) {
        console.error(`[Storage] Still failed after clearing cache:`, retryError);
        return false;
      }
    }
    console.error(`[Storage] Failed to save ${key}:`, error);
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error(`Failed to remove ${key} from localStorage`);
  }
}

export function has(key) {
  return localStorage.getItem(key) !== null;
}

export default {
  get,
  set,
  remove,
  has
};
