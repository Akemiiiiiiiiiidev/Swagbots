import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { isBlacklisted, removeFromBlacklist } from "../utils/blacklist";
import { containerReplyOrganized, E, U, V } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkModeratorPermissions, fetchExecutorMember, isAdministrator, ModerationPermissions, resolveModerationTarget } from "../utils/moderation";

export const unban: Command = {
  data: new SlashCommandBuilder()
    .setName("unban").setDescription("Desbane um usuario do servidor")
    .addUserOption((o) => o.setName("membro").setDescription("Usuario para desbanir").setRequired(false))
    .addStringOption((o) => o.setName("id").setDescription("ID do usuario para desbanir").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, ModerationPermissions.ban);
    if (permissionError) { await interaction.reply(containerReplyOrganized([`${E} ${permissionError}`], { ephemeral: true })); return; }
    const guild = interaction.guild!;
    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) { await interaction.reply(containerReplyOrganized([`${E} ${target.error}`], { ephemeral: true })); return; }
    const blacklisted = isBlacklisted(guild.id, target.userId);
    if (blacklisted) {
      const executor = await fetchExecutorMember(interaction);
      if (!executor || !isAdministrator(executor)) {
        await interaction.reply(
          containerReplyOrganized(
            ["# **DESBANIMENTO NEGADO**", [`${E} **Usuario <:xxx:1514705761413107732> na blacklist**`, `${U} **Usuario <:xxx:1514705761413107732>:** <@${target.userId}>`, `${E} Somente administradores podem desbanir este usuario <:xxx:1514705761413107732>.`].join("\n")],
            { ephemeral: true }
          )
        );
        return;
      }
      removeFromBlacklist(guild.id, target.userId);
    }
    await guild.members.unban(target.userId, `${interaction.user.tag}: desbanimento`);
    await interaction.reply(
      containerReplyOrganized([
        "# **DESBANIMENTO**",
        [
          `${V} **Usuario <:xxx:1514705761413107732> desbanido**`,
          `${U} **Usuario <:xxx:1514705761413107732>:** <@${target.userId}>`,
          `${E} **ID:** ${target.userId}`,
          `${E} **Moderador:** <@${interaction.user.id}>`,
          blacklisted ? `${E} **Blacklist:** removido automaticamente` : `${E} **Blacklist:** nao aplicavel`,
        ].join("\n"),
      ])
    );
    await sendLog(guild, "ban", [
      [
        `${V} **Desbanimento**`,
        `${U} **Usuario <:xxx:1514705761413107732>:** <@${target.userId}>`,
        `${E} **ID:** ${target.userId}`,
        `${E} **Moderador:** <@${interaction.user.id}>`,
        blacklisted ? `${E} **Blacklist:** removido automaticamente` : `${E} **Blacklist:** nao aplicavel`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
