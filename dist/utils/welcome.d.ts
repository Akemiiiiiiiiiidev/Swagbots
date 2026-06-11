import { Guild, GuildMember } from "discord.js";
export type WelcomeConfig = {
    channelId: string;
    message: string;
};
export declare function initWelcome(): void;
export declare function setWelcomeConfig(guildId: string, channelId: string, message: string): void;
export declare function getWelcomeConfig(guildId: string): WelcomeConfig | null;
export declare function clearWelcomeConfig(guildId: string): void;
export declare function getWelcomePlaceholderHelp(): string;
export declare function formatWelcomeMessage(template: string, guild: Guild, userId: string): string;
export declare function sendWelcomeMessage(member: GuildMember): Promise<void>;
//# sourceMappingURL=welcome.d.ts.map