"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createUser, getUsers, User } from '@/services/mockService';
import { toast } from 'sonner';
import { UserPlus, Shield, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshUsers = async () => {
    const u = await getUsers();
    setUsers(u);
  };

  useEffect(() => {
    refreshUsers();
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

  return (
    <div className="grid gap-6">
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