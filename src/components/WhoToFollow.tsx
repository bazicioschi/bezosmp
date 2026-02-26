import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { OnlineStatus } from './OnlineStatus';
import { useFollows } from '@/hooks/useFollows';

interface SuggestedUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export function WhoToFollow() {
  const { user } = useAuth();
  const { playClick, playPop } = useSoundEffects();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const { isFollowing, toggleFollow } = useFollows();

  useEffect(() => {
    fetchSuggestedUsers();
  }, [user]);

  const fetchSuggestedUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .neq('user_id', user?.id || '')
      .limit(3);
    
    if (data) {
      setUsers(data);
    }
  };

  const handleFollow = (userId: string) => {
    playPop();
    toggleFollow(userId);
  };

  if (users.length === 0) return null;

  return (
    <div className="minecraft-card p-4">
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="mc-slot h-8 w-8 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <h3 className="mc-text text-lg text-foreground glow-text">WHO TO FOLLOW</h3>
      </div>

      <div className="space-y-3">
        {users.map((suggestedUser) => (
          <div key={suggestedUser.user_id} className="flex items-center gap-3">
            <Link to={`/user/${suggestedUser.user_id}`} onClick={() => playClick()}>
              <div className="mc-slot h-10 w-10 p-0.5 hover:mc-slot-active transition-all relative">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={suggestedUser.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                  <AvatarFallback className="bg-secondary text-primary mc-text rounded-none">
                    {suggestedUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <OnlineStatus 
                  isOnline={Math.random() > 0.5} 
                  className="absolute -bottom-0.5 -right-0.5" 
                />
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link 
                to={`/user/${suggestedUser.user_id}`} 
                onClick={() => playClick()}
                className="block"
              >
                <p className="mc-text text-sm text-foreground truncate hover:text-primary transition-colors">
                  {suggestedUser.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{suggestedUser.username.toLowerCase()}
                </p>
              </Link>
            </div>

            <Button
              size="sm"
              variant={isFollowing(suggestedUser.user_id) ? "outline" : "default"}
              onClick={() => handleFollow(suggestedUser.user_id)}
              className={isFollowing(suggestedUser.user_id) ? "mc-btn h-8" : "mc-btn-primary h-8"}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              <span className="mc-text text-xs">
                {isFollowing(suggestedUser.user_id) ? 'FOLLOWING' : 'FOLLOW'}
              </span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
