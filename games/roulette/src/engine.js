import { BaseGameEngine } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
export const RED_NUMBERS_12 = [1, 3, 5, 7, 9, 11];
export const BLACK_NUMBERS_12 = [2, 4, 6, 8, 10, 12];
export const MINI_ROULETTE_POCKETS = {
    0: { color: 'GREEN', third: null, half: null },
    1: { color: 'RED', third: 'LO', half: '1-6' },
    2: { color: 'BLACK', third: 'LO', half: '1-6' },
    3: { color: 'RED', third: 'LO', half: '1-6' },
    4: { color: 'BLACK', third: 'LO', half: '1-6' },
    5: { color: 'RED', third: 'MID', half: '1-6' },
    6: { color: 'BLACK', third: 'MID', half: '1-6' },
    7: { color: 'RED', third: 'MID', half: '7-12' },
    8: { color: 'BLACK', third: 'MID', half: '7-12' },
    9: { color: 'RED', third: 'HI', half: '7-12' },
    10: { color: 'BLACK', third: 'HI', half: '7-12' },
    11: { color: 'RED', third: 'HI', half: '7-12' },
    12: { color: 'BLACK', third: 'HI', half: '7-12' },
};
export class RouletteEngine extends BaseGameEngine {
    constructor(houseEdgePercent = 7.69) {
        super({
            gameId: 'roulette',
            name: 'Mini / African Roulette (12-Number)',
            houseEdgePercent,
            minBet: 1,
            maxBet: 10000,
        });
    }
    validateParams(params) {
        if (!params || params.selection === undefined) {
            return { valid: false, error: 'Selection is required' };
        }
        const validSelections = ['RED', 'BLACK', 'GREEN', '1-6', '7-12', 'LO', 'MID', 'HI'];
        if (typeof params.selection === 'string' && !validSelections.includes(params.selection)) {
            return { valid: false, error: `Invalid selection '${params.selection}'. Valid selections: ${validSelections.join(', ')}` };
        }
        if (typeof params.selection === 'number' && (params.selection < 0 || params.selection > 12)) {
            return { valid: false, error: 'Single number selection must be between 0 and 12' };
        }
        if (Array.isArray(params.selection)) {
            if (params.selection.length !== 2) {
                return { valid: false, error: 'Split bet selection must contain exactly 2 numbers' };
            }
            for (const num of params.selection) {
                if (typeof num !== 'number' || num < 0 || num > 12) {
                    return { valid: false, error: 'Split bet numbers must be between 0 and 12' };
                }
            }
        }
        return { valid: true };
    }
    evaluate(input) {
        const winningPocket = ProvablyFair.generateInt(input.serverSeed, input.clientSeed, input.nonce, 0, 12);
        const metadata = MINI_ROULETTE_POCKETS[winningPocket];
        const { selection, betType } = input.params;
        let won = false;
        let multiplier = 0;
        // Evaluate based on selection & betType
        if (typeof selection === 'number' && selection === winningPocket) {
            won = true;
            multiplier = 12.0; // Straight up (11:1 + stake = 12x)
        }
        else if (Array.isArray(selection) && selection.includes(winningPocket)) {
            won = true;
            multiplier = 6.0; // Split bet (5:1 + stake = 6x)
        }
        else if ((selection === 'RED' || betType === 'COLOR_RED') && metadata.color === 'RED') {
            won = true;
            multiplier = 2.0; // Red color (1:1 + stake = 2x)
        }
        else if ((selection === 'BLACK' || betType === 'COLOR_BLACK') && metadata.color === 'BLACK') {
            won = true;
            multiplier = 2.0; // Black color (1:1 + stake = 2x)
        }
        else if ((selection === '1-6' || betType === 'HALF_1_6') && metadata.half === '1-6') {
            won = true;
            multiplier = 2.0; // Half 1-6 (1:1 + stake = 2x)
        }
        else if ((selection === '7-12' || betType === 'HALF_7_12') && metadata.half === '7-12') {
            won = true;
            multiplier = 2.0; // Half 7-12 (1:1 + stake = 2x)
        }
        else if ((selection === 'LO' || betType === 'THIRD_LO') && metadata.third === 'LO') {
            won = true;
            multiplier = 3.0; // Low third 1-4 (2:1 + stake = 3x)
        }
        else if ((selection === 'MID' || betType === 'THIRD_MID') && metadata.third === 'MID') {
            won = true;
            multiplier = 3.0; // Mid third 5-8 (2:1 + stake = 3x)
        }
        else if ((selection === 'HI' || betType === 'THIRD_HI') && metadata.third === 'HI') {
            won = true;
            multiplier = 3.0; // High third 9-12 (2:1 + stake = 3x)
        }
        const { payout, profit } = this.calculatePayout(input.amount, multiplier);
        return {
            won,
            multiplier,
            payout,
            profit,
            outcome: {
                number: winningPocket,
                color: metadata.color,
                third: metadata.third,
                half: metadata.half,
                selection,
                betType,
            },
        };
    }
}
