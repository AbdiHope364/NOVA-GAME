"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvablyFair = void 0;
const crypto = __importStar(require("crypto"));
class ProvablyFair {
    /**
     * Generates a secure random 64-character hex string as server seed
     */
    static generateServerSeed() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Hashes a server seed using SHA-256 for public disclosure before betting
     */
    static hashServerSeed(serverSeed) {
        return crypto.createHash('sha256').update(serverSeed).digest('hex');
    }
    /**
     * Generates a random client seed string if player doesn't supply one
     */
    static generateClientSeed() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Computes HMAC-SHA256 signature from serverSeed, clientSeed, and nonce
     */
    static generateHmacHex(serverSeed, clientSeed, nonce) {
        const message = `${clientSeed}:${nonce}`;
        return crypto.createHmac('sha256', serverSeed).update(message).digest('hex');
    }
    /**
     * Generates a deterministic float [0, 1) from the HMAC hash
     */
    static generateFloat(serverSeed, clientSeed, nonce) {
        const hmac = this.generateHmacHex(serverSeed, clientSeed, nonce);
        // Take the first 8 characters (4 bytes / 32 bits) of the HMAC string
        const subHash = hmac.substring(0, 8);
        const num = parseInt(subHash, 16);
        return num / 0x100000000; // 2^32
    }
    /**
     * Generates a deterministic integer between min and max (inclusive)
     */
    static generateInt(serverSeed, clientSeed, nonce, min, max) {
        const floatVal = this.generateFloat(serverSeed, clientSeed, nonce);
        return Math.floor(floatVal * (max - min + 1)) + min;
    }
    /**
     * Generates crash point multiplier for Crash game (1.00x - 1,000,000.00x)
     * Standard provably fair algorithm formula:
     * E.g. (100 - houseEdge) / (100 - floatVal * 99)
     */
    static generateCrashPoint(serverSeed, clientSeed, nonce, houseEdgePercent = 1.0) {
        const floatVal = this.generateFloat(serverSeed, clientSeed, nonce);
        // Check for instant crash (e.g. 1 in 33 chance or 3% instant crash depending on house edge)
        const instantCrashThreshold = houseEdgePercent / 100;
        if (floatVal < instantCrashThreshold) {
            return 1.00;
        }
        const houseMultiplier = (100 - houseEdgePercent) / 100;
        const rawMultiplier = houseMultiplier / (1 - floatVal);
        // Truncate to 2 decimal places
        const crashPoint = Math.floor(rawMultiplier * 100) / 100;
        return Math.max(1.00, crashPoint);
    }
    /**
     * Verification function allowing clients to verify past game outcomes
     */
    static verifyResult(serverSeed, serverSeedHash, clientSeed, nonce) {
        const computedHash = this.hashServerSeed(serverSeed);
        const isValidHash = computedHash === serverSeedHash;
        const hmac = this.generateHmacHex(serverSeed, clientSeed, nonce);
        const floatValue = this.generateFloat(serverSeed, clientSeed, nonce);
        return {
            isValidHash,
            floatValue,
            hmac,
        };
    }
}
exports.ProvablyFair = ProvablyFair;
//# sourceMappingURL=index.js.map