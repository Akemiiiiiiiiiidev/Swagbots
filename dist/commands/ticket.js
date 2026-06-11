"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticket = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
const tickets_1 = require("../utils/tickets");
exports.ticket = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ticket").setDescription("Sistema de tickets do servidor")
        .addSubcommand((sub) => sub.setName("abrir").setDescription("Abre um ticket de suporte")
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo do ticket").setRequired(false)))
        .addSubcommand((sub) => sub.setName("fechar").setDescription("Fecha o ticket atual"))
        .addSubcommand((sub) => sub.setName("painel").setDescription("Envia o painel de tickets em um canal")
        .addChannelOption((o) => o.setName("canal").setDescription("Canal para enviar o painel").addChannelTypes(discord_js_1.ChannelType.GuildText).setRequired(true))),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "painel") {
            const adminError = await (0, moderation_1.checkAdministrator)(interaction);
            if (adminError) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
                return;
            }
            const channel = interaction.options.getChannel("canal", true);
            if (channel.type !== discord_js_1.ChannelType.GuildText) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Selecione um canal de texto valido.`], { ephemeral: true }));
                return;
            }
            await channel.send({ components: [(0, tickets_1.buildTicketPanelContainer)()], flags: discord_js_1.MessageFlags.IsComponentsV2 });
            await interaction.reply((0, container_1.containerReplyOrganized)(["# **TICKET**", [`${container_1.V} **Painel enviado**`, `${container_1.E} **Canal:** <#${channel.id}>`, `${container_1.E} **Administrador:** <@${interaction.user.id}>`].join("\n")], { ephemeral: true }));
            return;
        }
        if (subcommand === "abrir") {
            const member = await (0, moderation_1.fetchExecutorMember)(interaction);
            if (!member) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao foi possivel verificar seu perfil.`], { ephemeral: true }));
                return;
            }
            const existing = (0, tickets_1.getUserTicket)(guild.id, member.id);
            if (existing) {
                await interaction.reply((0, container_1.containerReplyOrganized)(["# **TICKET**", [`${container_1.E} Voce ja possui um ticket aberto.`, `${container_1.E} **Canal:** <#${existing.channelId}>`].join("\n")], { ephemeral: true }));
                return;
            }
            const motivo = interaction.options.getString("motivo") ?? "Sem motivo informado";
            const channel = await (0, tickets_1.createTicketChannel)(guild, member, "suporte", motivo);
            await interaction.reply((0, container_1.containerReplyOrganized)(["# **TICKET**", [`${container_1.V} **Ticket aberto**`, `${container_1.E} **Usuario:** <@${member.id}>`, `${container_1.E} **Canal:** <#${channel.id}>`, `${container_1.E} **Motivo:** ${motivo}`].join("\n")], { ephemeral: true }));
            await (0, logs_1.sendLog)(guild, "ticket", [
                [`${container_1.V} **Ticket aberto**`, `${container_1.E} **Usuario:** <@${member.id}>`, `${container_1.E} **Canal:** <#${channel.id}>`, `${container_1.E} **Categoria:** Suporte`, `${container_1.E} **Motivo:** ${motivo}`, `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
            ]);
            return;
        }
        if (subcommand === "fechar") {
            const channel = interaction.channel;
            if (!channel || !channel.isTextBased() || channel.isDMBased()) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Use este comando dentro de um ticket.`], { ephemeral: true }));
                return;
            }
            const ticketData = (0, tickets_1.getTicketByChannel)(channel.id);
            if (!ticketData) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este canal nao e um ticket.`], { ephemeral: true }));
                return;
            }
            const member = await (0, moderation_1.fetchExecutorMember)(interaction);
            const isOwner = interaction.user.id === ticketData.userId;
            const isStaff = member?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels) ?? false;
            if (!isOwner && !isStaff) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para fechar este ticket.`], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)(["# **TICKET**", [`${container_1.V} **Ticket fechado**`, `${container_1.E} **Usuario:** <@${ticketData.userId}>`, `${container_1.E} **Fechado por:** <@${interaction.user.id}>`].join("\n")]));
            await (0, tickets_1.closeTicketChannel)(guild, channel, ticketData, interaction.user.id);
        }
    },
};
//# sourceMappingURL=ticket.js.map