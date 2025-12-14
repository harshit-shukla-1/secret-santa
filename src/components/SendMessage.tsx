"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUsers, sendMessage, User } from '@/services/mockService';
import { toast } from 'sonner';
import { Send, Mic, Image as ImageIcon, Type, StopCircle, Trash2 } from 'lucide-react';

interface SendMessageProps {
  currentUser: User;
}

const SendMessage = ({ currentUser }: SendMessageProps) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [textMessage, setTextMessage] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Image state
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const users = getUsers().filter(u => u.username !== currentUser.username);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Simple size check
          if (base64.length > 2000000) { // ~2MB limit
            toast.error("Audio recording too long for demo storage!");
          } else {
            setAudioData(base64);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied or not available");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Image Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for localStorage safety
        toast.error("Image too large! Please use a smaller image (< 500KB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!selectedUser) {
      toast.error("Please select a recipient (Who has been naughty or nice?)");
      return;
    }

    let success = false;
    if (activeTab === 'text') {
      if (!textMessage.trim()) return toast.error("Write a message!");
      success = sendMessage(selectedUser, textMessage, 'text');
    } else if (activeTab === 'audio') {
      if (!audioData) return toast.error("Record a message first!");
      success = sendMessage(selectedUser, audioData, 'audio');
    } else if (activeTab === 'image') {
      if (!imageData) return toast.error("Select an image first!");
      success = sendMessage(selectedUser, imageData, 'image');
    }

    if (success) {
      toast.success(`Secret gift sent to ${selectedUser}! 🎁`);
      // Reset
      setTextMessage('');
      setAudioData(null);
      setImageData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast.error("Failed to send. Storage might be full!");
    }
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Send className="w-5 h-5" />
          Send Anonymous Surprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">To:</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a colleague..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text"><Type className="w-4 h-4 mr-2"/> Text</TabsTrigger>
            <TabsTrigger value="audio"><Mic className="w-4 h-4 mr-2"/> Voice</TabsTrigger>
            <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2"/> Image</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <Textarea 
              placeholder="Write your secret message..." 
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              className="min-h-[120px]"
            />
          </TabsContent>

          <TabsContent value="audio" className="mt-4 flex flex-col items-center gap-4 py-8 bg-slate-50 rounded-md border border-dashed">
            {audioData ? (
              <div className="flex flex-col items-center gap-2">
                <audio src={audioData} controls />
                <Button variant="destructive" size="sm" onClick={() => setAudioData(null)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Discard
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button 
                  size="lg" 
                  variant={isRecording ? "destructive" : "default"}
                  className={`rounded-full w-16 h-16 ${isRecording ? 'animate-pulse' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <StopCircle className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {isRecording ? "Recording... Click to stop" : "Click to record voice note"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="image" className="mt-4">
             <div className="flex flex-col items-center gap-4 py-8 bg-slate-50 rounded-md border border-dashed">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              {imageData ? (
                <div className="relative">
                  <img src={imageData} alt="Preview" className="max-h-40 rounded-md shadow" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 rounded-full h-8 w-8"
                    onClick={() => { setImageData(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              )}
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSend} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
          Send Anonymously 🎅
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SendMessage;