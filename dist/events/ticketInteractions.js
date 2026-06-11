"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTicketSystem = initTicketSystem;
exports.handleTicketButton = handleTicketButton;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
const tickets_1 = require("../utils/tickets");
function initTicketSystem() {
    (0, tickets_1.initTickets)();
}
async function handleTicketButton(interaction) {
    if (!(0, tickets_1.isTicketButton)(interaction.customId)) {
        return false;
    }
    const guild = interaction.guild;
    if (!guild)
        return true;
    const categoryId = (0, tickets_1.parseTicketOpenId)(interaction.customId);
    if (categoryId) {
        const member = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
        const category = (0, tickets_1.getTicketCategory)(categoryId);
        if (!member) {
            await interaction.reply((0, container_1.containerReplyOrganized)(["Nao foi possivel verificar seu perfil."], { ephemeral: true }));
            return true;
        }
        const existing = (0, tickets_1.getUserTicket)(guild.id, member.id);
        if (existing) {
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **TICKET**",
                [
                    "Voce ja possui um ticket aberto.",
                    `**Canal:** <#${existing.channelId}>`,
                ].join("\n"),
            ], { ephemeral: true }));
            return true;
        }
        const channel = await (0, tickets_1.createTicketChannel)(guild, member, categoryId, undefined, interaction.channel && "parentId" in interaction.channel
            ? interaction.channel.parentId
            : null);
        await interaction.reply((0, container_1.containerReplyOrganized)([
            "# **TICKET**",
            [
                "**Ticket aberto**",
                `**Usuario:** <@${member.id}>`,
                `**Categoria:** ${category.label}`,
                `**Canal:** <#${channel.id}>`,
            ].join("\n"),
        ], { ephemeral: true }));
        await (0, logs_1.sendLog)(guild, "ticket", [
            [
                "**Ticket aberto**",
                `**Usuario:** <@${member.id}>`,
                `**Categoria:** ${category.label}`,
                `**Canal:** <#${channel.id}>`,
                `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
        return true;
    }
    if (interaction.customId !== tickets_1.TICKET_CLOSE_ID) {
        return false;
    }
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        await interaction.reply((0, container_1.containerReplyOrganized)(["Este botao so funciona dentro de um ticket."], { ephemeral: true }));
        return true;
    }
    const ticketData = (0, tickets_1.getTicketByChannel)(channel.id);
    if (!ticketData) {
        await interaction.reply((0, container_1.containerReplyOrganized)(["Este canal nao e um ticket."], { ephemeral: true }));
        return true;
    }
    const member = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
    const isOwner = interaction.user.id === ticketData.userId;
    const isStaff = member?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels) ?? false;
    if (!isOwner && !isStaff) {
        await interaction.reply((0, container_1.containerReplyOrganized)(["Voce nao tem permissao para fechar este ticket."], { ephemeral: true }));
        return true;
    }
    await interaction.reply((0, container_1.containerReplyOrganized)([
        "# **TICKET**",
        [
            "**Ticket fechado**",
            `**Usuario:** <@${ticketData.userId}>`,
            `**Fechado por:** <@${interaction.user.id}>`,
        ].join("\n"),
    ]));
    await (0, tickets_1.closeTicketChannel)(guild, channel, ticketData, interaction.user.id);
    return true;
}
//# sourceMappingURL=ticketInteractions.js.map