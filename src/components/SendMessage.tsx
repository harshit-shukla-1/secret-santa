"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { getUsers, sendMessage, getSentMessages, deleteMessage, User, Message } from '@/services/mockService';
import { toast } from 'sonner';
import { Send, Trash2, History, Loader2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SendMessageProps {
  currentUser: User;
}

const SendMessage = ({ currentUser }: SendMessageProps) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [textMessage, setTextMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Sent history state
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const u = await getUsers();
        setUsersList(u.filter(user => user.username !== currentUser.username));
    };
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    refreshSentMessages();
    const interval = setInterval(refreshSentMessages, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const refreshSentMessages = async () => {
    const msgs = await getSentMessages(currentUser.username);
    setSentMessages(msgs);
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error("Please select a recipient (Who has been naughty or nice?)");
      return;
    }

    if (!textMessage.trim()) {
        toast.error("Write a message!");
        return;
    }

    setSending(true);
    try {
        const success = await sendMessage(currentUser.username, selectedUser, textMessage, 'text');

        if (success) {
            toast.success(`Secret gift sent to ${selectedUser}! 🎁`);
            refreshSentMessages();
            setTextMessage('');
        } else {
            toast.error("Failed to send.");
        }
    } catch (e) {
        toast.error("Error sending message");
    } finally {
        setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMessage(id);
    refreshSentMessages();
    toast.success("Message deleted successfully");
  };

  const canDelete = (timestamp: number) => {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - timestamp < fiveMinutes;
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Send className="w-5 h-5" />
          {showHistory ? "Sent History" : "Send Anonymous Surprise"}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowHistory(!showHistory)}
          className={showHistory ? 'bg-secondary' : ''}
        >
          {showHistory ? (
             <>
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back to Send
             </>
          ) : (
             <>
               <History className="w-4 h-4 mr-2" />
               History
             </>
          )}
        </Button>
      </CardHeader>
      
      {!showHistory ? (
        <>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To:</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a colleague..." />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map(user => (
                    <SelectItem key={user.username} value={user.username}>
                      <span className="flex items-center gap-2">
                        <span>{user.avatar}</span>
                        {user.username}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
               <Textarea 
                  placeholder="Write your secret message..." 
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  className="min-h-[120px]"
               />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSend} disabled={sending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Send Anonymously 🎅"}
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent>
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">Recent messages (deletable for 5 mins)</h3>
          <ScrollArea className="h-[300px]">
            {sentMessages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No sent messages found.</p>
            ) : (
              <div className="space-y-3">
                {sentMessages.map(msg => {
                  const deletable = canDelete(msg.timestamp);
                  const minutesLeft = Math.max(0, 5 - Math.floor((Date.now() - msg.timestamp) / 60000));
                  
                  return (
                    <div key={msg.id} className="p-3 bg-secondary/20 rounded border flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-primary mb-1">To: {msg.to_username}</p>
                        <p className="text-sm truncate">
                          {msg.body}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {deletable ? (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleDelete(msg.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sent</span>
                        )}
                        {deletable && <span className="text-[10px] text-muted-foreground">{minutesLeft}m left</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};

export default SendMessage;