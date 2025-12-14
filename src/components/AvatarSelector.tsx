"use client";

import React from 'react';
import { updateUserAvatar, User } from '@/services/mockService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Using emojis as reliable "cartoon" characters for this demo to avoid external image 403s
// In a real app, replace these with image URLs
const AVATARS = [
  '🎅', '🤶', '🦌', '⛄', '🧝', '🍪', 
  '🦊', '🐻', '🐼', '🦁', '🐯', '🦄',
  '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🧚', '🧞', '🧜‍♀️'
];

interface AvatarSelectorProps {
  user: User;
  onUpdate: (avatar: string) => void;
}

const AvatarSelector = ({ user, onUpdate }: AvatarSelectorProps) => {
  const handleSelect = (avatar: string) => {
    updateUserAvatar(user.username, avatar);
    onUpdate(avatar);
    toast.success("Avatar updated!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-24 h-24 rounded-full text-4xl bg-white border-4 border-primary/20 hover:border-primary">
          {user.avatar || '👤'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your Holiday Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2 py-4">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => handleSelect(avatar)}
              className="text-3xl p-2 hover:bg-slate-100 rounded-lg transition-transform hover:scale-110"
            >
              {avatar}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;