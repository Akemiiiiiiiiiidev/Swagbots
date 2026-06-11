import { Guild, GuildMember, TextChannel } from "discord.js";
export declare const TICKET_CLOSE_ID = "ticket:close";
export declare const TICKET_OPEN_PREFIX = "ticket:open:";
export declare const TICKET_CATEGORIES: readonly [{
    readonly id: "suporte";
    readonly label: "Suporte";
    readonly motivo: "Suporte geral (Parceiras, Duvidas e Denuncias)";
}, {
    readonly id: "verificacao";
    readonly label: "Verificacao";
    readonly motivo: "Relacionado ao Instagram";
}, {
    readonly id: "recrutamento";
    readonly label: "Recrutamento";
    readonly motivo: "Candidatura ou contato com a equipe";
}];
export type TicketCategoryId = (typeof TICKET_CATEGORIES)[number]["id"];
type TicketRecord = {
    channelId: string;
    userId: string;
    category: TicketCategoryId;
    createdAt: number;
};
export declare function initTickets(): void;
export declare function getTicketCategory(id: string): {
    readonly id: "suporte";
    readonly label: "Suporte";
    readonly motivo: "Suporte geral (Parceiras, Duvidas e Denuncias)";
} | {
    readonly id: "verificacao";
    readonly label: "Verificacao";
    readonly motivo: "Relacionado ao Instagram";
} | {
    readonly id: "recrutamento";
    readonly label: "Recrutamento";
    readonly motivo: "Candidatura ou contato com a equipe";
} | null;
export declare function parseTicketOpenId(customId: string): TicketCategoryId | null;
export declare function isTicketButton(customId: string): boolean;
export declare function getUserTicket(guildId: string, userId: string): TicketRecord | null;
export declare function getTicketByChannel(channelId: string): TicketRecord | null;
export declare function removeTicket(guildId: string, userId: string): void;
export declare function buildTicketPanelContainer(): import("discord.js").ContainerBuilder;
export declare function buildTicketChannelContainer(userId: string, categoryLabel: string, motivo: string): import("discord.js").ContainerBuilder;
export declare function createTicketChannel(guild: Guild, member: GuildMember, categoryId: TicketCategoryId, motivo?: string, parentId?: string | null): Promise<TextChannel>;
export declare function closeTicketChannel(guild: Guild, channel: TextChannel, ticket: TicketRecord, closedById: string): Promise<void>;
export {};
//# sourceMappingURL=tickets.d.ts.map