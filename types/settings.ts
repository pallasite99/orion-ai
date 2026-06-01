import type { UserPreferences } from './user';

export interface AppSettings extends UserPreferences {
  compactMode: boolean;
  soundEnabled: boolean;
  autoSeed: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  compactMode: false,
  soundEnabled: true,
  autoSeed: true,
  theme: 'dark',
  orion_tone: 'friendly',
  voice_enabled: false,
  memory_enabled: true,
  learning_enabled: true,
  language: 'en',
  timezone: 'UTC',
};
