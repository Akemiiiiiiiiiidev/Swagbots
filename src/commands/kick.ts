import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReply, E, U, V } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkModerationHierarchy, checkModeratorPermissions, ModerationPermissions, resolveModerationTarget } from "../utils/moderation";

export const kick: Command = {
  data: new SlashCommandBuilder()
    .setName("kick").setDescription("Expulsa um usuário do servidor")
    .addUserOption((o) => o.setName("membro").setDescription("Usuário para expulsar (menção)").setRequired(false))
    .addStringOption((o) => o.setName("id").setDescription("ID do usuario para expulsar").setRequired(false))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo da expulsao").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, ModerationPermissions.kick);
    if (permissionError) { await interaction.reply(containerReply(`${E} ${permissionError}`, { ephemeral: true })); return; }
    const target = await resolveModerationTarget(interaction, true);
    if ("error" in target) { await interaction.reply(containerReply(`${E} ${target.error}`, { ephemeral: true })); return; }
    const hierarchyError = checkModerationHierarchy(interaction, target.member!);
    if (hierarchyError) { await interaction.reply(containerReply(`${E} ${hierarchyError}`, { ephemeral: true })); return; }
    const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
    await target.member!.kick(`${interaction.user.tag}: ${reason}`);
    await interaction.reply(
      containerReply(
        [`${V} **Expulsão aplicada**`, `${U} **Usuario <:xxx:1514705761413107732>:** ${target.tag}`, `${E} **ID:** ${target.userId}`, `${E} **Motivo:** ${reason}`, `${E} **Moderador:** ${interaction.user.tag}`].join("\n")
      )
    );
    await sendLog(interaction.guild!, "ban", [
      [`${V} **Expulsao aplicada**`, `${U} **Usuario <:xxx:1514705761413107732>:** <@${target.userId}>`, `${E} **ID:** ${target.userId}`, `${E} **Motivo:** ${reason}`, `${E} **Moderador:** <@${interaction.user.id}>`, `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
    ]);
  },
};
