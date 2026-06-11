export declare function getWeekStartDate(date?: Date): string;
export declare function getNextSundayTimestamp(date?: Date): number;
export declare function incrementMessageCount(guildId: string, userId: string): void;
export declare function getUserMessageCount(guildId: string, userId: string): number;
export declare function getTopMessageCounts(guildId: string, limit?: number): {
    userId: string;
    count: number;
}[];
export declare function cleanupOldWeeks(): void;
export declare function startWeeklyResetScheduler(): void;
//# sourceMappingURL=messageCount.d.ts.map