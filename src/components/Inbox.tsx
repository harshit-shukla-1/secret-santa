"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Message, getMessagesForUser } from '@/services/mockService';
import { Ghost, Mail, Music, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface InboxProps {
  currentUser: string;
}

const Inbox = ({ currentUser }: InboxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = async () => {
    const msgs = await getMessagesForUser(currentUser);
    setMessages(msgs);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'audio':
        return (
          <div className="flex items-center gap-2 bg-white/50 p-2 rounded">
            <Music className="w-4 h-4 text-primary" />
            <audio src={msg.body} controls className="h-8 w-full max-w-[200px]" />
          </div>
        );
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden border border-border">
             <img src={msg.body} alt="Secret Gift" className="w-full max-h-60 object-cover" />
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>;
    }
  };

  return (
    <Card className="h-full flex flex-col border-primary/20 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Mail className="w-5 h-5" />
          Your Stocking (Inbox)
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchMessages}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px] p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
              <Ghost className="w-12 h-12 opacity-20" />
              <p>No gifts in your stocking yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white p-4 rounded-lg space-y-2 border border-green-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="text-xl">🎅</span>
                    <span className="font-bold text-green-700">Secret Santa</span>
                    <span className="text-xs ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {renderMessageContent(msg)}
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