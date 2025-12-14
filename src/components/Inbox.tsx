"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Message, getMessagesForUser } from '@/services/mockService';
import { Ghost, Mail } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface InboxProps {
  currentUser: string;
}

const Inbox = ({ currentUser }: InboxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = () => {
    setMessages(getMessagesForUser(currentUser));
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 2 seconds for this demo
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Inbox
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchMessages}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
              <Ghost className="w-12 h-12 opacity-20" />
              <p>No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-secondary/50 p-4 rounded-lg space-y-2 border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ghost className="w-4 h-4" />
                    <span className="font-medium text-primary">Secret Santa</span>
                    <span>•</span>
                    <span className="text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Inbox;