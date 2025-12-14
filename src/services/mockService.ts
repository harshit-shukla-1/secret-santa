"use client";

export type UserRole = 'admin' | 'user';
export type MessageType = 'text' | 'image' | 'audio';

export interface User {
  username: string;
  password?: string; // Optional for legacy or future auth providers
  role: UserRole;
  avatar?: string;
}

export interface Message {
  id: string;
  from: string; // Now tracking sender for history (though displayed anonymously)
  to: string;
  body: string; // Text content or Base64 data
  type: MessageType;
  timestamp: number;
}

const USERS_KEY = 'secret-santa-users-v2';
const MESSAGES_KEY = 'secret-santa-messages-v2';

// Initialize with default admin if empty
const init = () => {
  if (typeof window === 'undefined') return;
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const admin: User = { 
      username: 'admin', 
      password: '123', // Simple default password
      role: 'admin',
      avatar: '🎅'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
  }
};

export const getUsers = (): User[] => {
  init();
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const getUser = (username: string): User | undefined => {
  return getUsers().find(u => u.username === username);
};

export const createUser = (username: string, password?: string, role: UserRole = 'user'): boolean => {
  const users = getUsers();
  if (users.find(u => u.username === username)) return false;
  
  const newUser: User = { 
    username, 
    password, 
    role,
    avatar: role === 'admin' ? '🎅' : '☃️' // Default avatars
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const updateUserAvatar = (username: string, avatar: string) => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].avatar = avatar;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const authenticate = (username: string, password?: string): User | null => {
  const user = getUser(username);
  if (!user) return null;
  // In a real app, hash passwords. Here we compare plain text for the mock.
  if (user.password === password) return user;
  return null;
};

export const getMessagesForUser = (username: string): Message[] => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  return allMessages
    .filter(m => m.to === username)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const sendMessage = (to: string, body: string, type: MessageType = 'text') => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  
  // LocalStorage has size limits (usually 5MB). Large images/audio might fail.
  // In a real app, upload to a server/bucket and store URL.
  try {
    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'anonymous',
      to,
      body,
      type,
      timestamp: Date.now(),
    };
    allMessages.push(newMessage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
    return true;
  } catch (e) {
    console.error("Storage full or error", e);
    return false;
  }
};

export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
};

// Initial run
init();