import { Guild, TextChannel } from "discord.js";
export declare function resolveTextChannel(guild: Guild, channelId: string | null, currentChannelId: string): TextChannel | null;
export declare function lockChannel(channel: TextChannel, guild: Guild): Promise<void>;
export declare function unlockChannel(channel: TextChannel, guild: Guild): Promise<void>;
export declare function isChannelLocked(channel: TextChannel, guild: Guild): boolean;
//# sourceMappingURL=channelLock.d.ts.map