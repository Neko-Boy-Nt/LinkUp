import { supabase } from './supabase';
import { logSupabaseError } from '../providers/ErrorLoggerProvider';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';

/**
 * Wrapper pour Supabase avec logging automatique des erreurs
 * Utilisez cette fonction à la place de supabase directement pour avoir
 * un logging automatique de toutes les erreurs
 */

// Fonction helper pour logger les erreurs
function logError(operation: string, table: string, error: any) {
  logSupabaseError(`${operation}:${table}`, error);
  return error;
}

// Wrapper pour les requêtes de type 'select'
export async function supabaseSelect<T = any>(
  table: string,
  query?: string
): Promise<{ data: T[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(query || '*');
    
    if (error) {
      logError('SELECT', table, error);
    }
    
    return { data: data as T[] | null, error };
  } catch (err) {
    logError('SELECT', table, err);
    return { data: null, error: err };
  }
}

// Wrapper pour les requêtes de type 'insert'
export async function supabaseInsert<T = any>(
  table: string,
  data: any
): Promise<{ data: T | null; error: any }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      logError('INSERT', table, error);
    }
    
    return { data: result as T | null, error };
  } catch (err) {
    logError('INSERT', table, err);
    return { data: null, error: err };
  }
}

// Wrapper pour les requêtes de type 'update'
export async function supabaseUpdate<T = any>(
  table: string,
  data: any,
  match: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  try {
    let query = supabase.from(table).update(data);
    
    // Appliquer les conditions de matching
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select().single();
    
    if (error) {
      logError('UPDATE', table, error);
    }
    
    return { data: result as T | null, error };
  } catch (err) {
    logError('UPDATE', table, err);
    return { data: null, error: err };
  }
}

// Wrapper pour les requêtes de type 'delete'
export async function supabaseDelete(
  table: string,
  match: Record<string, any>
): Promise<{ error: any }> {
  try {
    let query = supabase.from(table).delete();
    
    // Appliquer les conditions de matching
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query;
    
    if (error) {
      logError('DELETE', table, error);
    }
    
    return { error };
  } catch (err) {
    logError('DELETE', table, err);
    return { error: err };
  }
}

// Wrapper pour les RPC (fonctions stockées)
export async function supabaseRPC<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      logError('RPC', functionName, error);
    }
    
    return { data: data as T | null, error };
  } catch (err) {
    logError('RPC', functionName, err);
    return { data: null, error: err };
  }
}

// Wrapper pour le storage upload
export async function supabaseStorageUpload(
  bucket: string,
  path: string,
  file: Blob | File | ArrayBuffer | Uint8Array,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ data: { path: string } | null; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
    
    if (error) {
      logError('STORAGE_UPLOAD', bucket, error);
    }
    
    return { data, error };
  } catch (err) {
    logError('STORAGE_UPLOAD', bucket, err);
    return { data: null, error: err };
  }
}

// Wrapper pour le storage download
export async function supabaseStorageDownload(
  bucket: string,
  path: string
): Promise<{ data: Blob | null; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      logError('STORAGE_DOWNLOAD', bucket, error);
    }
    
    return { data, error };
  } catch (err) {
    logError('STORAGE_DOWNLOAD', bucket, err);
    return { data: null, error: err };
  }
}

// Wrapper pour le storage getPublicUrl
export function supabaseStorageGetUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Wrapper pour auth
export async function supabaseAuthSignIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logError('AUTH_SIGNIN', 'auth', error);
    }
    
    return { data, error };
  } catch (err) {
    logError('AUTH_SIGNIN', 'auth', err);
    return { data: null, error: err };
  }
}

export async function supabaseAuthSignUp(email: string, password: string, metadata?: any) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    });
    
    if (error) {
      logError('AUTH_SIGNUP', 'auth', error);
    }
    
    return { data, error };
  } catch (err) {
    logError('AUTH_SIGNUP', 'auth', err);
    return { data: null, error: err };
  }
}

export async function supabaseAuthSignOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logError('AUTH_SIGNOUT', 'auth', error);
    }
    
    return { error };
  } catch (err) {
    logError('AUTH_SIGNOUT', 'auth', err);
    return { error: err };
  }
}

// Exporter aussi l'instance originale pour les cas avancés
export { supabase };
