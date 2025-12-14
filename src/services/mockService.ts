"use client";

export type UserRole = 'admin' | 'user';
export type MessageType = 'text' | 'image' | 'audio';

export interface User {
  username: string;
  password?: string;
  role: UserRole;
  avatar?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  type: MessageType;
  timestamp: number;
}

const USERS_KEY = 'secret-santa-users-v2';
const MESSAGES_KEY = 'secret-santa-messages-v2';

const init = () => {
  if (typeof window === 'undefined') return;
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const admin: User = { 
      username: 'admin', 
      password: '123',
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

export const deleteUser = (username: string) => {
  const users = getUsers().filter(u => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const updatePassword = (username: string, newPass: string): boolean => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].password = newPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  }
  return false;
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

export const getAllMessages = (): Message[] => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  return messages ? JSON.parse(messages).sort((a: Message, b: Message) => b.timestamp - a.timestamp) : [];
};

export const getSentMessages = (username: string): Message[] => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  return allMessages
    .filter(m => m.from === username)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const sendMessage = (from: string, to: string, body: string, type: MessageType = 'text') => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  
  try {
    const newMessage: Message = {
      id: Date.now().toString(),
      from, 
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

export const deleteMessage = (id: string) => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  if (messages) {
    const allMessages: Message[] = JSON.parse(messages);
    const filtered = allMessages.filter(m => m.id !== id);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
  }
};

export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
};

init();