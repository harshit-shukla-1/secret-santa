"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { getUsers, sendMessage, getSentMessages, deleteMessage, uploadFile, User, Message } from '@/services/mockService';
import { toast } from 'sonner';
import { Send, Trash2, History, Loader2, ArrowLeft, Check, ChevronsUpDown, X, Image as ImageIcon, Mic, FileText, Square } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from "@/lib/utils";

interface SendMessageProps {
  currentUser: User;
}

const SendMessage = ({ currentUser }: SendMessageProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [textMessage, setTextMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [messageType, setMessageType] = useState<'text' | 'image' | 'audio'>('text');
  
  // Media states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const toggleUser = (username: string) => {
    setSelectedUsers(current => 
        current.includes(username) 
            ? current.filter(u => u !== username)
            : [...current, username]
    );
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image too large. Max 5MB allowed.");
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one recipient (Who has been naughty or nice?)");
      return;
    }

    let contentToSend = '';
    
    // Prepare content based on type
    if (messageType === 'text') {
        if (!textMessage.trim()) {
            toast.error("Write a message!");
            return;
        }
        contentToSend = textMessage;
    } else if (messageType === 'image') {
        if (!selectedImage) {
            toast.error("Select an image first!");
            return;
        }
        setSending(true);
        const url = await uploadFile(selectedImage);
        if (!url) {
            toast.error("Image upload failed. Make sure you created the 'attachments' bucket in Supabase!");
            setSending(false);
            return;
        }
        contentToSend = url;
    } else if (messageType === 'audio') {
        if (!audioBlob) {
            toast.error("Record something first!");
            return;
        }
        setSending(true);
        const file = new File([audioBlob], "voice-note.webm", { type: 'audio/webm' });
        const url = await uploadFile(file);
        if (!url) {
            toast.error("Audio upload failed. Make sure you created the 'attachments' bucket in Supabase!");
            setSending(false);
            return;
        }
        contentToSend = url;
    }

    setSending(true);
    try {
        // Send to all selected users
        const promises = selectedUsers.map(username => 
            sendMessage(currentUser.username, username, contentToSend, messageType)
        );

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r).length;

        if (successCount > 0) {
            toast.success(`Secret gift sent to ${successCount} elves! 🎁`);
            refreshSentMessages();
            // Reset form
            setTextMessage('');
            setSelectedImage(null);
            setAudioBlob(null);
            setRecordingTime(0);
            setSelectedUsers([]);
            setOpen(false);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[44px] h-auto"
                  >
                    {selectedUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedUsers.map(u => (
                                <Badge key={u} variant="secondary" className="mr-1 mb-1">
                                    {u}
                                    <div 
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleUser(u);
                                        }}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </div>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select recipients...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search elves..." />
                    <CommandList>
                        <CommandEmpty>No elf found.</CommandEmpty>
                        <CommandGroup>
                        {usersList.map((user) => (
                            <CommandItem
                            key={user.username}
                            value={user.username}
                            onSelect={() => {
                                toggleUser(user.username);
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedUsers.includes(user.username) ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {user.avatar} {user.username}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Tabs defaultValue="text" value={messageType} onValueChange={(v) => setMessageType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" /> Text</TabsTrigger>
                <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" /> Image</TabsTrigger>
                <TabsTrigger value="audio"><Mic className="w-4 h-4 mr-2" /> Voice</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4">
                 <Textarea 
                    placeholder="Write your secret message..." 
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    className="min-h-[120px]"
                 />
              </TabsContent>

              <TabsContent value="image" className="mt-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="image-upload"
                        onChange={handleImageSelect}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer w-full flex flex-col items-center">
                        {selectedImage ? (
                            <div className="relative">
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-32 object-contain rounded-md" />
                                <div className="mt-2 text-sm font-medium text-green-600">{selectedImage.name}</div>
                            </div>
                        ) : (
                            <>
                                <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 font-medium">Click to upload image (Max 5MB)</span>
                            </>
                        )}
                      </label>
                  </div>
              </TabsContent>

              <TabsContent value="audio" className="mt-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                     {audioBlob ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-green-700 font-bold">
                                <Check className="w-5 h-5" /> Recorded successfully
                            </div>
                            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                            <Button variant="outline" onClick={clearAudio} size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" /> Discard
                            </Button>
                        </div>
                     ) : (
                        <>
                            <div className="text-4xl font-mono font-bold text-slate-700 mb-4">
                                {formatTime(recordingTime)}
                            </div>
                            <Button
                                size="lg"
                                className={cn(
                                    "rounded-full w-16 h-16 flex items-center justify-center transition-all",
                                    isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary hover:bg-primary/90"
                                )}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                            </Button>
                            <p className="mt-4 text-sm text-muted-foreground">
                                {isRecording ? "Recording... Click to stop" : "Click mic to record a carol or message"}
                            </p>
                        </>
                     )}
                  </div>
              </TabsContent>
            </Tabs>

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
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-primary mb-1">To: {msg.to_username}</p>
                        <div className="text-sm truncate">
                          {msg.type === 'text' && msg.body}
                          {msg.type === 'image' && <span className="flex items-center gap-1 text-muted-foreground"><ImageIcon className="w-3 h-3"/> Image Sent</span>}
                          {msg.type === 'audio' && <span className="flex items-center gap-1 text-muted-foreground"><Mic className="w-3 h-3"/> Voice Note Sent</span>}
                        </div>
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