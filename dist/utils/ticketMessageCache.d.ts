import { Message } from "discord.js";
type CachedMessage = {
    messageId: string;
    authorId: string;
    authorTag: string;
    content: string;
    attachments: string;
    createdAt: number;
};
export declare function initTicketMessageCache(): void;
export declare function cacheTicketMessage(message: Message): void;
export declare function getCachedTicketMessages(channelId: string): CachedMessage[];
export declare function clearCachedTicketMessages(channelId: string): void;
export {};
//# sourceMappingURL=ticketMessageCache.d.ts.map