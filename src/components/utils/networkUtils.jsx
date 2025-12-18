// Network utilities for handling connectivity issues
export class NetworkManager {
  static retryCount = new Map();
  static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  static lastSuccessfulRequest = Date.now();
  static listenersAdded = false;

  static initializeListeners() {
    if (typeof window === 'undefined' || this.listenersAdded) return;
    
    this.listenersAdded = true;
    
    window.addEventListener('online', () => {
      NetworkManager.isOnline = true;
      console.log('Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      NetworkManager.isOnline = false;
      console.log('Network connection lost');
    });
  }

  static async retryWithBackoff(fn, options = {}) {
    // Initialize listeners on first use
    if (!this.listenersAdded) {
      this.initializeListeners();
    }

    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      exponential = true,
      jitter = true
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network connectivity before attempting
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('No internet connection');
        }

        const result = await fn();
        
        // Success - reset tracking
        this.lastSuccessfulRequest = Date.now();
        return result;

      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error.message);
        
        // Don't retry if we've exhausted attempts
        if (attempt === maxRetries) {
          break;
        }
        
        // Don't retry non-network errors (like 401, 403)
        const isNetworkError = 
          error.message?.includes('network') ||
          error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('Failed to fetch') ||
          error.name === 'TypeError' ||
          (typeof navigator !== 'undefined' && !navigator.onLine);

        if (!isNetworkError && error.response?.status < 500) {
          // Client errors (4xx) shouldn't be retried
          break;
        }
        
        // Calculate delay with exponential backoff
        let delay = baseDelay;
        if (exponential) {
          delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        }
        
        // Add jitter to prevent thundering herd
        if (jitter) {
          delay += Math.random() * 1000;
        }
        
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed, throw the last error
    throw lastError || new Error('Request failed after retries');
  }

  static clearRetryHistory() {
    this.retryCount.clear();
    this.lastSuccessfulRequest = Date.now();
  }
}

// Enhanced entity wrapper with caching
export class CachedEntityManager {
  static cache = new Map();
  static cacheTimestamps = new Map();
  static CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static async get(entityClass, method, params = [], cacheKey = null) {
    const key = cacheKey || `${entityClass.name}_${method}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);
    
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
      console.log(`Cache hit for ${key}`);
      return cached;
    }

    // Cache miss - fetch with retry
    try {
      const result = await NetworkManager.retryWithBackoff(
        () => entityClass[method](...params),
        { cacheKey: key }
      );
      
      // Cache the result
      this.cache.set(key, result);
      this.cacheTimestamps.set(key, Date.now());
      
      return result;
    } catch (error) {
      // If we have stale cache, return it as fallback
      if (cached && timestamp) {
        console.log(`Using stale cache for ${key} due to network error`);
        return cached;
      }
      throw error;
    }
  }

  static clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.cacheTimestamps.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }

  static invalidate(pattern = null) {
    this.clearCache(pattern);
  }

  static getCacheStats() {
    const timestamps = Array.from(this.cacheTimestamps.values());
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  static clearAllCaches() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}