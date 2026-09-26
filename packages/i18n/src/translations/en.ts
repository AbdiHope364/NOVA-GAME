export const en = {
  common: {
    appName: 'NOVA GAMING',
    gameLobby: 'Game Lobby',
    playableModules: 'Playable Modules',
    roadmapModules: 'Roadmap Modules',
    balance: 'Balance',
    platformWallet: 'Platform Wallet',
    signIn: 'Sign In',
    register: 'Register',
    logout: 'Sign Out',
    playNow: 'PLAY NOW 🪙',
    comingSoon: 'COMING SOON',
    recentGames: 'Recent Games',
    liveFeed: 'Live Feed',
    provablyFair: 'Provably Fair',
    provablyFairEngine: 'Provably Fair Engine',
    hmacValidation: 'Cryptographically verifiable HMAC-SHA256 outcome randomness.',
    loading: 'Loading...',
  },
  games: {
    coinFlip: {
      title: 'COIN FLIP',
      subtitle: 'Choose side → Enter bet → Flip → Win 1.96x',
      heads: 'HEADS',
      tails: 'TAILS',
      chooseSide: 'Choose your side',
      betAmount: 'Bet Amount',
      payoutMultiplier: '1.96x Payout',
      flipCoin: 'FLIP 🪙',
      flipping: 'FLIPPING COIN...',
      winAmount: 'Win',
      youWon: 'YOU WON!',
      youLost: 'YOU LOST',
      flipped: 'Flipped',
    },
    dice: {
      title: 'DICE',
      subtitle: 'Roll under or over target number.',
    },
    crash: {
      title: 'CRASH ROCKET',
      subtitle: 'Watch rocket multiplier curve climb.',
    },
    roulette: {
      title: 'ROULETTE',
      subtitle: 'European single zero roulette wheel.',
    }
  },
  errors: {
    insufficientBalance: 'Insufficient balance in wallet',
    invalidBet: 'Invalid bet amount',
    unauthorized: 'Unauthorized access',
  }
};

export type TranslationKeys = typeof en;
