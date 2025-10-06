import { router } from 'expo-router';
import { supabase } from './supabase';

export async function requireAuth(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  
  if (!auth?.user) {
    router.push('/login');
    return false;
  }
  
  return true;
}

export async function getCurrentUser() {
  const { data: auth } = await supabase.auth.getUser();
  return auth?.user ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  return !!auth?.user;
}

export async function signOut() {
  await supabase.auth.signOut();
  router.replace('/login');
}
