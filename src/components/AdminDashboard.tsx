"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createUser, getUsers, deleteUser, User, getPublicWallStatus, setPublicWallStatus } from '@/services/mockService';
import { toast } from 'sonner';
import { UserPlus, Shield, Loader2, Trash2, Globe, Lock, Unlock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const AdminDashboard = () => {
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [publicWallEnabled, setPublicWallEnabled] = useState(true);

  const refreshUsers = async () => {
    const u = await getUsers();
    setUsers(u);
  };

  const refreshConfig = async () => {
    const status = await getPublicWallStatus();
    setPublicWallEnabled(status);
  };

  useEffect(() => {
    refreshUsers();
    refreshConfig();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser || !newPass) {
      toast.error("Username and Password required");
      return;
    }

    setLoading(true);
    const success = await createUser(newUser, newPass, 'user');
    setLoading(false);

    if (success) {
      toast.success(`Elf ${newUser} recruited!`);
      setNewUser('');
      setNewPass('');
      refreshUsers();
    } else {
      toast.error("Failed to create user. It may already exist.");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      toast.error("Cannot delete the main admin!");
      return;
    }
    
    if (confirm(`Are you sure you want to banish elf "${username}"?`)) {
      setLoading(true);
      const success = await deleteUser(username);
      setLoading(false);
      
      if (success) {
        toast.success(`User ${username} deleted.`);
        refreshUsers();
      } else {
        toast.error("Failed to delete user.");
      }
    }
  };

  const handleToggleWall = async (checked: boolean) => {
    setPublicWallEnabled(checked);
    const success = await setPublicWallStatus(checked);
    if (success) {
        toast.success(checked ? "Public Wall is now OPEN!" : "Public Wall is now CLOSED.");
    } else {
        toast.error("Failed to update setting");
        setPublicWallEnabled(!checked); // revert
    }
  };

  return (
    <div className="grid gap-6">
      {/* Global Settings */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Settings
            </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label htmlFor="wall-mode" className="text-base font-bold text-gray-800">
                    Public Wall Access
                </Label>
                <p className="text-sm text-muted-foreground">
                    {publicWallEnabled ? "The wall is currently visible to everyone." : "The wall is hidden from non-admin users."}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {publicWallEnabled ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-red-600" />}
                <Switch 
                    id="wall-mode" 
                    checked={publicWallEnabled}
                    onCheckedChange={handleToggleWall}
                />
            </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            Santa's User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 mb-8">
            <Input 
              placeholder="New Username" 
              value={newUser} 
              onChange={e => setNewUser(e.target.value)}
              disabled={loading}
            />
            <Input 
              placeholder="Password" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add Elf
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.username}>
                    <TableCell className="text-2xl">{user.avatar || '👤'}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== 'admin' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;