export declare class ProvablyFair {
    /**
     * Generates a secure random 64-character hex string as server seed
     */
    static generateServerSeed(): string;
    /**
     * Hashes a server seed using SHA-256 for public disclosure before betting
     */
    static hashServerSeed(serverSeed: string): string;
    /**
     * Generates a random client seed string if player doesn't supply one
     */
    static generateClientSeed(): string;
    /**
     * Computes HMAC-SHA256 signature from serverSeed, clientSeed, and nonce
     */
    static generateHmacHex(serverSeed: string, clientSeed: string, nonce: number): string;
    /**
     * Generates a deterministic float [0, 1) from the HMAC hash
     */
    static generateFloat(serverSeed: string, clientSeed: string, nonce: number): number;
    /**
     * Generates a deterministic integer between min and max (inclusive)
     */
    static generateInt(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number): number;
    /**
     * Generates crash point multiplier for Crash game (1.00x - 1,000,000.00x)
     * Standard provably fair algorithm formula:
     * E.g. (100 - houseEdge) / (100 - floatVal * 99)
     */
    static generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number, houseEdgePercent?: number): number;
    /**
     * Verification function allowing clients to verify past game outcomes
     */
    static verifyResult(serverSeed: string, serverSeedHash: string, clientSeed: string, nonce: number): {
        isValidHash: boolean;
        floatValue: number;
        hmac: string;
    };
}
//# sourceMappingURL=index.d.ts.map