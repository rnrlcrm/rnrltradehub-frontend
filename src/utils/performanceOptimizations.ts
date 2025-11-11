/**
 * Performance Optimization Utilities
 * Phase 4: Virtual scrolling, code splitting, caching strategies
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ============================================
// 1. VIRTUAL SCROLLING
// ============================================

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  visibleItems: number[];
  containerStyle: React.CSSProperties;
  scrollHandler: (e: React.UIEvent<HTMLDivElement>) => void;
  totalHeight: number;
}

/**
 * Virtual scrolling for large lists
 * Renders only visible items + overscan for smooth scrolling
 */
export function useVirtualScroll(
  totalItems: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(totalItems, visibleEnd + overscan);

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push(i);
    }
    return items;
  }, [startIndex, endIndex]);

  const totalHeight = totalItems * itemHeight;

  const containerStyle: React.CSSProperties = {
    height: containerHeight,
    overflow: 'auto',
    position: 'relative',
  };

  const scrollHandler = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    containerStyle,
    scrollHandler,
    totalHeight,
  };
}

/**
 * Virtual table row component props
 */
export interface VirtualRowProps {
  index: number;
  style: React.CSSProperties;
  data: any;
}

/**
 * Get style for virtual row
 */
export function getVirtualRowStyle(
  index: number,
  itemHeight: number,
  startIndex: number
): React.CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: itemHeight,
    transform: `translateY(${(startIndex + index) * itemHeight}px)`,
  };
}

// ============================================
// 2. CODE SPLITTING & LAZY LOADING
// ============================================

/**
 * Preload a lazy-loaded component
 */
export function preloadComponent(
  componentLoader: () => Promise<any>
): Promise<any> {
  return componentLoader();
}

/**
 * Lazy load with retry logic
 */
export function lazyWithRetry(
  componentLoader: () => Promise<any>,
  retries = 3
): Promise<any> {
  return new Promise((resolve, reject) => {
    componentLoader()
      .then(resolve)
      .catch((error) => {
        if (retries > 0) {
          setTimeout(() => {
            lazyWithRetry(componentLoader, retries - 1).then(resolve, reject);
          }, 1000);
        } else {
          reject(error);
        }
      });
  });
}

/**
 * Route-based code splitting configuration
 */
export const routeSplitConfig = {
  // Core routes - load immediately
  core: ['/', '/login', '/dashboard'],
  
  // Settings routes - preload on dashboard
  settings: [
    '/settings',
    '/settings/master-data',
    '/settings/organizations',
    '/settings/gst-rates',
    '/settings/locations',
    '/settings/commissions',
    '/settings/cci-terms',
    '/settings/structured-terms',
    '/settings/fy-management',
  ],
  
  // Sales routes - lazy load
  sales: [
    '/sales/contracts',
    '/sales/contracts/new',
    '/sales/contracts/:id',
  ],
  
  // Reports - lazy load on demand
  reports: ['/reports', '/reports/analytics', '/reports/export'],
};

// ============================================
// 3. CACHING STRATEGIES
// ============================================

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  staleWhileRevalidate?: boolean;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      staleWhileRevalidate: options.staleWhileRevalidate ?? true,
    };
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > this.options.ttl;
    
    if (isExpired && !this.options.staleWhileRevalidate) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Check if item is in cache and not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() - item.timestamp > this.options.ttl;
    return !isExpired;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Global cache instances
 */
export const apiCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
});

export const masterDataCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes (master data changes rarely)
  maxSize: 50,
  staleWhileRevalidate: true,
});

export const analyticsCache = new MemoryCache({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 20,
  staleWhileRevalidate: true,
});

/**
 * React hook for cached data fetching
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: MemoryCache<T> = apiCache
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(cache.get(key));
  const [loading, setLoading] = useState(!cache.has(key));
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      cache.set(key, result);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache]);

  useEffect(() => {
    if (!cache.has(key)) {
      fetchData();
    }
  }, [key, cache, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// 4. DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * React hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// 5. LAZY IMAGES
// ============================================

/**
 * Intersection Observer for lazy loading
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}

// ============================================
// 6. WEB WORKERS
// ============================================

/**
 * Create web worker for heavy computations
 */
export function createWorker(workerFunction: Function): Worker {
  const code = workerFunction.toString();
  const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

/**
 * Use web worker hook
 */
export function useWebWorker<T, R>(
  workerFn: (data: T) => R
): {
  run: (data: T) => Promise<R>;
  isRunning: boolean;
  error: Error | null;
} {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const run = useCallback(
    (data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        try {
          setIsRunning(true);
          setError(null);

          // Create worker if not exists
          if (!workerRef.current) {
            workerRef.current = createWorker(workerFn);
          }

          const worker = workerRef.current;

          worker.onmessage = (e: MessageEvent) => {
            setIsRunning(false);
            resolve(e.data);
          };

          worker.onerror = (e: ErrorEvent) => {
            setIsRunning(false);
            const err = new Error(e.message);
            setError(err);
            reject(err);
          };

          worker.postMessage(data);
        } catch (err) {
          setIsRunning(false);
          const error = err as Error;
          setError(error);
          reject(error);
        }
      });
    },
    [workerFn]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return { run, isRunning, error };
}

// ============================================
// 7. PERFORMANCE MONITORING
// ============================================

export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  apiCallTime: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start measuring
   */
  start(label: string): void {
    performance.mark(`${label}-start`);
  }

  /**
   * End measuring and record
   */
  end(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    const duration = measure?.duration || 0;
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    return duration;
  }

  /**
   * Get average time for label
   */
  getAverage(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      result[label] = {
        avg: this.getAverage(label),
        count: times.length,
      };
    }
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(label: string): {
  start: () => void;
  end: () => number;
  average: number;
} {
  const start = useCallback(() => {
    performanceMonitor.start(label);
  }, [label]);

  const end = useCallback(() => {
    return performanceMonitor.end(label);
  }, [label]);

  const average = performanceMonitor.getAverage(label);

  return { start, end, average };
}
