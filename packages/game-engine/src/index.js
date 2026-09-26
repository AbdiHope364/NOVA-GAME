"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGameEngine = void 0;
class BaseGameEngine {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Validates bet constraints (min/max bet amount, valid parameters)
     */
    validateBet(amount, params) {
        if (amount < this.config.minBet) {
            return { valid: false, error: `Minimum bet amount is ${this.config.minBet}` };
        }
        if (amount > this.config.maxBet) {
            return { valid: false, error: `Maximum bet amount is ${this.config.maxBet}` };
        }
        return this.validateParams(params);
    }
    /**
     * Helper to calculate payout given multiplier and bet amount
     */
    calculatePayout(amount, multiplier) {
        const payout = Math.floor(amount * multiplier * 100) / 100;
        const profit = Math.floor((payout - amount) * 100) / 100;
        return { payout, profit };
    }
    /**
     * Helper to apply house edge to raw multiplier
     */
    applyHouseEdge(rawMultiplier) {
        const edgeFactor = (100 - this.config.houseEdgePercent) / 100;
        return Math.floor(rawMultiplier * edgeFactor * 100) / 100;
    }
}
exports.BaseGameEngine = BaseGameEngine;
//# sourceMappingURL=index.js.map