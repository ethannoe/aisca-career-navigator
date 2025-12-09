// Cache system for GenAI API calls
// Implements local storage caching to avoid duplicate API calls

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

const CACHE_PREFIX = "aisca_cache_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate a simple hash from a string
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Get cached data
export function getCachedData<T>(key: string, inputData: string): T | null {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const inputHash = generateHash(inputData);
    
    // Check if cache is still valid
    const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRY_MS;
    const hashMatches = entry.hash === inputHash;
    
    if (!isExpired && hashMatches) {
      console.log(`[Cache] Hit for key: ${key}`);
      return entry.data;
    }
    
    console.log(`[Cache] Miss for key: ${key} (expired: ${isExpired}, hash match: ${hashMatches})`);
    return null;
  } catch (error) {
    console.error("[Cache] Error reading cache:", error);
    return null;
  }
}

// Set cached data
export function setCachedData<T>(key: string, inputData: string, data: T): void {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hash: generateHash(inputData),
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`[Cache] Stored data for key: ${key}`);
  } catch (error) {
    console.error("[Cache] Error writing cache:", error);
  }
}

// Clear all cached data
export function clearCache(): void {
  try {
    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    
    console.log(`[Cache] Cleared ${cleared} entries`);
  } catch (error) {
    console.error("[Cache] Error clearing cache:", error);
  }
}

// Get cache statistics
export function getCacheStats(): { entries: number; size: number } {
  try {
    const keys = Object.keys(localStorage);
    let entries = 0;
    let size = 0;
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        entries++;
        size += (localStorage.getItem(key) || "").length;
      }
    });
    
    return { entries, size };
  } catch (error) {
    console.error("[Cache] Error getting stats:", error);
    return { entries: 0, size: 0 };
  }
}
