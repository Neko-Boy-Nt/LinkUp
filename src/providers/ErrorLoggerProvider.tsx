import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

// Déclaration de type pour ErrorUtils React Native
declare global {
  interface Global {
    ErrorUtils?: {
      getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | null;
      setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  }
}

interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'error' | 'warn' | 'info' | 'supabase' | 'api' | 'unhandled' | 'promise';
  message: string;
  details?: any;
  stack?: string;
  source?: string;
}

interface ErrorLoggerContextType {
  logs: ErrorLog[];
  addLog: (type: ErrorLog['type'], message: string, details?: any) => void;
  clearLogs: () => void;
  getLogsByType: (type: ErrorLog['type']) => ErrorLog[];
  lastError: ErrorLog | null;
}

const ErrorLoggerContext = createContext<ErrorLoggerContextType | undefined>(undefined);

// Stockage global des logs
let globalLogs: ErrorLog[] = [];
const MAX_LOGS = 100;

// Références aux méthodes console originales (pour éviter la récursion)
let originalConsoleErrorRef: typeof console.error;
let originalConsoleWarnRef: typeof console.warn;
let originalConsoleLogRef: typeof console.log;

// Flag pour éviter la récursion
let isLogging = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function addGlobalLog(type: ErrorLog['type'], message: string, details?: any, stack?: string, source?: string) {
  // Protection contre la récursion
  if (isLogging) {
    return {
      id: generateId(),
      timestamp: formatTimestamp(),
      type,
      message: String(message),
    } as ErrorLog;
  }
  
  isLogging = true;
  
  try {
    const log: ErrorLog = {
      id: generateId(),
      timestamp: formatTimestamp(),
      type,
      message: String(message),
      details: details ? JSON.parse(JSON.stringify(details, (key, value) => {
        if (value instanceof Error) return value.toString();
        return value;
      }, 2)) : undefined,
      stack,
      source,
    };

    globalLogs.unshift(log);
    if (globalLogs.length > MAX_LOGS) {
      globalLogs = globalLogs.slice(0, MAX_LOGS);
    }

    // Affichage stylisé dans la console en utilisant les méthodes originales
    const prefix = `[${log.timestamp}] [${type.toUpperCase()}]`;
    
    switch (type) {
      case 'error':
      case 'unhandled':
      case 'promise':
        originalConsoleErrorRef?.(`\n🔴 ${prefix}\nMessage: ${message}`);
        if (details) originalConsoleErrorRef?.('Details:', details);
        if (stack) originalConsoleErrorRef?.('Stack:', stack);
        break;
      case 'warn':
        originalConsoleWarnRef?.(`\n🟡 ${prefix}\nMessage: ${message}`);
        if (details) originalConsoleWarnRef?.('Details:', details);
        break;
      case 'supabase':
        originalConsoleErrorRef?.(`\n🟣 ${prefix} [SUPABASE]\nMessage: ${message}`);
        if (details) originalConsoleErrorRef?.('Details:', details);
        break;
      case 'api':
        originalConsoleErrorRef?.(`\n🔵 ${prefix} [API]\nMessage: ${message}`);
        if (details) originalConsoleErrorRef?.('Details:', details);
        break;
      default:
        originalConsoleLogRef?.(`\n⚪ ${prefix}\nMessage: ${message}`);
        if (details) originalConsoleLogRef?.('Details:', details);
    }

    return log;
  } finally {
    isLogging = false;
  }
}

