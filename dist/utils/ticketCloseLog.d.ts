import { Guild, TextChannel } from "discord.js";
type TicketRecord = {
    userId: string;
    category: string;
    createdAt: number;
};
export declare function sendTicketCloseLog(guild: Guild, channel: TextChannel, ticket: TicketRecord, closedById: string): Promise<void>;
export {};
//# sourceMappingURL=ticketCloseLog.d.ts.map