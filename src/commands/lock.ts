import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { isChannelLocked, lockChannel, resolveTextChannel } from "../utils/channelLock";
import { containerReplyOrganized, E, V } from "../utils/container";
import { checkModeratorPermissions } from "../utils/moderation";

export const lock: Command = {
  data: new SlashCommandBuilder()
    .setName("lock").setDescription("Trava o chat e impede novas mensagens")
    .addChannelOption((o) => o.setName("canal").setDescription("Canal para travar").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do travamento").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, PermissionFlagsBits.ManageChannels);
    if (permissionError) { await interaction.reply(containerReplyOrganized([`${E} ${permissionError}`], { ephemeral: true })); return; }
    const guild = interaction.guild!;
    const channel = resolveTextChannel(guild, interaction.options.getChannel("canal")?.id ?? null, interaction.channelId);
    if (!channel) { await interaction.reply(containerReplyOrganized([`${E} Selecione um canal de texto valido.`], { ephemeral: true })); return; }
    if (isChannelLocked(channel, guild)) { await interaction.reply(containerReplyOrganized([`${E} O canal <#${channel.id}> ja esta travado.`], { ephemeral: true })); return; }
    const motivo = interaction.options.getString("motivo") ?? "Sem motivo informado";
    await lockChannel(channel, guild);
    await interaction.reply(
      containerReplyOrganized([
        "# **LOCK**",
        [`${V} **Chat travado**`, `${E} **Canal:** <#${channel.id}>`, `${E} **Motivo:** ${motivo}`, `${E} **Moderador:** <@${interaction.user.id}>`, `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
      ])
    );
  },
};