// Intercepter les erreurs globales avant le montage React
if (typeof global !== 'undefined') {
  // Sauvegarder les méthodes originales dans les refs
  originalConsoleErrorRef = console.error;
  originalConsoleWarnRef = console.warn;
  originalConsoleLogRef = console.log;

  // Intercepter console.error
  console.error = (...args: any[]) => {
    // Appeler la méthode originale d'abord
    originalConsoleErrorRef.apply(console, args);
    
    // Ne pas logger si on est déjà en train de logger
    if (isLogging) return;
    
    const message = args.map(arg => 
      arg instanceof Error ? arg.message : 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const error = args.find(arg => arg instanceof Error);
    const stack = error?.stack;
    const details = args.length > 1 ? args.slice(1) : undefined;
    
    addGlobalLog('error', message, details, stack, 'console.error');
  };

  // Intercepter console.warn
  console.warn = (...args: any[]) => {
    // Appeler la méthode originale d'abord
    originalConsoleWarnRef.apply(console, args);
    
    // Ne pas logger si on est déjà en train de logger
    if (isLogging) return;
    
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addGlobalLog('warn', message, args.length > 1 ? args.slice(1) : undefined, undefined, 'console.warn');
  };

  // Intercepter les erreurs non capturées
  const globalAny = global as any;
  const originalErrorHandler = globalAny.ErrorUtils?.getGlobalHandler?.();
  
  if (globalAny.ErrorUtils?.setGlobalHandler) {
    globalAny.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      addGlobalLog(
        'unhandled',
        `${isFatal ? '[FATAL] ' : ''}${error.message}`,
        { isFatal, name: error.name },
        error.stack,
        'global.ErrorUtils'
      );
      
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  // Intercepter les rejets de promesses non capturées
  if (typeof global !== 'undefined' && 'onunhandledrejection' in global) {
    const originalRejectionHandler = (global as any).onunhandledrejection;
    
    (global as any).onunhandledrejection = (reason: any, promise: Promise<any>) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      
      addGlobalLog(
        'promise',
        `Unhandled Promise Rejection: ${message}`,
        { reason: reason instanceof Error ? reason.toString() : reason },
        stack,
        'unhandledrejection'
      );
      
      if (originalRejectionHandler) {
        originalRejectionHandler(reason, promise);
      }
    };
  }
}

export function ErrorLoggerProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ErrorLog[]>(globalLogs);
  const [lastError, setLastError] = useState<ErrorLog | null>(null);

  useEffect(() => {
    // Synchroniser avec les logs globaux
    const interval = setInterval(() => {
      setLogs([...globalLogs]);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const addLog = (type: ErrorLog['type'], message: string, details?: any) => {
    const log = addGlobalLog(type, message, details);
    setLastError(log);
    setLogs([...globalLogs]);
    return log;
  };

  const clearLogs = () => {
    globalLogs = [];
    setLogs([]);
    setLastError(null);
  };

  const getLogsByType = (type: ErrorLog['type']) => {
    return logs.filter(log => log.type === type);
  };

  return (
    <ErrorLoggerContext.Provider value={{ logs, addLog, clearLogs, getLogsByType, lastError }}>
      {children}
    </ErrorLoggerContext.Provider>
  );
}

export function useErrorLogger() {
  const context = useContext(ErrorLoggerContext);
  if (context === undefined) {
    throw new Error('useErrorLogger must be used within an ErrorLoggerProvider');
  }
  return context;
}

// Fonction utilitaire pour logger des erreurs Supabase
export function logSupabaseError(operation: string, error: any) {
  const message = error?.message || error?.error?.message || String(error);
  const details = {
    operation,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    fullError: error,
  };
  
  return addGlobalLog('supabase', `[${operation}] ${message}`, details, undefined, 'supabase');
}

// Fonction utilitaire pour logger des erreurs API
export function logApiError(endpoint: string, error: any, response?: any) {
  const message = error?.message || String(error);
  const details = {
    endpoint,
    status: response?.status,
    statusText: response?.statusText,
    response: response,
    error: error,
  };
  
  return addGlobalLog('api', `[${endpoint}] ${message}`, details, undefined, 'api');
}

// Fonction pour afficher un résumé des erreurs récentes
export function showErrorSummary() {
  const recentErrors = globalLogs
    .filter(log => ['error', 'unhandled', 'promise', 'supabase'].includes(log.type))
    .slice(0, 5);

  if (recentErrors.length === 0) {
    originalConsoleLogRef?.('\n✅ Aucune erreur récente\n');
    return;
  }

  originalConsoleLogRef?.('\n📋 RÉSUMÉ DES ERREURS RÉCENTES\n' + '='.repeat(50));
  recentErrors.forEach((error, index) => {
    originalConsoleLogRef?.(`\n${index + 1}. [${error.type.toUpperCase()}] ${error.timestamp}`);
    originalConsoleLogRef?.(`   Message: ${error.message}`);
    if (error.source) originalConsoleLogRef?.(`   Source: ${error.source}`);
    if (error.details) originalConsoleLogRef?.(`   Details:`, JSON.stringify(error.details, null, 2).substring(0, 200));
  });
  originalConsoleLogRef?.('\n' + '='.repeat(50) + '\n');
}

// Exporter les logs pour débogage
export function exportLogs(): ErrorLog[] {
  return [...globalLogs];
}
