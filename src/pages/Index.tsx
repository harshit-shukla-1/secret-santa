import React, { useState, useEffect } from 'react';
import Login from '@/components/Login';
import SendMessage from '@/components/SendMessage';
import Inbox from '@/components/Inbox';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Toaster } from 'sonner';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Check if we have a session in memory (optional, for refresh)
  // For this simple demo we'll require login on refresh unless we persist to sessionStorage
  
  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Login onLogin={setCurrentUser} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {currentUser[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <h1 className="font-bold">{currentUser}</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <SendMessage currentUser={currentUser} />
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Tip:</p>
              <p>To test this app, open it in another tab (or Incognito window), create a different user, and send messages back and forth!</p>
            </div>
          </div>
          <div className="md:h-[600px]">
            <Inbox currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;