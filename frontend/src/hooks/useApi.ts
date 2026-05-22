import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: any;
    refetch: () => void;
}

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheItem<any>>();

/**
 * useApi hook for standardized data fetching with optional TTL caching.
 * @param url The endpoint URL
 * @param config Axios configuration
 * @param options { ttl: number in ms }
 */
export function useApi<T>(
    url: string, 
    config: AxiosRequestConfig = {}, 
    options: { ttl?: number } = {}
): ApiResponse<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    const API_URL = (import.meta as any).env.VITE_API_URL;
    const cacheKey = `${url}:${JSON.stringify(config.params || {})}`;
    const isMounted = useRef(true);

    const fetchData = useCallback(async (force = false) => {
        // 1. Check Cache
        if (!force && options.ttl && cache.has(cacheKey)) {
            const item = cache.get(cacheKey)!;
            const isExpired = Date.now() - item.timestamp > options.ttl;
            if (!isExpired) {
                setData(item.data);
                setLoading(false);
                return;
            }
        }

        if (!force) setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}${url}`, {
                ...config,
                headers: {
                    ...config.headers,
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            });
            if (isMounted.current) {
                setData(response.data);
                if (options.ttl) {
                    cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
                }
            }
        } catch (err: any) {
            if (isMounted.current) {
                setError(err.response?.data || { error: err.message || 'An error occurred' });
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [url, JSON.stringify(config), options.ttl, cacheKey, API_URL]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    const refetch = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    return { data, loading, error, refetch };
}
