export declare function initColeira(): void;
export declare function setColeira(guildId: string, targetId: string, executorId: string): void;
export declare function removeColeira(guildId: string, targetId: string): void;
export declare function getColeira(guildId: string, targetId: string): string | null;
export declare function hasColeira(guildId: string, targetId: string): boolean;
export declare function removeColeiraByExecutor(guildId: string, executorId: string): void;
export declare function listColeirasByExecutor(guildId: string, executorId: string): string[];
export declare function getAllColeiras(guildId: string): {
    targetId: string;
    executorId: string;
}[];
//# sourceMappingURL=coleira.d.ts.map