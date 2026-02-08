import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export function MentionInput({ value, onChange, placeholder, className, maxLength }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all profiles for suggestions
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-mentions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .order('username');
      return (data || []) as Profile[];
    },
  });

  // Filter profiles based on mention query
  const filteredProfiles = profiles.filter(profile =>
    profile.username.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  const handleSelectUser = (username: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    // Replace the @query with @username
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const newTextBeforeCursor = textBeforeCursor.slice(0, -mentionMatch[0].length) + `@${username} `;
      const newValue = newTextBeforeCursor + textAfterCursor;
      onChange(newValue);
      
      // Move cursor after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = newTextBeforeCursor.length;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowSuggestions(false);
    setMentionQuery('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && filteredProfiles.length > 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      if (e.key === 'Tab' && filteredProfiles.length > 0) {
        e.preventDefault();
        handleSelectUser(filteredProfiles[0].username);
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
      />
      
      {showSuggestions && filteredProfiles.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
        >
          {filteredProfiles.map((profile) => (
            <button
              key={profile.user_id}
              type="button"
              onClick={() => handleSelectUser(profile.username)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="mc-slot h-8 w-8 p-0.5 shrink-0">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={profile.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                  <AvatarFallback className="bg-secondary text-primary mc-text text-sm rounded-none">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="mc-text text-sm text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">@{profile.username.toLowerCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
