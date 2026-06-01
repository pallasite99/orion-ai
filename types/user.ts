export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  orion_tone?: 'formal' | 'friendly' | 'technical' | 'casual';
  voice_enabled?: boolean;
  memory_enabled?: boolean;
  learning_enabled?: boolean;
  language?: string;
  timezone?: string;
}
