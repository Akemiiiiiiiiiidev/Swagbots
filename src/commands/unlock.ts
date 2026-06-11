import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { isChannelLocked, resolveTextChannel, unlockChannel } from "../utils/channelLock";
import { containerReplyOrganized, E, V } from "../utils/container";
import { checkModeratorPermissions } from "../utils/moderation";

export const unlock: Command = {
  data: new SlashCommandBuilder()
    .setName("unlock").setDescription("Destrava o chat e permite mensagens novamente")
    .addChannelOption((o) => o.setName("canal").setDescription("Canal para destravar").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do destravamento").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, PermissionFlagsBits.ManageChannels);
    if (permissionError) { await interaction.reply(containerReplyOrganized([`${E} ${permissionError}`], { ephemeral: true })); return; }
    const guild = interaction.guild!;
    const channel = resolveTextChannel(guild, interaction.options.getChannel("canal")?.id ?? null, interaction.channelId);
    if (!channel) { await interaction.reply(containerReplyOrganized([`${E} Selecione um canal de texto valido.`], { ephemeral: true })); return; }
    if (!isChannelLocked(channel, guild)) { await interaction.reply(containerReplyOrganized([`${E} O canal <#${channel.id}> ja esta destravado.`], { ephemeral: true })); return; }
    const motivo = interaction.options.getString("motivo") ?? "Sem motivo informado";
    await unlockChannel(channel, guild);
    await interaction.reply(
      containerReplyOrganized([
        "# **UNLOCK**",
        [`${V} **Chat destravado**`, `${E} **Canal:** <#${channel.id}>`, `${E} **Motivo:** ${motivo}`, `${E} **Moderador:** <@${interaction.user.id}>`, `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
      ])
    );
  },
};
