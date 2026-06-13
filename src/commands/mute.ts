import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyList, containerReplyOrganized } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkModerationHierarchy, checkModeratorPermissions, formatDuration, ModerationPermissions, resolveModerationTarget } from "../utils/moderation";

export const mute: Command = {
  data: new SlashCommandBuilder()
    .setName("mute").setDescription("Silencia um usuário temporariamente")
    .addUserOption((o) => o.setName("membro").setDescription("Usuário para silenciar (menção)").setRequired(false))
    .addStringOption((o) => o.setName("id").setDescription("ID do usuario para silenciar").setRequired(false))
    .addIntegerOption((o) => o.setName("duracao").setDescription("Duração em minutos").setMinValue(1).setMaxValue(40320).setRequired(false))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do silenciamento").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, ModerationPermissions.mute);
    if (permissionError) { await interaction.reply(containerReplyOrganized([`${permissionError}`], { ephemeral: true })); return; }
    const target = await resolveModerationTarget(interaction, true);
    if ("error" in target) { await interaction.reply(containerReplyOrganized([`${target.error}`], { ephemeral: true })); return; }
    const hierarchyError = checkModerationHierarchy(interaction, target.member!);
    if (hierarchyError) { await interaction.reply(containerReplyOrganized([`${hierarchyError}`], { ephemeral: true })); return; }
    const durationMinutes = interaction.options.getInteger("duracao") ?? 60;
    const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
    await target.member!.timeout(durationMinutes * 60 * 1000, `${interaction.user.tag}: ${reason}`);
    await interaction.reply(
      containerReplyList(`MUTE — Silenciamento aplicado`, [
        { label: `Usuario`, items: [target.tag, `ID: ${target.userId}`] },
        {
          label: `Detalhes`,
          items: [
            `Duração: ${formatDuration(durationMinutes)}`,
            `Motivo: ${reason}`,
            `Moderador: ${interaction.user.tag}`,
          ],
        },
      ])
    );
    await sendLog(interaction.guild!, "mute", [
      [
        `**Silenciamento aplicado**`,
        `**Usuario:** <@${target.userId}>`,
        `**ID:** ${target.userId}`,
        `**Duracao:** ${formatDuration(durationMinutes)}`,
        `**Motivo:** ${reason}`,
        `**Moderador:** <@${interaction.user.id}>`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
