export declare function initBlacklist(): void;
export declare function isBlacklisted(guildId: string, userId: string): boolean;
export declare function addToBlacklist(guildId: string, userId: string, reason: string, addedBy: string): void;
export declare function removeFromBlacklist(guildId: string, userId: string): boolean;
export type BlacklistUser = {
    userId: string;
    reason: string;
    addedBy: string;
    addedAt: number;
};
export declare function getBlacklistUsers(guildId: string): BlacklistUser[];
//# sourceMappingURL=blacklist.d.ts.map