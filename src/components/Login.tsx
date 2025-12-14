"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Gift, Loader2, RefreshCw } from 'lucide-react';
import { authenticate, resetAdmin, User } from '@/services/mockService';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    
    setLoading(true);
    try {
      const user = await authenticate(username.trim(), password.trim());
      if (user) {
        toast.success(`Welcome back, ${user.username}! 🎄`);
        onLogin(user);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdmin = async () => {
    setResetting(true);
    toast.info("Resetting admin user... please wait.");
    try {
        const result = await resetAdmin();
        if (result.success) {
            toast.success("Admin reset! Try logging in now.");
            setUsername('admin');
            setPassword('admin123');
        } else {
            toast.error(`Failed: ${result.message || 'Unknown error'}`);
        }
    } catch (e: any) {
        toast.error(`Error: ${e.message || 'Unknown error'}`);
    } finally {
        setResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 relative z-10">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-xl border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 p-4 rounded-full w-fit mb-4 animate-bounce">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary font-bold font-serif">Secret Santa Login</CardTitle>
          <CardDescription>
            Ho Ho Ho! Please sign in to access your dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-lg border-green-200 focus:border-primary"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Input 
                  type="password"
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg border-green-200 focus:border-primary"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2 items-center text-xs text-muted-foreground mt-2">
                <span>(Default Admin: admin / admin123)</span>
                <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    onClick={handleResetAdmin}
                    disabled={resetting || loading}
                    className="text-red-500 h-auto p-0"
                >
                    {resetting ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Trouble logging in? Reset Admin
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg" disabled={loading || resetting}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Open My Gift 🎁"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;