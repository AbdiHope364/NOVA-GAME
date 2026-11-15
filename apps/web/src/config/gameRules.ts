export interface GameRuleDoc {
  id: string;
  name: string;
  tagline: string;
  category: 'STRATEGY' | 'INSTANT' | 'TABLE' | 'CARDS' | 'ARCADE';
  accentColor: string;
  rtpOrPayout: string;
  overview: string;
  howToPlaySteps: { title: string; description: string }[];
  winningConditions: string[];
  drawOrRefundRules?: string;
  payoutExplanation: string;
  proTips: string[];
  boardIllustration?: string[];
}

export const GAME_RULES_DOCS: Record<string, GameRuleDoc> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe Arena',
    tagline: '3x3 Tactical Duel — Form 3 in a row before your opponent',
    category: 'STRATEGY',
    accentColor: '#00e5ff',
    rtpOrPayout: '1.90x / 100% Draw Refund',
    overview:
      'Tic-Tac-Toe is a classic two-player strategy game played on a 3x3 grid. Player X and Player O take turns placing their mark in empty cells. The first player to align 3 of their marks horizontally, vertically, or diagonally wins the match!',
    howToPlaySteps: [
      {
        title: 'Choose a Game Mode',
        description: 'Select Practice vs AI (Easy, Medium, Hard), Free Quick Match, Ranked Arena (Elo ratings), or Private 1v1 Room with a friend.',
      },
      {
        title: 'Place Your Mark on Your Turn',
        description: 'Player X goes first, followed by Player O. Tap any empty box to place your mark within the 15-second turn timer.',
      },
      {
        title: 'Block and Attack',
        description: 'Watch your opponent’s marks to block them from getting 3 in a row while creating dual-threat opportunities for yourself.',
      },
      {
        title: 'Settle the Match',
        description: 'The first to get 3 in a line wins! If all 9 squares are filled without 3 in a row, the match ends in a draw.',
      },
    ],
    winningConditions: [
      '3 Horizontal: Across the top, middle, or bottom row.',
      '3 Vertical: Down the left, center, or right column.',
      '3 Diagonal: From top-left to bottom-right or top-right to bottom-left.',
    ],
    drawOrRefundRules:
      'If all 9 squares are filled and neither player has 3 in a line, the game is a Draw. In competitive stake matches, 100% of your stake is instantly refunded back to your wallet!',
    payoutExplanation:
      'Winner takes the match prize pool (1.90x total stake after a 5% platform host fee). Practice and Ranked Arena modes are free to play.',
    proTips: [
      'Controlling the Center Square (cell 5) gives you 4 possible winning lines, while corner cells give you 3.',
      'Create a "Fork" (two simultaneous winning threats) so your opponent can only block one, guaranteeing your win on the next turn.',
      'Hard AI uses the mathematical Minimax algorithm and never makes mistakes — focus on playing defensively to force a draw.',
    ],
  },
  'dice': {
    id: 'dice',
    name: 'Dice',
    tagline: 'Provably fair rolls with custom risk and up to 99x multiplier',
    category: 'INSTANT',
    accentColor: '#06b6d4',
    rtpOrPayout: '99.0% RTP · Up to 99x',
    overview:
      'Roll a cryptographic die with transparent, verifiable odds. Choose either the classic 6-sided 3D die or the 0–100 Over/Under probability slider.',
    howToPlaySteps: [
      {
        title: 'Choose Your Mode',
        description: 'Switch between "6-Sided 3D Die" (pick numbers 1–6) or "Over/Under Slider" (custom 0–100 scale).',
      },
      {
        title: 'Set Your Target & Stake',
        description: 'In 6-sided mode, tap a number #1–#6 (5.94x payout). In Slider mode, pick Roll Under or Roll Over and set your Win Chance (2%–98%).',
      },
      {
        title: 'Roll the Die',
        description: 'Tap "ROLL DICE". The server seed and client seed combine to generate a provably fair cryptographic roll.',
      },
      {
        title: 'Collect Payout',
        description: 'If the roll satisfies your condition, your payout is credited instantly to your wallet!',
      },
    ],
    winningConditions: [
      '6-Sided Mode: The rolled die exactly matches your picked number (1 in 6 chance, 5.94x payout).',
      'Slider Under: The rolled number (0.00–100.00) is strictly less than your target.',
      'Slider Over: The rolled number is strictly greater than your target.',
    ],
    payoutExplanation:
      'Multiplier is calculated as 99 / WinChance%. At 50% win chance, multiplier is 1.98x. At 1% win chance, payout reaches 99.00x.',
    proTips: [
      'Use the 50% preset (1.98x) for balanced bankroll growth.',
      'Verify every single round using the SHA-256 server seed hash and client seed in the Provably Fair modal.',
    ],
  },
  'coin-flip': {
    id: 'coin-flip',
    name: 'Coin Flip',
    tagline: 'Fast Heads or Tails duel with true 50.0% odds and 1.98x payout',
    category: 'INSTANT',
    accentColor: '#f59e0b',
    rtpOrPayout: '99.0% RTP · 1.98x',
    overview:
      'The purest test of chance. Pick Heads or Tails, flip the golden coin, and double your stake with a true 50% mathematical probability.',
    howToPlaySteps: [
      {
        title: 'Choose Heads or Tails',
        description: 'Tap HEADS (Winged Helmet) or TAILS (Warrior Crest).',
      },
      {
        title: 'Enter Bet Amount',
        description: 'Choose your stake using ½, 2×, MAX or the quick-stake pills (+25, +50, +100 ETB).',
      },
      {
        title: 'Tap FLIP COIN',
        description: 'The 3D coin tumbles in real-time and settles cleanly on the outcome.',
      },
    ],
    winningConditions: [
      'Heads: The coin lands on HEADS matching your pick.',
      'Tails: The coin lands on TAILS matching your pick.',
    ],
    payoutExplanation:
      'Every win pays 1.98x your stake (e.g. 100 ETB bet returns 198 ETB total, 98 ETB net profit). 99.0% true RTP.',
    proTips: [
      'Each flip is completely independent; previous streaks do not alter the 50/50 probability of the next flip.',
      'Try the Multiplayer 1v1 Arena to duel real opponents head-to-head for the winner-takes-all pot.',
    ],
  },
  'crash': {
    id: 'crash',
    name: 'Crash (Aviator)',
    tagline: 'Watch the multiplier climb and cash out before the rocket crashes',
    category: 'INSTANT',
    accentColor: '#f43f5e',
    rtpOrPayout: '99.0% RTP · Up to 1,000x+',
    overview:
      'A thrilling real-time multiplier curve that climbs from 1.00x upwards. The higher it goes, the more you win — but if you don’t cash out before it crashes, you lose your stake!',
    howToPlaySteps: [
      {
        title: 'Place Bet Before Launch',
        description: 'Set your bet amount and optional Auto Cashout multiplier before the 5-second countdown ends.',
      },
      {
        title: 'Watch the Rocket Ascend',
        description: 'The multiplier starts at 1.00x and accelerates upwards into the stratosphere.',
      },
      {
        title: 'Cash Out in Time',
        description: 'Hit the green "CASH OUT" button at any moment to lock in your profit at the current multiplier.',
      },
    ],
    winningConditions: [
      'Cash Out Success: You press Cash Out or reach your Auto Cashout before the rocket crashes.',
    ],
    payoutExplanation:
      'Payout = Bet Amount × Multiplier at the exact millisecond of cash out.',
    proTips: [
      'Set an Auto Cashout between 1.30x and 1.80x for steady, low-risk returns.',
      'Never chase losses with giant bets after an early crash; the crash point is determined cryptographically before each round begins.',
    ],
  },
  'mines': {
    id: 'mines',
    name: 'Mines',
    tagline: 'Uncover sparkling gems across a hidden 5x5 grid — cash out anytime',
    category: 'STRATEGY',
    accentColor: '#8b5cf6',
    rtpOrPayout: '99.0% RTP · Up to 10,000x',
    overview:
      'A 5x5 grid hides 25 tiles containing safe Gems and explosive Mines. Every safe gem you uncover multiplies your winnings. Cash out whenever you want, or keep hunting for bigger multipliers!',
    howToPlaySteps: [
      {
        title: 'Configure Your Grid',
        description: 'Set your bet and select how many mines (1 to 24) are hidden on the grid.',
      },
      {
        title: 'Tap Tiles to Reveal',
        description: 'Click any square. A green gem increases your cash-out multiplier. A bomb detonates and ends the round.',
      },
      {
        title: 'Cash Out or Continue',
        description: 'You can tap CASH OUT after every single safe gem to bank your profit immediately.',
      },
    ],
    winningConditions: [
      'Any number of safe gems uncovered followed by pressing the CASH OUT button.',
    ],
    payoutExplanation:
      'Each gem multiplies your bankroll based on remaining tiles and mine count. 3 mines with 4 gems pays ~2.2x, while 10 gems pays over 15x.',
    proTips: [
      'Playing with 3–5 mines offers a great risk/reward ratio for finding 3–4 safe gems before cashing out.',
      'Greed is the biggest trap in Mines — have a target cash-out multiplier in mind before starting.',
    ],
  },
  'roulette': {
    id: 'roulette',
    name: 'Mini Roulette',
    tagline: '13-pocket wheel with single numbers, splits, and red/black colors',
    category: 'TABLE',
    accentColor: '#10b981',
    rtpOrPayout: '97.3% RTP · Up to 12x',
    overview:
      'A fast-paced mini roulette featuring 13 pockets: Green Zero (0) and numbers 1 through 12 split evenly between Red and Black.',
    howToPlaySteps: [
      {
        title: 'Select Chips',
        description: 'Pick your chip value (10, 50, 100, 500 ETB).',
      },
      {
        title: 'Place Your Bets',
        description: 'Bet on individual numbers, Red/Black, Even/Odd, Low (1–6), or High (7–12).',
      },
      {
        title: 'Spin the Wheel',
        description: 'Tap SPIN and watch the ball settle into the winning pocket.',
      },
    ],
    winningConditions: [
      'Straight Bet: The ball lands on your exact number (12x payout).',
      'Color Bet: The ball lands on your chosen Red or Black pocket (2x payout).',
      'Even/Odd or High/Low: The ball lands on your selected range (2x payout).',
    ],
    payoutExplanation:
      'Straight Up pays 12:1. Outside bets (Red/Black, Even/Odd, 1–6, 7–12) pay 2:1. Zero wins only straight bets on 0.',
    proTips: [
      'Combining an outside bet (e.g. Red) with a straight number bet gives you both high coverage and jackpot upside.',
    ],
  },
  'limbo': {
    id: 'limbo',
    name: 'Limbo',
    tagline: 'Aim for high orbital multipliers up to 1,000,000x',
    category: 'INSTANT',
    accentColor: '#a855f7',
    rtpOrPayout: '99.0% RTP · Up to 1,000,000x',
    overview:
      'Set your target multiplier anywhere from 1.01x to 1,000,000x. If the randomized rocket roll lands equal to or higher than your target, you win your full target payout!',
    howToPlaySteps: [
      {
        title: 'Set Target Multiplier',
        description: 'Enter your desired target (e.g. 2.00x, 10.00x, or 100.00x).',
      },
      {
        title: 'Check Win Probability',
        description: 'The game automatically calculates your exact win chance (e.g., 2.00x = 49.5% win chance).',
      },
      {
        title: 'Hit Play',
        description: 'If the result is ≥ your target, your wallet is credited instantly.',
      },
    ],
    winningConditions: [
      'The generated roll is greater than or equal to your chosen Target Multiplier.',
    ],
    payoutExplanation:
      'Win payout = Bet Amount × Target Multiplier.',
    proTips: [
      'Low targets (1.20x to 1.50x) win over 66% of the time, great for steady turnover.',
    ],
  },
  'plinko': {
    id: 'plinko',
    name: 'Plinko',
    tagline: 'Drop pins down a peg pyramid into high-multiplier buckets',
    category: 'ARCADE',
    accentColor: '#f97316',
    rtpOrPayout: '99.0% RTP · Up to 1,000x',
    overview:
      'Balls bounce down a triangular peg board, deflecting left or right with 50/50 probability at every pin, finally landing into multiplier buckets at the bottom.',
    howToPlaySteps: [
      {
        title: 'Choose Risk & Rows',
        description: 'Select Risk Level (Low, Medium, High) and Row Count (8 to 16 rows).',
      },
      {
        title: 'Drop Balls',
        description: 'Set your bet and tap DROP. You can drop multiple balls in rapid succession.',
      },
      {
        title: 'Score Multipliers',
        description: 'Center buckets have lower multipliers (~0.5x–1.0x), while outer corners pay huge jackpots (up to 1,000x)!',
      },
    ],
    winningConditions: [
      'Every ball that lands in a bucket with multiplier > 1.00x yields profit.',
    ],
    payoutExplanation:
      'The bucket value multiplied by your individual ball bet.',
    proTips: [
      'High Risk with 16 rows has outer corners paying up to 1,000x, but center buckets return 0.2x.',
      'Low Risk keeps nearly all buckets close to 1x, ensuring long bankroll endurance.',
    ],
  },
  'hilo': {
    id: 'hilo',
    name: 'Hi-Lo',
    tagline: 'Predict whether the next card is Higher or Lower',
    category: 'CARDS',
    accentColor: '#06b6d4',
    rtpOrPayout: '99.0% RTP · Compound Multipliers',
    overview:
      'A card is dealt face up. Guess whether the next card will be Higher, Lower, or Same. Each correct guess multiplies your running total, and you can cash out at any time!',
    howToPlaySteps: [
      {
        title: 'Inspect Current Card',
        description: 'Cards rank from Ace (low, 1) to King (high, 13).',
      },
      {
        title: 'Call Higher or Lower',
        description: 'Tap HIGHER or LOWER based on your odds.',
      },
      {
        title: 'Cash Out or Streak',
        description: 'Cash out your accrued profit after any correct card, or keep guessing to compound into huge payouts.',
      },
    ],
    winningConditions: [
      'Next dealt card matches your Higher/Lower call.',
    ],
    payoutExplanation:
      'Payout compounds with each correct call based on mathematical likelihood (calling Higher on a 2 pays less than calling Higher on a Queen).',
    proTips: [
      'Use the Skip button if you get a middle card (like a 7 or 8) where odds are close to 50/50.',
    ],
  },
  'bingo': {
    id: 'bingo',
    name: 'Bingo / Cartella',
    tagline: '75-Ball Ethiopian Cartella with live automated caller and line pots',
    category: 'TABLE',
    accentColor: '#0ea5e9',
    rtpOrPayout: 'Multiplayer Room Pot',
    overview:
      'Traditional 75-Ball Cartella bingo where numbers are drawn at random. Mark off called numbers on your 5x5 card to complete lines and score the full-house jackpot!',
    howToPlaySteps: [
      {
        title: 'Buy Your Cartella Cards',
        description: 'Select 1 or more cards for the upcoming round before the countdown timer expires.',
      },
      {
        title: 'Follow the Caller',
        description: 'Balls (1–75) are called every few seconds. Numbers are marked automatically or manually.',
      },
      {
        title: 'Claim BINGO',
        description: 'First player to complete a horizontal line, vertical line, or full cartella wins the prize pot!',
      },
    ],
    winningConditions: [
      'Line Win: First player to complete a full row or column.',
      'Full House: First player to mark all 24 numbers on their cartella.',
    ],
    payoutExplanation:
      'The pool of all purchased cards in the room is paid out to the line and full-house winners minus platform fee.',
    proTips: [
      'Playing multiple cards increases your chances of hitting the early line bonus.',
    ],
  },
  'dama': {
    id: 'dama',
    name: 'Ethiopian Dama',
    tagline: 'Traditional draughts with compulsory captures and flying kings',
    category: 'STRATEGY',
    accentColor: '#eab308',
    rtpOrPayout: '1v1 Skill PvP & AI',
    overview:
      'Ethiopian Dama is played on an 8x8 checkerboard. Men move forward diagonally, but can capture forwards and backwards. Reaching the opposite row crowns a "Flying King" (Nigusa) that can glide across any distance!',
    howToPlaySteps: [
      {
        title: 'Move Your Men',
        description: 'Pieces move 1 step forward diagonally to unoccupied dark squares.',
      },
      {
        title: 'Compulsory Jumps',
        description: 'If you can jump over an opponent piece to an empty square, YOU MUST JUMP! Backward jumps are allowed.',
      },
      {
        title: 'Promote to King (Nigusa)',
        description: 'Reach the opponent’s back rank to become a King. Kings can fly along any diagonal line and land anywhere beyond a captured piece.',
      },
      {
        title: 'Win the Match',
        description: 'Capture all opponent pieces or block them so they have no legal moves remaining.',
      },
    ],
    winningConditions: [
      'Capture every opponent piece on the board.',
      'Completely trap the opponent so they cannot make a legal move.',
    ],
    payoutExplanation:
      'In competitive 1v1 rooms, winner takes the full match pot. AI matches are free.',
    proTips: [
      'Always watch for forced multi-jumps: sacrifice one man to force your opponent into a position where you capture 3 or 4 of theirs!',
    ],
  },
  'letti': {
    id: 'letti',
    name: 'Letti Card',
    tagline: 'Pick 1 secret card from 52 and duel in 1v1 Face-to-Face',
    category: 'CARDS',
    accentColor: '#8b5cf6',
    rtpOrPayout: '1.90x / 1v1 PvP Pot',
    overview:
      'A thrilling card comparison game. Players pick hidden cards from a shuffled 52-card deck. Highest card rank (or specific trump rules) claims the pot!',
    howToPlaySteps: [
      {
        title: 'Enter Match & Set Stake',
        description: 'Join a 1v1 table with matched stakes.',
      },
      {
        title: 'Draw Your Card',
        description: 'Select your secret card from the fan of 52 cards.',
      },
      {
        title: 'The Showdown',
        description: 'Both cards flip face up simultaneously. The higher card wins the pot!',
      },
    ],
    winningConditions: [
      'Your revealed card rank is strictly higher than your opponent’s card.',
    ],
    drawOrRefundRules:
      'Ties (same rank) trigger a sudden-death draw or 100% refund depending on table rules.',
    payoutExplanation:
      'Winner claims the combined pot minus a 5% host rake.',
    proTips: [
      'Aces are high in standard Letti matches unless low-card trump is active.',
    ],
  },
  'chess': {
    id: 'chess',
    name: 'NOVA Chess',
    tagline: 'Standard FIDE chess with Bullet, Blitz & Rapid clocks and Elo ranking',
    category: 'STRATEGY',
    accentColor: '#22d3ee',
    rtpOrPayout: 'Ranked Elo Progression',
    overview:
      'The ultimate battle of intellect. Standard 64-square FIDE chess rules with real-time timers, Elo rating adjustments, premoves, and deep Stockfish AI practice.',
    howToPlaySteps: [
      {
        title: 'Choose Time Control',
        description: 'Select Bullet (1 min), Blitz (3 min or 5 min), or Rapid (10 min).',
      },
      {
        title: 'Move Your Army',
        description: 'Control Pawns, Knights, Bishops, Rooks, Queen, and King according to international rules.',
      },
      {
        title: 'Deliver Checkmate',
        description: 'Attack the enemy King such that it has no legal escape moves.',
      },
    ],
    winningConditions: [
      'Checkmate: The opponent King is under attack and cannot escape.',
      'Timeout: Opponent runs out of clock time (if you have mating material).',
      'Resignation: Opponent surrenders.',
    ],
    drawOrRefundRules:
      'Draws occur via Stalemate, 3-Fold Repetition, 50-Move Rule, or Insufficient Material.',
    payoutExplanation:
      'Ranked play awards Elo rating points calculated by standard FIDE formulas ($K=32$).',
    proTips: [
      'Control the center four squares early (e4, d4, e5, d5) to dominate piece mobility.',
      'Develop minor pieces (Knights and Bishops) before launching early Queen attacks.',
    ],
  },
  'ludo': {
    id: 'ludo',
    name: 'NOVA Ludo',
    tagline: '2–4 player classic cross-board race with cryptographic dice',
    category: 'TABLE',
    accentColor: '#22c55e',
    rtpOrPayout: '2–4P Room Pot',
    overview:
      'Race your 4 tokens from your home yard around the perimeter track to the center triangle. Roll a 6 to enter, capture enemy tokens along the way, and seek refuge in colored safe zones!',
    howToPlaySteps: [
      {
        title: 'Roll a 6 to Enter',
        description: 'You must roll a 6 on the die to move a token out of your yard onto your starting square. Rolling a 6 also awards a bonus roll!',
      },
      {
        title: 'Navigate the Track',
        description: 'Advance clockwise around the board based on your dice roll.',
      },
      {
        title: 'Capture Enemies',
        description: 'Landing on an opponent’s token sends it all the way back to their yard, earning you a free bonus turn!',
      },
      {
        title: 'Home Column & Finish',
        description: 'Turn into your color-coded home path. First player to get all 4 tokens into the center triangle wins!',
      },
    ],
    winningConditions: [
      'First player to navigate all 4 tokens into the center home triangle.',
    ],
    payoutExplanation:
      'In multiplayer matches, 1st place takes the main pot, with secondary payouts in 4-player lobbies.',
    proTips: [
      'Rest on Star squares (Safe Zones) where enemy tokens cannot capture you.',
      'Keep your tokens grouped rather than leaving a single token far ahead and vulnerable to capture.',
    ],
  },
};
