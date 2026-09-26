import { TranslationKeys } from './en.js';

export const am: TranslationKeys = {
  common: {
    appName: 'NOVA GAMING',
    gameLobby: 'የጨዋታዎች ማዕከል',
    playableModules: 'አሁን የሚጫወቱ ጨዋታዎች',
    roadmapModules: 'በቅርብ የሚመጡ ጨዋታዎች',
    balance: 'ቀሪ ሂሳብ',
    platformWallet: 'የፕላትፎርም ቦርሳ',
    signIn: 'ግቡ',
    register: 'ተመዝገብ',
    logout: 'ውጡ',
    playNow: 'አሁን ተጫወት 🪙',
    comingSoon: 'በቅርብ ቀን',
    recentGames: 'የቅርብ ጊዜ ጨዋታዎች',
    liveFeed: 'ቀጥታ ስርጭት',
    provablyFair: 'የተረጋገጠ ፍትሃዊነት',
    provablyFairEngine: 'የፍትሃዊነት ማረጋገጫ ሞተር',
    hmacValidation: 'በHMAC-SHA256 የተረጋገጠ የጨዋታ እድል ፍትሃዊነት።',
    loading: 'በመጫን ላይ...',
  },
  games: {
    coinFlip: {
      title: 'የሳንቲም ማሽከርከር (COIN FLIP)',
      subtitle: 'ጎን ይምረጡ → የመደብ መጠን ያስገቡ → ያሽከርክሩ → 1.96x ያሸንፉ',
      heads: 'HEADS (ራስ)',
      tails: 'TAILS (ጅራት)',
      chooseSide: 'የመረጡትን ጎን ይምረጡ',
      betAmount: 'የመደብ መጠን (ETB)',
      payoutMultiplier: '1.96x ክፍያ',
      flipCoin: 'ሳንቲም አሽከርክር 🪙',
      flipping: 'እየተሽከረከረ ነው...',
      winAmount: 'የአሸናፊነት ክፍያ',
      youWon: 'አሸንፈዋል! 🎉',
      youLost: 'ተሸንፈዋል 💥',
      flipped: 'የወጣው ጎን',
    },
    dice: {
      title: 'ዳይስ (DICE)',
      subtitle: 'ከዒላማው ቁጥር በላይ ወይም በታች ያሽከርክሩ።',
    },
    crash: {
      title: 'ክራሽ ሮኬት (CRASH)',
      subtitle: 'የሮኬቱን ማበልጸጊያ ቁጥር ይከታተሉ።',
    },
    roulette: {
      title: 'ሩሌት (ROULETTE)',
      subtitle: 'የአውሮፓ ሩሌት ጨዋታ።',
    }
  },
  errors: {
    insufficientBalance: 'በቂ ቀሪ ሂሳብ የለዎትም',
    invalidBet: 'ትክክለኛ ያልሆነ የመደብ መጠን',
    unauthorized: 'ያልተፈቀደ መዳረሻ',
  }
};
