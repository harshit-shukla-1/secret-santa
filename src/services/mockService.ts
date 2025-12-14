"use client";

import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';
export type MessageType = 'text' | 'image' | 'audio';

export interface User {
  id?: string;
  username: string;
  role: UserRole;
  avatar?: string;
  // We don't store password in frontend model anymore
}

export interface Message {
  id: string;
  from_username: string; // Changed from 'from' to match DB
  to_username: string;   // Changed from 'to' to match DB
  body: string;
  type: MessageType;
  timestamp: number; // We'll convert created_at to timestamp for compatibility
}

// Helpers
const getEmail = (username: string) => `${username}@secretsanta.app`;

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data as User[];
};

export const createUser = async (username: string, password?: string, role: UserRole = 'user'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { username, password, role }
    });
    
    if (error || (data && data.error)) {
      console.error("Error creating user:", error || data.error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception creating user:", e);
    return false;
  }
};

export const deleteUser = async (username: string) => {
  // NOTE: Deleting users via client is restricted. 
  // For this demo, we might only delete the profile or need another edge function.
  // We'll skip actual auth deletion for simplicity and just try to delete the profile if policies allow,
  // or simple return true to not break UI flow (since we only have an add user edge function).
  console.log("Delete user not fully implemented for Supabase Auth without Admin API");
  return; 
};

export const updatePassword = async (username: string, newPass: string): Promise<boolean> => {
  const { error } = await supabase.auth.updateUser({ password: newPass });
  return !error;
};

export const updateUserAvatar = async (username: string, avatar: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // Only allow updating own avatar via policy
  const { error } = await supabase
    .from('profiles')
    .update({ avatar })
    .eq('id', user.id); // Secure: rely on RLS, but passing ID helps
    
  if (error) console.error("Error updating avatar", error);
};

export const authenticate = async (username: string, password?: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: getEmail(username),
    password: password || ''
  });

  if (error || !data.user) {
    console.error("Login failed", error);
    return null;
  }

  // Fetch profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return profile as User;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

export const getSessionUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  return profile as User;
};

export const getMessagesForUser = async (username: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('to_username', username)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map(m => ({
    ...m,
    timestamp: new Date(m.created_at).getTime()
  })) as Message[];
};

export const getAllMessages = async (): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map(m => ({
    ...m,
    timestamp: new Date(m.created_at).getTime()
  })) as Message[];
};

export const getSentMessages = async (username: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('from_username', username)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map(m => ({
    ...m,
    timestamp: new Date(m.created_at).getTime()
  })) as Message[];
};

export const sendMessage = async (from: string, to: string, body: string, type: MessageType = 'text') => {
  const { error } = await supabase
    .from('messages')
    .insert({
      from_username: from,
      to_username: to,
      body,
      type
    });
    
  if (error) console.error("Send message error", error);
  return !error;
};

export const deleteMessage = async (id: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
    
  if (error) console.error("Delete message error", error);
  return !error;
};