import React, { useState } from 'react';
import Login from '@/components/Login';
import SendMessage from '@/components/SendMessage';
import Inbox from '@/components/Inbox';
import AdminDashboard from '@/components/AdminDashboard';
import AvatarSelector from '@/components/AvatarSelector';
import UpdatePasswordDialog from '@/components/UpdatePasswordDialog';
import { Button } from '@/components/ui/button';
import { LogOut, Globe } from 'lucide-react';
import { Toaster } from 'sonner';
import { User } from '@/services/mockService';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAvatarUpdate = (newAvatar: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar: newAvatar });
    }
  };

  // Snowflakes Background
  const snowflakes = Array.from({ length: 12 }).map((_, i) => (
    <div key={i} className="snowflake">❅</div>
  ));

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 via-red-900 to-green-950 relative overflow-hidden">
        {snowflakes}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544979590-2c35e3940177?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 pt-20">
          <Login onLogin={setCurrentUser} />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
       {/* Simple festive background header */}
       <div className="h-64 bg-gradient-to-r from-green-700 to-green-900 relative overflow-hidden">
          {snowflakes}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
          <div className="container mx-auto pt-10 px-4 text-white">
            <h1 className="text-4xl font-bold font-serif mb-2 text-shadow">🎄 Secret Santa HQ</h1>
            <p className="opacity-90">Spread joy anonymously!</p>
            <div className="mt-4">
                 <Button 
                    onClick={() => navigate('/wall')} 
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm"
                 >
                    <Globe className="w-4 h-4 mr-2" />
                    View Public Wall
                 </Button>
            </div>
          </div>
       </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10 pb-10">
        
        {/* User Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t-4 border-primary">
          <div className="flex items-center gap-4">
            <AvatarSelector user={currentUser} onUpdate={handleAvatarUpdate} />
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {currentUser.username}
                {currentUser.role === 'admin' && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full border border-red-200">Admin</span>}
              </h2>
              <div className="mt-1">
                 <UpdatePasswordDialog user={currentUser} />
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Dashboard Content */}
        {currentUser.role === 'admin' ? (
          <div className="space-y-8">
            <AdminDashboard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SendMessage currentUser={currentUser} />
               <Inbox currentUser={currentUser.username} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <SendMessage currentUser={currentUser} />
              
              <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-green-800 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <span className="text-xl">🦌</span> 
                  Reindeer Tip:
                </h3>
                <p>Click your avatar picture above to change your holiday character! Send a voice note to sing a carol anonymously.</p>
              </div>
            </div>
            
            <div className="h-full">
              <Inbox currentUser={currentUser.username} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;