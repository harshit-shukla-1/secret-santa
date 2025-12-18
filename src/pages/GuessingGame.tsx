import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Message, getAllMessages, getSessionUser, User, 
  getUsers, submitGuess, getUserGuesses, Guess 
} from '@/services/mockService';
import { ArrowLeft, HelpCircle, CheckCircle, XCircle, Search, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from '@/components/ui/badge';

const GuessingGame = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [myGuesses, setMyGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const user = await getSessionUser();
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);
      
      const [allMsgs, allUsers, guesses] = await Promise.all([
        getAllMessages(),
        getUsers(),
        getUserGuesses(user.username)
      ]);

      // Filter out my own sent messages - I shouldn't guess my own!
      const othersMessages = allMsgs.filter(m => m.from_username !== user.username);
      setMessages(othersMessages);
      setUsers(allUsers.filter(u => u.username !== user.username));
      setMyGuesses(guesses);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleGuess = async (messageId: string, guessedUser: string) => {
    if (!currentUser) return;

    const result = await submitGuess(messageId, currentUser.username, guessedUser);

    if (result === 'limit_reached') {
        toast.error("You've already used your 2 guesses for this gift!");
        return;
    }

    if (result === 'error') {
        toast.error("Something went wrong.");
        return;
    }

    // Refresh guesses
    const updatedGuesses = await getUserGuesses(currentUser.username);
    setMyGuesses(updatedGuesses);

    if (result === 'correct') {
        toast.success("Correct! +1 Point 🎯");
    } else {
        toast.error("Wrong guess! Try again if you have attempts left.");
    }
  };

  const getMessageGuesses = (msgId: string) => {
    return myGuesses.filter(g => g.message_id === msgId);
  };

  const isSolved = (msgId: string) => {
    return getMessageGuesses(msgId).some(g => g.is_correct);
  };

  const renderMessageContent = (msg: Message) => {
      switch (msg.type) {
        case 'audio':
          return (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
              <Music className="w-4 h-4 text-primary" />
              <audio src={msg.body} controls className="h-8 w-full" />
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-primary/5 border-b border-primary/10 p-4 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Home
            </Button>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> Guess Who?
            </h1>
            <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        {messages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
                <p>No messages to guess yet!</p>
            </div>
        ) : (
            messages.map((msg) => {
                const guesses = getMessageGuesses(msg.id);
                const solved = isSolved(msg.id);
                const attemptsLeft = 2 - guesses.length;
                const canGuess = !solved && attemptsLeft > 0;

                return (
                    <Card key={msg.id} className={`overflow-hidden transition-all ${solved ? 'border-green-500 bg-green-50' : ''}`}>
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-base text-muted-foreground">
                                    Gift for <span className="font-bold text-foreground">{msg.to_username}</span>
                                </CardTitle>
                                {solved ? (
                                    <Badge className="bg-green-600 hover:bg-green-700">Solved +1</Badge>
                                ) : (
                                    <Badge variant="outline">{attemptsLeft} attempts left</Badge>
                                )}
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                {renderMessageContent(msg)}
                            </div>
                            
                            {/* Previous Guesses */}
                            {guesses.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {guesses.map(g => (
                                        <Badge key={g.id} variant={g.is_correct ? "default" : "destructive"} className={g.is_correct ? "bg-green-600" : ""}>
                                            {g.guessed_username} {g.is_correct ? <CheckCircle className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Guess Input */}
                            {canGuess && (
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium whitespace-nowrap">Who sent this?</p>
                                    <GuessSelector 
                                        users={users} 
                                        onSelect={(username) => handleGuess(msg.id, username)} 
                                    />
                                </div>
                            )}
                            
                            {!canGuess && !solved && (
                                <p className="text-sm text-red-500 font-medium">Out of attempts! Better luck next time.</p>
                            )}
                        </CardContent>
                    </Card>
                );
            })
        )}
      </div>
    </div>
  );
};

const GuessSelector = ({ users, onSelect }: { users: User[], onSelect: (u: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {value ? value : "Select suspect..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search elves..." />
            <CommandList>
                <CommandEmpty>No elf found.</CommandEmpty>
                <CommandGroup>
                {users.map((user) => (
                    <CommandItem
                        key={user.username}
                        value={user.username}
                        onSelect={(currentValue) => {
                            setValue(currentValue);
                            setOpen(false);
                            onSelect(user.username);
                        }}
                    >
                    {user.avatar} {user.username}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
}

export default GuessingGame;