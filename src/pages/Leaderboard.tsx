import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getLeaderboard, LeaderboardEntry } from '@/services/mockService';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getLeaderboard().then(setEntries);
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-transparent pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <Card className="border-primary/20 shadow-lg bg-white/90 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit mb-2">
                <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl font-serif text-primary">Elf Leaderboard</CardTitle>
            <p className="text-muted-foreground">Who is the master sleuth of the North Pole?</p>
          </CardHeader>
          <CardContent>
             {entries.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground">
                     <p>No points awarded yet! Start guessing.</p>
                 </div>
             ) : (
                 <ScrollArea className="h-[500px] pr-4">
                     <div className="space-y-2">
                        {entries.map((entry, index) => (
                            <div 
                                key={entry.username} 
                                className={`flex items-center p-4 rounded-lg border ${index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}
                            >
                                <div className="mr-4">
                                    {getRankIcon(index)}
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{entry.avatar}</span>
                                    <span className={`font-bold ${index === 0 ? 'text-lg' : ''}`}>{entry.username}</span>
                                </div>
                                <div className="font-mono font-bold text-primary text-lg">
                                    {entry.score} pts
                                </div>
                            </div>
                        ))}
                     </div>
                 </ScrollArea>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;