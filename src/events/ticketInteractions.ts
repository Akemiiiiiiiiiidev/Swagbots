import {
  ButtonInteraction,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { containerReplyOrganized } from "../utils/container";
import { sendLog } from "../utils/logs";
import { fetchGuildMember } from "../utils/moderation";
import {
  TICKET_CLOSE_ID,
  closeTicketChannel,
  createTicketChannel,
  getTicketByChannel,
  getTicketCategory,
  getUserTicket,
  initTickets,
  isTicketButton,
  parseTicketOpenId,
} from "../utils/tickets";

export function initTicketSystem() {
  initTickets();
}

export async function handleTicketButton(
  interaction: ButtonInteraction
): Promise<boolean> {
  if (!isTicketButton(interaction.customId)) {
    return false;
  }

  const guild = interaction.guild;

  if (!guild) return true;

  const categoryId = parseTicketOpenId(interaction.customId);

  if (categoryId) {
    const member = await fetchGuildMember(guild, interaction.user.id);
    const category = getTicketCategory(categoryId)!;

    if (!member) {
      await interaction.reply(
        containerReplyOrganized(
          ["Nao foi possivel verificar seu perfil."],
          { ephemeral: true }
        )
      );
      return true;
    }

    const existing = getUserTicket(guild.id, member.id);

    if (existing) {
      await interaction.reply(
        containerReplyOrganized(
          [
            "# **TICKET**",
            [
              "Voce ja possui um ticket aberto.",
              `**Canal:** <#${existing.channelId}>`,
            ].join("\n"),
          ],
          { ephemeral: true }
        )
      );
      return true;
    }

    const channel = await createTicketChannel(
      guild,
      member,
      categoryId,
      undefined,
      interaction.channel && "parentId" in interaction.channel
        ? interaction.channel.parentId
        : null
    );

    await interaction.reply(
      containerReplyOrganized(
        [
          "# **TICKET**",
          [
            "**Ticket aberto**",
            `**Usuario:** <@${member.id}>`,
            `**Categoria:** ${category.label}`,
            `**Canal:** <#${channel.id}>`,
          ].join("\n"),
        ],
        { ephemeral: true }
      )
    );

    await sendLog(guild, "ticket", [
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

  if (interaction.customId !== TICKET_CLOSE_ID) {
    return false;
  }

  const channel = interaction.channel;

  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply(
      containerReplyOrganized(
        ["Este botao so funciona dentro de um ticket."],
        { ephemeral: true }
      )
    );
    return true;
  }

  const ticketData = getTicketByChannel(channel.id);

  if (!ticketData) {
    await interaction.reply(
      containerReplyOrganized(
        ["Este canal nao e um ticket."],
        { ephemeral: true }
      )
    );
    return true;
  }

  const member = await fetchGuildMember(guild, interaction.user.id);
  const isOwner = interaction.user.id === ticketData.userId;
  const isStaff =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ?? false;

  if (!isOwner && !isStaff) {
    await interaction.reply(
      containerReplyOrganized(
        ["Voce nao tem permissao para fechar este ticket."],
        { ephemeral: true }
      )
    );
    return true;
  }

  await interaction.reply(
    containerReplyOrganized([
      "# **TICKET**",
      [
        "**Ticket fechado**",
        `**Usuario:** <@${ticketData.userId}>`,
        `**Fechado por:** <@${interaction.user.id}>`,
      ].join("\n"),
    ])
  );

  await closeTicketChannel(
    guild,
    channel as TextChannel,
    ticketData,
    interaction.user.id
  );
  return true;
}
