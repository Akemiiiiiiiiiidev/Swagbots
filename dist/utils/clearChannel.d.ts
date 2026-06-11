import { TextChannel } from "discord.js";
export declare function clearChannelMessages(channel: TextChannel): Promise<{
    deleted: number;
    failed: number;
}>;
export declare function clearUserMessages(channel: TextChannel, userId: string): Promise<{
    deleted: number;
    failed: number;
}>;
//# sourceMappingURL=clearChannel.d.ts.map