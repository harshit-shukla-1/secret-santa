import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Message, getAllMessages, getSessionUser, deleteMessage, 
  User, getPublicWallStatus, Comment, getComments, addComment, deleteComment 
} from '@/services/mockService';
import { Music, ArrowLeft, Gift, Trash2, Lock, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const CommentDialog = ({ message, currentUser }: { message: Message, currentUser: User | null }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadComments = async () => {
    if (!isOpen) return;
    const data = await getComments(message.id);
    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    const success = await addComment(message.id, currentUser.username, currentUser.avatar || '👤', newComment.trim());
    setLoading(false);

    if (success) {
      setNewComment('');
      loadComments();
      toast.success("Comment added!");
    } else {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("Delete this comment?")) {
        await deleteComment(commentId);
        loadComments();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comments on Gift to {message.to_username}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                <MessageCircle className="w-10 h-10 mb-2" />
                <p>No comments yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-sm group">
                    <div className="flex-shrink-0 text-2xl bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center">
                        {comment.avatar}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                         <span className="font-bold text-gray-900">{comment.username}</span>
                         <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed bg-slate-50 p-2 rounded-lg rounded-tl-none">
                        {comment.body}
                      </p>
                      
                      {(currentUser?.role === 'admin' || currentUser?.username === comment.username) && (
                          <button 
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="pt-4 mt-auto border-t">
            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    placeholder="Spread some joy..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={loading || !newComment.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
                </form>
            ) : (
                <p className="text-center text-sm text-muted-foreground">Log in to comment</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PublicWall = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMessages = async () => {
    const msgs = await getAllMessages();
    setMessages(msgs);
  };

  useEffect(() => {
    const init = async () => {
        const user = await getSessionUser();
        setCurrentUser(user);
        
        const isWallEnabled = await getPublicWallStatus();
        
        // If wall is disabled and user is not admin, deny access
        if (!isWallEnabled && user?.role !== 'admin') {
            setAccessDenied(true);
        } else {
            await fetchMessages();
        }
        setLoading(false);
    };
    init();

    const interval = setInterval(async () => {
        const isWallEnabled = await getPublicWallStatus();
        // Dynamic check if status changes while on page
        if (!isWallEnabled && currentUser?.role !== 'admin') {
            setAccessDenied(true);
        } else if (!accessDenied) {
            // Optional: Auto-refresh content could go here, but might disturb active comments
        }
    }, 5000);
    return () => clearInterval(interval);
  }, [accessDenied, currentUser]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this message from the wall?")) {
      await deleteMessage(id);
      await fetchMessages();
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

  if (loading) return null;

  if (accessDenied) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full">
                <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">The Wall is Closed</h1>
                <p className="text-muted-foreground mb-6">
                    Santa's elves are currently polishing the display case. The public wall is temporarily hidden by the admin.
                </p>
                <Button onClick={() => navigate('/')} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
                </Button>
            </div>
        </div>
      );
  }

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
            {!accessDenied && currentUser?.role === 'admin' && (
                 <div className="mt-2 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                    Admin View: Visible because you are admin
                 </div>
            )}
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
               <Card key={msg.id} className="hover:shadow-lg transition-shadow border-primary/10 overflow-hidden relative group flex flex-col">
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
                                <span className="font-bold text-green-800">{msg.to_username}</span>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                 </CardHeader>
                 <CardContent className="pt-4 bg-white flex-1">
                    {renderMessageContent(msg)}
                    <div className="mt-4 text-right">
                        <span className="text-xs text-muted-foreground font-mono">- Secret Santa</span>
                    </div>
                 </CardContent>
                 <CardFooter className="bg-slate-50/50 p-2 border-t flex justify-end">
                    <CommentDialog message={msg} currentUser={currentUser} />
                 </CardFooter>
               </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWall;