import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Message, getAllMessages, getPersistedUser, deleteMessage, User } from '@/services/mockService';
import { Music, ArrowLeft, Gift, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PublicWall = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUser(getPersistedUser());
    setMessages(getAllMessages());
    const interval = setInterval(() => setMessages(getAllMessages()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this message from the wall?")) {
      deleteMessage(id);
      setMessages(getAllMessages());
      toast.success("Message removed from wall");
    }
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'audio':
        return (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Voice Note Sent</span>
            {/* Audio controls hidden on public wall for privacy/noise, or can be shown */}
            <audio src={msg.body} controls className="h-8 w-40" />
          </div>
        );
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden border border-border mt-2">
             <img src={msg.body} alt="Secret Gift" className="w-full max-h-60 object-cover" />
          </div>
        );
      default:
        return <p className="text-lg font-serif italic text-slate-700 leading-relaxed">"{msg.body}"</p>;
    }
  };

  // Snowflakes Background
  const snowflakes = Array.from({ length: 12 }).map((_, i) => (
    <div key={i} className="snowflake">❅</div>
  ));

  return (
    <div className="min-h-screen bg-slate-50 relative pb-10">
      <div className="h-48 bg-gradient-to-r from-red-700 to-red-900 relative overflow-hidden mb-8 shadow-md">
          {snowflakes}
          <div className="absolute top-4 left-4 z-20">
            <Button variant="secondary" onClick={() => navigate('/')} className="bg-white/20 hover:bg-white/30 text-white border-none">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
          <div className="container mx-auto pt-16 px-4 text-center text-white relative z-10">
            <h1 className="text-4xl font-bold font-serif mb-2 text-shadow flex items-center justify-center gap-3">
               <Gift className="w-8 h-8" />
               The Holiday Wall of Joy
               <Gift className="w-8 h-8" />
            </h1>
            <p className="opacity-90">Witness the spirit of giving!</p>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>The wall is empty... start spreading joy!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {messages.map((msg) => (
               <Card key={msg.id} className="hover:shadow-lg transition-shadow border-primary/10 overflow-hidden relative group">
                 {currentUser?.role === 'admin' && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(msg.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                 )}
                 <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-2 border-b border-green-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🎁</span>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">To</span>
                                <span className="font-bold text-green-800">{msg.to}</span>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                 </CardHeader>
                 <CardContent className="pt-4 bg-white">
                    {renderMessageContent(msg)}
                    <div className="mt-4 text-right">
                        <span className="text-xs text-muted-foreground font-mono">- Secret Santa</span>
                    </div>
                 </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWall;