"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { getUsers, sendMessage } from '@/services/mockService';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface SendMessageProps {
  currentUser: string;
}

const SendMessage = ({ currentUser }: SendMessageProps) => {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Filter out current user from recipients
    setUsers(getUsers().filter(u => u !== currentUser));
  }, [currentUser]);

  const handleSend = () => {
    if (!selectedUser) {
      toast.error("Please select a recipient");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    sendMessage(selectedUser, message);
    toast.success(`Anonymous message sent to ${selectedUser}!`);
    setMessage('');
    setSelectedUser('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Anonymous Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">To:</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No other users yet. Open this app in another tab to create one!
                </div>
              ) : (
                users.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Message:</label>
          <Textarea 
            placeholder="Write something nice (or mysterious)..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSend} className="w-full">
          Send Anonymously
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SendMessage;