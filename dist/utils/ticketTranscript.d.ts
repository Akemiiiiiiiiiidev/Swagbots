import { AttachmentBuilder, TextChannel } from "discord.js";
type TicketInfo = {
    userId: string;
    category: string;
    createdAt: number;
};
export declare function buildTicketTranscript(channel: TextChannel, ticket: TicketInfo, closedById: string): Promise<{
    text: string;
    messageCount: number;
}>;
export declare function buildTranscriptAttachment(channelName: string, transcript: string): AttachmentBuilder;
export {};
//# sourceMappingURL=ticketTranscript.d.ts.map