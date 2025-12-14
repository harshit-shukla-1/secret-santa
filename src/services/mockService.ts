"use client";

export interface Message {
  id: string;
  to: string;
  body: string;
  timestamp: number;
}

const USERS_KEY = 'secret-santa-users';
const MESSAGES_KEY = 'secret-santa-messages';

export const getUsers = (): string[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const createUser = (username: string): boolean => {
  const users = getUsers();
  if (users.includes(username)) return true; // User exists, we just log them in
  users.push(username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const getMessagesForUser = (username: string): Message[] => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  return allMessages
    .filter(m => m.to === username)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const sendMessage = (to: string, body: string) => {
  const messages = localStorage.getItem(MESSAGES_KEY);
  const allMessages: Message[] = messages ? JSON.parse(messages) : [];
  const newMessage: Message = {
    id: Date.now().toString(),
    to,
    body,
    timestamp: Date.now(),
  };
  allMessages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
};

export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
};