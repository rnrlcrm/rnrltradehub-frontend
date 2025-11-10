/**
 * React Hooks for Performance Optimizations
 * Phase 4: Virtual scrolling, caching, lazy loading
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useVirtualScroll,
  VirtualScrollOptions,
  useCachedData,
  useDebounce,
  useLazyLoad,
  useWebWorker,
  usePerformanceMonitor,
  MemoryCache,
  apiCache,
  masterDataCache,
  analyticsCache,
  debounce,
  throttle,
} from '../utils/performanceOptimizations';

// ============================================
// VIRTUAL SCROLLING HOOKS
// ============================================

/**
 * Hook for virtual table with large datasets
 */
export function useVirtualTable<T>(
  data: T[],
  options: VirtualScrollOptions & {
    onRowClick?: (item: T, index: number) => void;
  }
) {
  const virtualScroll = useVirtualScroll(data.length, options);
  
  const visibleData = useMemo(() => {
    return virtualScroll.visibleItems.map((index) => ({
      index,
      item: data[index],
    }));
  }, [virtualScroll.visibleItems, data]);

  const handleRowClick = useCallback(
    (item: T, index: number) => {
      if (options.onRowClick) {
        options.onRowClick(item, index);
      }
    },
    [options]
  );

  return {
    ...virtualScroll,
    visibleData,
    handleRowClick,
  };
}

// ============================================
// CACHING HOOKS
// ============================================

/**
 * Hook for caching API responses
 */
export function useCachedAPI<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  cacheKey?: string
) {
  const key = cacheKey || endpoint;
  return useCachedData(key, fetcher, apiCache);
}

/**
 * Hook for caching master data
 */
export function useCachedMasterData<T>(
  dataType: string,
  fetcher: () => Promise<T>
) {
  return useCachedData(`master-data-${dataType}`, fetcher, masterDataCache);
}

/**
 * Hook for caching analytics
 */
