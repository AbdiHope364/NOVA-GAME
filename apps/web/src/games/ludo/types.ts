import {
  LudoColor,
  LudoDifficulty,
  LudoMatchState,
  LudoPlayerCount,
  LudoRulesetOptions,
} from '@nova/game-ludo';

export type LudoTheme = 'dark' | 'light';
export type LudoLanguage = 'en' | 'om' | 'am';
export type LudoScreen = 'SPLASH' | 'SETUP' | 'GAME';
export type LudoPlayerType = 'HUMAN' | 'BOT_EASY' | 'BOT_HARD';

export interface LudoPlayerConfig {
  seat: number;
  color: LudoColor;
  name: string;
  type: LudoPlayerType;
  avatar: string;
  level: number;
}

export interface LudoUiSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  theme: LudoTheme;
  animationSpeed: 'NORMAL' | 'FAST';
  autoMoveSingle: boolean;
  language: LudoLanguage;
}

export interface LudoMoveLogEntry {
  id: string;
  turnNumber: number;
  seat: number;
  color: LudoColor;
  playerName: string;
  dice: number;
  fromProgress: number;
  toProgress: number;
  action: 'ROLL' | 'MOVE' | 'LEAVE_BASE' | 'CAPTURE' | 'FINISH' | 'PASS' | 'TRIPLE_SIX';
  text: string;
  timestamp: number;
}

export const LUDO_COLORS: Record<
  LudoColor,
  {
    hex: string;
    light: string;
    dark: string;
    bg: string;
    text: string;
    border: string;
    glow: string;
    shape: 'circle' | 'square' | 'triangle' | 'diamond';
    letter: 'R' | 'G' | 'Y' | 'B';
    label: string;
  }
> = {
  RED: {
    hex: '#E53935',
    light: '#EF5350',
    dark: '#B71C1C',
    bg: 'bg-[#E53935]',
    text: 'text-[#E53935]',
    border: 'border-[#E53935]',
    glow: 'rgba(229, 57, 53, 0.55)',
    shape: 'circle',
    letter: 'R',
    label: 'Red',
  },
  GREEN: {
    hex: '#43A047',
    light: '#66BB6A',
    dark: '#1B5E20',
    bg: 'bg-[#43A047]',
    text: 'text-[#43A047]',
    border: 'border-[#43A047]',
    glow: 'rgba(67, 160, 71, 0.55)',
    shape: 'square',
    letter: 'G',
    label: 'Green',
  },
  YELLOW: {
    hex: '#FDD835',
    light: '#FFEE58',
    dark: '#F57F17',
    bg: 'bg-[#FDD835]',
    text: 'text-[#FDD835]',
    border: 'border-[#FDD835]',
    glow: 'rgba(253, 216, 53, 0.55)',
    shape: 'triangle',
    letter: 'Y',
    label: 'Yellow',
  },
  BLUE: {
    hex: '#1E88E5',
    light: '#42A5F5',
    dark: '#0D47A1',
    bg: 'bg-[#1E88E5]',
    text: 'text-[#1E88E5]',
    border: 'border-[#1E88E5]',
    glow: 'rgba(30, 136, 229, 0.55)',
    shape: 'diamond',
    letter: 'B',
    label: 'Blue',
  },
};

export const DEFAULT_LUDO_SETTINGS: LudoUiSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  theme: 'dark',
  animationSpeed: 'NORMAL',
  autoMoveSingle: true,
  language: 'en',
};

export const LUDO_TRANSLATIONS: Record<
  LudoLanguage,
  {
    title: string;
    subtitle: string;
    playVsAi: string;
    passAndPlay: string;
    onlinePvP: string;
    rules: string;
    settings: string;
    resumeGame: string;
    startGame: string;
    playersCount: string;
    houseRules: string;
    blockRule: string;
    bonusOnCapture: string;
    rollSixToStart: string;
    exactFinish: string;
    yourTurn: string;
    tapDice: string;
    selectToken: string;
    capturedToast: string;
    rollAgain: string;
    winner: string;
    playAgain: string;
    backHome: string;
    sound: string;
    theme: string;
    speed: string;
    language: string;
  }
