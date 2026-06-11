import { ChatInputCommandInteraction, Guild, GuildMember, User } from "discord.js";
export declare function parseUserId(value: string): string | null;
export declare function resolveModerationTarget(interaction: ChatInputCommandInteraction, requireMember: boolean): Promise<{
    userId: string;
    member: GuildMember | null;
    tag: string;
} | {
    error: string;
}>;
export declare function checkModeratorPermissions(interaction: ChatInputCommandInteraction, permission: bigint): string | null;
export declare function checkModerationHierarchy(interaction: ChatInputCommandInteraction, target: GuildMember): string | null;
export declare function formatDuration(minutes: number): string;
export declare const ModerationPermissions: {
    readonly ban: bigint;
    readonly kick: bigint;
    readonly mute: bigint;
};
export declare function fetchGuildMember(guild: Guild, userId: string): Promise<GuildMember | null>;
export declare function fetchExecutorMember(interaction: ChatInputCommandInteraction): Promise<GuildMember | null>;
export declare function isAdministrator(member: GuildMember): boolean;
export declare function checkAdministrator(interaction: ChatInputCommandInteraction): Promise<string | null>;
export declare function isUserAdministrator(guild: Guild, user: User): boolean;
//# sourceMappingURL=moderation.d.ts.map