export function useCachedAnalytics<T>(
  reportType: string,
  fetcher: () => Promise<T>,
  dateRange?: { start: Date; end: Date }
) {
  const key = dateRange
    ? `analytics-${reportType}-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
    : `analytics-${reportType}`;
    
  return useCachedData(key, fetcher, analyticsCache);
}

/**
 * Hook for cache invalidation
 */
export function useCacheInvalidation() {
  const invalidateAPI = useCallback((pattern?: RegExp) => {
    if (pattern) {
      apiCache.invalidatePattern(pattern);
    } else {
      apiCache.clear();
    }
  }, []);

  const invalidateMasterData = useCallback((dataType?: string) => {
    if (dataType) {
      masterDataCache.invalidate(`master-data-${dataType}`);
    } else {
      masterDataCache.clear();
    }
  }, []);

  const invalidateAnalytics = useCallback(() => {
    analyticsCache.clear();
  }, []);

  const invalidateAll = useCallback(() => {
    apiCache.clear();
    masterDataCache.clear();
    analyticsCache.clear();
  }, []);

  return {
    invalidateAPI,
    invalidateMasterData,
    invalidateAnalytics,
    invalidateAll,
  };
}

// ============================================
// DEBOUNCE & THROTTLE HOOKS
// ============================================

/**
 * Hook for debounced search
 */
export function useDebouncedSearch(
  onSearch: (query: string) => void,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (debouncedQuery !== undefined) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return { query, setQuery, debouncedQuery };
}

/**
 * Hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
    [delay]
  );
}

/**
 * Hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () => throttle((...args: Parameters<T>) => callbackRef.current(...args), limit) as T,
    [limit]
  );
}

// ============================================
// LAZY LOADING HOOKS
// ============================================

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string): {
  imageSrc: string | null;
  isLoaded: boolean;
  ref: React.RefObject<HTMLImageElement>;
} {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const isVisible = useLazyLoad(ref);

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src);
    }
  }, [isVisible, src, imageSrc]);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => setIsLoaded(true);
    }
  }, [imageSrc]);

  return { imageSrc, isLoaded, ref };
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newItems = await fetchMore();
      setItems((prev) => [...prev, ...newItems]);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, fetchMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  return { items, loading, loadMoreRef, setItems };
}

// ============================================
// WEB WORKER HOOKS
// ============================================

/**
 * Hook for bulk data processing with web worker
 */
export function useBulkDataProcessing<T, R>() {
  const worker = useWebWorker<T, R>((data: T) => {
    // Worker function for bulk processing
    // This will run in a separate thread
    return data as unknown as R;
  });

  return worker;
}

/**
 * Hook for analytics calculation with web worker
 */
export function useAnalyticsCalculation() {
  const worker = useWebWorker<any[], any>((contracts: any[]) => {
    // Calculate analytics in web worker
    const totalValue = contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
    const avgValue = totalValue / contracts.length;
    
    return {
      totalContracts: contracts.length,
      totalValue,
      avgValue,
    };
  });

  return worker;
}

// ============================================
// PERFORMANCE MONITORING HOOKS
// ============================================

/**
 * Hook for component render time monitoring
 */
export function useRenderTime(componentName: string) {
  const monitor = usePerformanceMonitor(`render-${componentName}`);
  
  useEffect(() => {
    monitor.start();
    return () => {
      monitor.end();
    };
  });

  return monitor;
}

/**
 * Hook for API call time monitoring
 */
export function useAPICallTime(apiName: string) {
  const monitor = usePerformanceMonitor(`api-${apiName}`);
  
  const trackAPICall = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T> => {
      monitor.start();
      try {
        const result = await apiCall();
        return result;
      } finally {
        monitor.end();
      }
    },
    [monitor]
  );

  return { trackAPICall, average: monitor.average };
}

// ============================================
// MEMOIZATION HOOKS
// ============================================

/**
 * Hook for memoized expensive calculations
 */
export function useMemoizedCalculation<T>(
  calculate: () => T,
  dependencies: any[]
): T {
  return useMemo(calculate, dependencies);
}

/**
 * Hook for memoized filtered data
 */
export function useMemoizedFilter<T>(
  data: T[],
  filterFn: (item: T) => boolean
): T[] {
  return useMemo(() => data.filter(filterFn), [data, filterFn]);
}

/**
 * Hook for memoized sorted data
 */
export function useMemoizedSort<T>(
  data: T[],
  sortFn: (a: T, b: T) => number
): T[] {
  return useMemo(() => [...data].sort(sortFn), [data, sortFn]);
}

// ============================================
// COMBINED OPTIMIZATION HOOKS
// ============================================

/**
 * Complete optimization hook for large tables
 */
export function useOptimizedTable<T>(
  dataFetcher: () => Promise<T[]>,
  options: {
    cacheKey: string;
    itemHeight: number;
    containerHeight: number;
    filterFn?: (item: T) => boolean;
    sortFn?: (a: T, b: T) => number;
  }
) {
  // Fetch and cache data
  const { data: rawData, loading, error, refetch } = useCachedData(
    options.cacheKey,
    dataFetcher,
    apiCache
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!rawData) return [];
    return options.filterFn ? rawData.filter(options.filterFn) : rawData;
  }, [rawData, options.filterFn]);

  // Sort data
  const sortedData = useMemo(() => {
    return options.sortFn ? [...filteredData].sort(options.sortFn) : filteredData;
  }, [filteredData, options.sortFn]);

  // Virtual scrolling
  const virtualTable = useVirtualTable(sortedData, {
    itemHeight: options.itemHeight,
    containerHeight: options.containerHeight,
  });

  return {
    ...virtualTable,
    loading,
    error,
    refetch,
    totalItems: sortedData.length,
  };
}

/**
 * Export all hooks
 */
export {
  useVirtualScroll,
  useCachedData,
  useDebounce,
  useLazyLoad,
  useWebWorker,
  usePerformanceMonitor,
};
