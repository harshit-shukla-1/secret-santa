"use client";

import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';
export type MessageType = 'text' | 'image' | 'audio';

export interface User {
  id?: string;
  username: string;
  role: UserRole;
  avatar?: string;
}

export interface Message {
  id: string;
  from_username: string; 
  to_username: string;   
  body: string;
  type: MessageType;
  timestamp: number; 
}

export interface Comment {
  id: string;
  message_id: string;
  username: string;
  avatar: string;
  body: string;
  created_at: string;
}

const getEmail = (username: string) => `${username}@secretsantahq.com`;

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

export const deleteUser = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { username }
    });
    
    if (error || (data && data.error)) {
      console.error("Error deleting user:", error || data.error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception deleting user:", e);
    return false;
  }
};

export const resetAdmin = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('reset-admin', {});
    
    if (error) {
        return { success: false, message: error.message };
    }
    if (data && data.success === false) {
        return { success: false, message: data.error };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const updatePassword = async (username: string, newPass: string): Promise<boolean> => {
  const { error } = await supabase.auth.updateUser({ password: newPass });
  return !error;
};

export const updateUserAvatar = async (username: string, avatar: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { error } = await supabase
    .from('profiles')
    .update({ avatar })
    .eq('id', user.id); 
    
  if (error) console.error("Error updating avatar", error);
};

export const authenticate = async (username: string, password?: string): Promise<User | null> => {
  const email = getEmail(username);
  console.log(`Attempting login for: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password || ''
  });

  if (error) {
    console.error("Supabase Login Error:", error.message);
    return null;
  }

  if (!data.user) {
    console.error("Login successful but no user returned");
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    return {
        id: data.user.id,
        username: username,
        role: 'user',
        avatar: '☃️'
    };
  }

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

// --- Config & Storage ---

export const getPublicWallStatus = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'public_wall_enabled')
    .single();
    
  if (error || !data) return true; // Default to true if not found
  return data.value === 'true';
};

export const setPublicWallStatus = async (enabled: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('app_config')
    .upsert({ key: 'public_wall_enabled', value: String(enabled) });
    
  return !error;
};

export const uploadFile = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// --- Comments ---

export const getComments = async (messageId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching comments", error);
    return [];
  }
  return data as Comment[];
};

export const addComment = async (messageId: string, username: string, avatar: string, body: string): Promise<boolean> => {
  const { error } = await supabase
    .from('comments')
    .insert({
      message_id: messageId,
      username,
      avatar,
      body
    });

  if (error) {
    console.error("Error adding comment", error);
    return false;
  }
  return true;
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
        
    return !error;
};