// ============================================================================
// UTILITÁRIOS CENTRALIZADOS
// ============================================================================

// Nota: Os módulos individuais serão criados posteriormente
// export * from './date';
// export * from './format';
// export * from './validation';
// export * from './crypto';
// export * from './array';
// export * from './object';
// export * from './string';

// ============================================================================
// FUNÇÕES UTILITÁRIAS COMUNS
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const clonedObj = {} as Record<string, unknown>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return clonedObj as unknown as T;
  }

  return obj;
}

/**
 * Função utilitária para merge de objetos
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        const targetValue = (result[key] as Record<string, unknown>) || {};
        const sourceValue = source[key] as Record<string, unknown>;
        (result as Record<string, unknown>)[key] = deepMerge(targetValue, sourceValue);
      } else {
        (result as Record<string, unknown>)[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Função utilitária para sleep/delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função utilitária para retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Função utilitária para memoização
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Função utilitária para cache com TTL
 */
export function createCacheWithTTL<T>(ttlMs: number) {
  const cache = new Map<string, { value: T; expires: number }>();
  
  return {
    get(key: string): T | undefined {
      const item = cache.get(key);
      if (!item) return undefined;
      
      if (Date.now() > item.expires) {
        cache.delete(key);
        return undefined;
      }
      
      return item.value;
    },
    
    set(key: string, value: T): void {
      cache.set(key, {
        value,
        expires: Date.now() + ttlMs,
      });
    },
    
    delete(key: string): boolean {
      return cache.delete(key);
    },
    
    clear(): void {
      cache.clear();
    },
    
    has(key: string): boolean {
      return cache.has(key) && Date.now() <= cache.get(key)!.expires;
    },
  };
}

/**
 * Generate random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number between min and max
 */
export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Função utilitária para gerar UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Função utilitária para verificar se é um objeto vazio
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * Função utilitária para verificar se é um número válido
 */
export function isValidNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Função utilitária para verificar se é uma string válida
 */
export function isValidString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate CPF format
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return (
    parseInt(cleaned.charAt(9)) === digit1 &&
    parseInt(cleaned.charAt(10)) === digit2
  );
}

/**
 * Validate CNPJ format
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validate first digit
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  // Validate second digit
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return (
    parseInt(cleaned.charAt(12)) === digit1 &&
    parseInt(cleaned.charAt(13)) === digit2
  );
}

/**
 * Função utilitária para verificar se é um telefone válido
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Format CPF with mask
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  return cpf;
}

/**
 * Format CNPJ with mask
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
  }
  return cnpj;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Função utilitária para formatar porcentagem
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Função utilitária para truncar texto
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Função utilitária para capitalizar primeira letra
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Função utilitária para capitalizar todas as palavras
 */
export function capitalizeWords(text: string): string {
  if (!text) return text;
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
}

/**
 * Função utilitária para slugify
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Função utilitária para class names condicionais
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Função utilitária para verificar se está em desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Função utilitária para verificar se está em produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Função utilitária para verificar se está em teste
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Função utilitária para log condicional
 */
export function conditionalLog(message: string, data?: unknown): void {
  if (isDevelopment()) {
    console.log(message, data);
  }
}

/**
 * Função utilitária para error condicional
 */
export function conditionalError(message: string, error?: unknown): void {
  if (isDevelopment()) {
    console.error(message, error);
  }
}

/**
 * Função utilitária para warn condicional
 */
export function conditionalWarn(message: string, data?: unknown): void {
  if (isDevelopment()) {
    console.warn(message, data);
  }
}

/**
 * Função utilitária para group condicional
 */
export function conditionalGroup(label: string, fn: () => void): void {
  if (isDevelopment()) {
    console.group(label);
    fn();
    console.groupEnd();
  }
}

/**
 * Função utilitária para time condicional
 */
export function conditionalTime(label: string): void {
  if (isDevelopment()) {
    console.time(label);
  }
}

/**
 * Função utilitária para timeEnd condicional
 */
export function conditionalTimeEnd(label: string): void {
  if (isDevelopment()) {
    console.timeEnd(label);
  }
}

// Exportar utilitários financeiros
export * from './financial';
