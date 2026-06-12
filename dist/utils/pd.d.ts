export declare function initPd(): void;
export declare function setPdRole(guildId: string, roleId: string): void;
export declare function getPdRoleId(guildId: string): string | null;
export declare function addPdAllowedRole(guildId: string, roleId: string): void;
export declare function clearPdAllowedRoles(guildId: string): void;
export declare function getPdAllowedRoles(guildId: string): string[];
export declare function memberHasPdAccess(guildId: string, memberRoleIds: string[]): boolean;
export declare const PD_MAX_PER_EXECUTOR = 2;
export interface PdHolder {
    userId: string;
    grantedBy: string;
    grantedAt: number;
}
export declare function getPdHoldersByExecutor(guildId: string, executorId: string): PdHolder[];
export declare function getPdHolderCountByExecutor(guildId: string, executorId: string): number;
export declare function getAllPdHolders(guildId: string): PdHolder[];
export declare function addPdHolder(guildId: string, userId: string, grantedBy: string): void;
export declare function removePdHolder(guildId: string, userId: string): void;
export declare function isPdHolder(guildId: string, userId: string): boolean;
export declare function getPdHolderGrantedBy(guildId: string, userId: string): string | null;
//# sourceMappingURL=pd.d.ts.map