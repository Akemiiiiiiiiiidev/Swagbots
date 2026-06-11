import { GuildMember, Role } from "discord.js";
export declare function initAutoRole(): void;
export declare function setAutoRole(guildId: string, roleId: string): void;
export declare function getAutoRoleId(guildId: string): string | null;
export declare function clearAutoRole(guildId: string): void;
export declare function resolveAutoRole(member: GuildMember): Promise<Role | null>;
export declare function assignAutoRole(member: GuildMember): Promise<{
    success: false;
    error: string;
    role?: undefined;
} | {
    success: true;
    role: Role;
    error?: undefined;
}>;
//# sourceMappingURL=autoRole.d.ts.map