> = {
  en: {
    title: 'NOVA LUDO',
    subtitle: 'Classic strategy board game for 2 to 4 players',
    playVsAi: 'Play vs Computer',
    passAndPlay: 'Pass & Play (Local)',
    onlinePvP: 'Online Multiplayer',
    rules: 'Official Rules',
    settings: 'Game Settings',
    resumeGame: 'Resume Saved Match',
    startGame: 'Start Game',
    playersCount: 'Number of Players',
    houseRules: 'House Rules & Variations',
    blockRule: 'Blockades (2+ Tokens on Same Square)',
    bonusOnCapture: 'Bonus Turn After Capture',
    rollSixToStart: 'Must Roll 6 to Leave Base',
    exactFinish: 'Exact Roll to Finish',
    yourTurn: 'Your Turn',
    tapDice: 'Tap the dice to roll',
    selectToken: 'Select a highlighted token to move',
    capturedToast: 'Token Captured!',
    rollAgain: 'Roll Again!',
    winner: 'Winner Celebration',
    playAgain: 'Play Again',
    backHome: 'Back to Home',
    sound: 'Sound Effects',
    theme: 'Display Theme',
    speed: 'Animation Speed',
    language: 'Language',
  },
  om: {
    title: 'NOVA LUDO',
    subtitle: 'Taphata sararaa aadaa taphattoota 2 hanga 4',
    playVsAi: 'Kompitarriin Taphadhu',
    passAndPlay: 'Bakkuma Tokkotti Taphadhaa',
    onlinePvP: 'Taphata Toora Interneetii',
    rules: 'Seerota Taphaa',
    settings: 'Qindaa’ina',
    resumeGame: 'Tapha Itti Fufi',
    startGame: 'Tapha Jalqabi',
    playersCount: 'Baay’ina Taphattootaa',
    houseRules: 'Seerota Dabalataa',
    blockRule: 'Cufaa (Koonii 2 iddoo tokkotti)',
    bonusOnCapture: 'Qabuu irratti carraa dabalataa',
    rollSixToStart: 'Ba’uuf 6 barbaachisa',
    exactFinish: 'Galuuf lakkoofsa sirrii',
    yourTurn: 'Dabareen Kee',
    tapDice: 'Daayisii tuqi',
    selectToken: 'Koonii sochoosu filadhu',
    capturedToast: 'Kooniin Qabameera!',
    rollAgain: 'Ammas Buusi!',
    winner: 'Mo’ataa!',
    playAgain: 'Ammas Taphadhu',
    backHome: 'Gara Jalqabaatti',
    sound: 'Sagalee',
    theme: 'Bifaan',
    speed: 'Saffisa',
    language: 'Afaan',
  },
  am: {
    title: 'ኖቫ ሉዶ',
    subtitle: 'ለ 2 እስከ 4 ተጫዋቾች የተዘጋጀ ክላሲክ የቦርድ ጨዋታ',
    playVsAi: 'ከኮምፒውተር ጋር ይጫወቱ',
    passAndPlay: 'በአንድ ስልክ ተራ በተራ',
    onlinePvP: 'የመስመር ላይ ጨዋታ',
    rules: 'የጨዋታ ህጎች',
    settings: 'ማስተካከያ',
    resumeGame: 'ያቆሙበትን ይቀጥሉ',
    startGame: 'ጨዋታ ጀምር',
    playersCount: 'የተጫዋቾች ብዛት',
    houseRules: 'ልዩ የጨዋታ ህጎች',
    blockRule: 'መንገድ መዝጋት (2 ቶከን)',
    bonusOnCapture: 'ሲበሉ ተጨማሪ እድል',
    rollSixToStart: 'ለመውጣት 6 ያስፈልጋል',
    exactFinish: 'ለመግባት ትክክለኛ ቁጥር',
    yourTurn: 'የእርስዎ ተራ',
    tapDice: 'ዳይሱን ይንኩት',
    selectToken: 'የሚንቀሳቀስ ቶከን ይምረጡ',
    capturedToast: 'ተበልቷል!',
    rollAgain: 'እንደገና ያንከብልሉ!',
    winner: 'አሸናፊ!',
    playAgain: 'እንደገና ይጫወቱ',
    backHome: 'ወደ መነሻ ገጽ',
    sound: 'ድምፅ',
    theme: 'ገጽታ',
    speed: 'የእንቅስቃሴ ፍጥነት',
    language: 'ቋንቋ',
  },
};
