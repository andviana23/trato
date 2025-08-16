"use client";

import { useState, useCallback, useRef } from "react";

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError?: Error;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
  } = options;

  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const calculateDelay = useCallback((attempt: number): number => {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    
    // Apply jitter to prevent thundering herd
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    // Cap at max delay
    return Math.min(delay, maxDelay);
  }, [baseDelay, maxDelay, backoffMultiplier, jitter]);

  const retry = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void,
    onMaxAttemptsReached?: (error: Error) => void
  ): Promise<T> => {
    // Cancel any ongoing retry
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        setState(prev => ({ ...prev, attempt, isRetrying: false, lastError: undefined }));
        
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        
        const result = await operation(abortControllerRef.current.signal);
        
        // Success - reset state
        setState({ attempt: 0, isRetrying: false });
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if operation was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          setState({ attempt, isRetrying: false, lastError });
          onMaxAttemptsReached?.(lastError);
          throw lastError;
        }
        
        // Schedule retry
        setState(prev => ({ ...prev, attempt, isRetrying: true, lastError }));
        
        onRetry?.(attempt, lastError);
        
        const delay = calculateDelay(attempt);
        
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            resolve();
          }, delay);
        });
      }
    }
    
    throw lastError!;
  }, [maxAttempts, calculateDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isRetrying: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ attempt: 0, isRetrying: false });
  }, [cancel]);

  return {
    retry,
    cancel,
    reset,
    attempt: state.attempt,
    isRetrying: state.isRetrying,
    lastError: state.lastError,
    hasAttemptsLeft: state.attempt < maxAttempts,
  };
}

// Hook específico para operações de API
export function useApiRetry<T>(
  apiCall: (...args: any[]) => Promise<T>,
  options: RetryOptions = {}
) {
  const retryUtils = useRetry(options);
  
  const callWithRetry = useCallback(async (...args: any[]) => {
    return retryUtils.retry(
      (signal) => apiCall(...args),
      (attempt, error) => {
        console.warn(`API call failed, retrying... (attempt ${attempt + 1})`, error);
      },
      (error) => {
        console.error(`API call failed after ${options.maxAttempts || 3} attempts:`, error);
      }
    );
  }, [apiCall, retryUtils, options.maxAttempts]);

  return {
    ...retryUtils,
    callWithRetry,
  };
}

// Hook para operações de mutação com retry
export function useMutationWithRetry<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: RetryOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryUtils = useRetry(options);

  const mutate = useCallback(async (variables: V): Promise<T | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await retryUtils.retry(
        (signal) => mutationFn(variables),
        (attempt, error) => {
          console.warn(`Mutation failed, retrying... (attempt ${attempt + 1})`, error);
        },
        (error) => {
          console.error(`Mutation failed after ${options.maxAttempts || 3} attempts:`, error);
          setError(error);
        }
      );
      
      return result;
    } catch (err) {
      setError(err as Error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, retryUtils, options.maxAttempts]);

  return {
    mutate,
    isLoading,
    error,
    ...retryUtils,
  };
}
