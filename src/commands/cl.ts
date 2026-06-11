import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { clearChannelMessages } from "../utils/clearChannel";
import { resolveTextChannel } from "../utils/channelLock";
import { containerEditOrganized, E, V } from "../utils/container";
import { checkModeratorPermissions } from "../utils/moderation";

export const cl: Command = {
  defer: true,
  data: new SlashCommandBuilder()
    .setName("cl")
    .setDescription("Apaga todas as mensagens do chat")
    .addChannelOption((o) =>
      o.setName("canal").setDescription("Canal para limpar")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false)
    ),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, PermissionFlagsBits.ManageMessages);
    if (permissionError) {
      await interaction.editReply(containerEditOrganized([`${E} ${permissionError}`]));
      return;
    }
    const guild = interaction.guild!;
    const channelOption = interaction.options.getChannel("canal");
    const channel = resolveTextChannel(guild, channelOption?.id ?? null, interaction.channelId);
    if (!channel) {
      await interaction.editReply(containerEditOrganized([`${E} Selecione um canal de texto válido.`]));
      return;
    }
    const botPermissions = channel.permissionsFor(guild.members.me!);
    if (!botPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.editReply(containerEditOrganized([`${E} Não tenho permissão para apagar mensagens em <#${channel.id}>.`]));
      return;
    }
    const { deleted, failed } = await clearChannelMessages(channel);
    await interaction.editReply(
      containerEditOrganized([
        "# **CL**",
        [
          `${V} **Chat limpo**`,
          `${E} **Canal:** <#${channel.id}>`,
          `${E} **Mensagens apagadas:** ${deleted}`,
          failed > 0 ? `${E} **Falhas:** ${failed}` : "",
          `${E} **Moderador:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].filter(Boolean).join("\n"),
      ])
    );
  },
};
