// Sound effects using free sounds from Pixabay (CC0 / Free license)
// Sources: https://pixabay.com/sound-effects/

const SOUND_BASE = "https://cdn.pixabay.com/audio";

export type SoundKey = 
  | "cardDeal"      // Card dealing sound
  | "cardFlip"      // Card flip/reveal sound
  | "chipClick"     // Chip click/placement sound
  | "chipStack"     // Chip stack sound
  | "win"           // Win sound
  | "lose"          // Lose sound
  | "allIn"         // All-in sound
  | "buttonClick"   // UI button click
  | "toast"         // Toast notification

interface SoundUrls {
  cardDeal: string;
  cardFlip: string;
  chipClick: string;
  chipStack: string;
  win: string;
  lose: string;
  allIn: string;
  buttonClick: string;
  toast: string;
}

const sounds: SoundUrls = {
  // Short card shuffling/dealing sound
  cardDeal: `${SOUND_BASE}/mp3/shuffling-cards-6269.mp3`,
  // Card flip or reveal sound
  cardFlip: `${SOUND_BASE}/mp3/card-flip-113458.mp3`,
  // Single chip click/placement
  chipClick: `${SOUND_BASE}/mp3/click-21796.mp3`,
  // Chip stacking sound
  chipStack: `${SOUND_BASE}/mp3/coins-159298.mp3`,
  // Win fanfare (short positive sound)
  win: `${SOUND_BASE}/mp3/success-1-6269.mp3`,
  // Lose sound (short negative sound)
  lose: `${SOUND_BASE}/mp3/fail-1-6269.mp3`,
  // All-in dramatic sound
  allIn: `${SOUND_BASE}/mp3/dramatic-hit-1-6269.mp3`,
  // UI button click
  buttonClick: `${SOUND_BASE}/mp3/click-21796.mp3`,
  // Toast notification sound
  toast: `${SOUND_BASE}/mp3/notification-1-6269.mp3`,
};

class SoundManager {
  private enabled: boolean = true;
  private cache: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private getSound(key: SoundKey): HTMLAudioElement | null {
    if (!this.enabled) return null;
    
    const url = sounds[key];
    if (!url) return null;

    // Check cache first
    if (this.cache.has(url)) {
      const audio = this.cache.get(url)!;
      audio.currentTime = 0;
      return audio;
    }

    // Create new audio element
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = this.volume;
    
    // Handle loading errors gracefully
    audio.onerror = () => {
      console.warn(`Failed to load sound: ${key}`);
      this.cache.delete(url);
    };

    this.cache.set(url, audio);
    return audio;
  }

  play(key: SoundKey) {
    const audio = this.getSound(key);
    if (!audio) return;

    // Reset and play
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignore autoplay errors (user interaction required)
    });
  }

  // Preload all sounds on user's first interaction
  preloadAll() {
    if (!this.enabled) return;
    
    Object.values(sounds).forEach((url) => {
      if (!this.cache.has(url)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = this.volume;
        this.cache.set(url, audio);
      }
    });
  }

  // Clear cache to free memory
  clearCache() {
    this.cache.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    this.cache.clear();
  }
}

export const soundManager = new SoundManager();

// Convenience functions for direct use
export const playSound = (key: SoundKey) => soundManager.play(key);
export const preloadSounds = () => soundManager.preloadAll();
