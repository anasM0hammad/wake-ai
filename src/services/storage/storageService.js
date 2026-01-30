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
  } catch {
    console.error(`Failed to save ${key} to localStorage`);
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
