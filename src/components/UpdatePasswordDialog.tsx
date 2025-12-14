"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword, User } from '@/services/mockService';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';

interface UpdatePasswordDialogProps {
  user: User;
}

const UpdatePasswordDialog = ({ user }: UpdatePasswordDialogProps) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 3) {
      toast.error("Password must be at least 3 characters");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const success = await updatePassword(user.username, newPass);
    setLoading(false);

    if (success) {
      toast.success("Password updated successfully!");
      setNewPass('');
      setConfirmPass('');
      setIsOpen(false);
    } else {
      toast.error("Failed to update password");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <KeyRound className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input 
              type="password" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input 
              type="password" 
              value={confirmPass} 
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePasswordDialog;