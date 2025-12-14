"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Ghost } from 'lucide-react';
import { createUser } from '@/services/mockService';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    
    createUser(username.trim());
    toast.success("Welcome to Secret Santa!");
    onLogin(username.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Ghost className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Secret Santa</CardTitle>
          <CardDescription>
            Enter a username to start sending anonymous messages.
            No passwords, just fun!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Choose a username..." 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-center text-lg"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Enter App
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;