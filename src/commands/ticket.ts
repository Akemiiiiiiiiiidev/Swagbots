import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E, V } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkAdministrator, fetchExecutorMember } from "../utils/moderation";
import { buildTicketPanelContainer, closeTicketChannel, createTicketChannel, getTicketByChannel, getUserTicket } from "../utils/tickets";

export const ticket: Command = {
  data: new SlashCommandBuilder()
    .setName("ticket").setDescription("Sistema de tickets do servidor")
    .addSubcommand((sub) => sub.setName("abrir").setDescription("Abre um ticket de suporte")
      .addStringOption((o) => o.setName("motivo").setDescription("Motivo do ticket").setRequired(false)))
    .addSubcommand((sub) => sub.setName("fechar").setDescription("Fecha o ticket atual"))
    .addSubcommand((sub) => sub.setName("painel").setDescription("Envia o painel de tickets em um canal")
      .addChannelOption((o) => o.setName("canal").setDescription("Canal para enviar o painel").addChannelTypes(ChannelType.GuildText).setRequired(true))),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) { await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })); return; }
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "painel") {
      const adminError = await checkAdministrator(interaction);
      if (adminError) { await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true })); return; }
      const channel = interaction.options.getChannel("canal", true);
      if (channel.type !== ChannelType.GuildText) { await interaction.reply(containerReplyOrganized([`${E} Selecione um canal de texto valido.`], { ephemeral: true })); return; }
      await (channel as TextChannel).send({ components: [buildTicketPanelContainer()], flags: MessageFlags.IsComponentsV2 });
      await interaction.reply(
        containerReplyOrganized(
          ["# **TICKET**", [`${V} **Painel enviado**`, `${E} **Canal:** <#${channel.id}>`, `${E} **Administrador:** <@${interaction.user.id}>`].join("\n")],
          { ephemeral: true }
        )
      );
      return;
    }

    if (subcommand === "abrir") {
      const member = await fetchExecutorMember(interaction);
      if (!member) { await interaction.reply(containerReplyOrganized([`${E} Nao foi possivel verificar seu perfil.`], { ephemeral: true })); return; }
      const existing = getUserTicket(guild.id, member.id);
      if (existing) {
        await interaction.reply(containerReplyOrganized(["# **TICKET**", [`${E} Voce ja possui um ticket aberto.`, `${E} **Canal:** <#${existing.channelId}>`].join("\n")], { ephemeral: true }));
        return;
      }
      const motivo = interaction.options.getString("motivo") ?? "Sem motivo informado";
      const channel = await createTicketChannel(guild, member, "suporte", motivo);
      await interaction.reply(
        containerReplyOrganized(
          ["# **TICKET**", [`${V} **Ticket aberto**`, `${E} **Usuario:** <@${member.id}>`, `${E} **Canal:** <#${channel.id}>`, `${E} **Motivo:** ${motivo}`].join("\n")],
          { ephemeral: true }
        )
      );
      await sendLog(guild, "ticket", [
        [`${V} **Ticket aberto**`, `${E} **Usuario:** <@${member.id}>`, `${E} **Canal:** <#${channel.id}>`, `${E} **Categoria:** Suporte`, `${E} **Motivo:** ${motivo}`, `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
      ]);
      return;
    }

    if (subcommand === "fechar") {
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased() || channel.isDMBased()) { await interaction.reply(containerReplyOrganized([`${E} Use este comando dentro de um ticket.`], { ephemeral: true })); return; }
      const ticketData = getTicketByChannel(channel.id);
      if (!ticketData) { await interaction.reply(containerReplyOrganized([`${E} Este canal nao e um ticket.`], { ephemeral: true })); return; }
      const member = await fetchExecutorMember(interaction);
      const isOwner = interaction.user.id === ticketData.userId;
      const isStaff = member?.permissions.has(PermissionFlagsBits.ManageChannels) ?? false;
      if (!isOwner && !isStaff) { await interaction.reply(containerReplyOrganized([`${E} Voce nao tem permissao para fechar este ticket.`], { ephemeral: true })); return; }
      await interaction.reply(
        containerReplyOrganized(["# **TICKET**", [`${V} **Ticket fechado**`, `${E} **Usuario:** <@${ticketData.userId}>`, `${E} **Fechado por:** <@${interaction.user.id}>`].join("\n")])
      );
      await closeTicketChannel(guild, channel as TextChannel, ticketData, interaction.user.id);
    }
  },
};
