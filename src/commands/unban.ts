import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { isBlacklisted, removeFromBlacklist } from "../utils/blacklist";
import { containerReplyList, containerReplyOrganized } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkModeratorPermissions, fetchExecutorMember, isAdministrator, ModerationPermissions, resolveModerationTarget } from "../utils/moderation";

export const unban: Command = {
  data: new SlashCommandBuilder()
    .setName("unban").setDescription("Desbane um usuario do servidor")
    .addUserOption((o) => o.setName("membro").setDescription("Usuario para desbanir").setRequired(false))
    .addStringOption((o) => o.setName("id").setDescription("ID do usuario para desbanir").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, ModerationPermissions.ban);
    if (permissionError) { await interaction.reply(containerReplyOrganized([`${permissionError}`], { ephemeral: true })); return; }
    const guild = interaction.guild!;
    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) { await interaction.reply(containerReplyOrganized([`${target.error}`], { ephemeral: true })); return; }
    const blacklisted = isBlacklisted(guild.id, target.userId);
    if (blacklisted) {
      const executor = await fetchExecutorMember(interaction);
      if (!executor || !isAdministrator(executor)) {
        await interaction.reply(
          containerReplyList("🚫 DESBANIMENTO NEGADO", [
            { label: `Usuario`, items: [`<@${target.userId}>`, `ID: ${target.userId}`] },
            { label: `Motivo`, items: ["Usuario na blacklist.", "Somente administradores podem desbanir este usuario."] },
          ], { ephemeral: true })
        );
        return;
      }
      removeFromBlacklist(guild.id, target.userId);
    }
    await guild.members.unban(target.userId, `${interaction.user.tag}: desbanimento`);
    await interaction.reply(
      containerReplyList(`UNBAN — Usuario desbanido`, [
        { label: `Usuario`, items: [`<@${target.userId}>`, `ID: ${target.userId}`] },
        {
          label: `Detalhes`,
          items: [
            `Moderador: <@${interaction.user.id}>`,
            blacklisted ? "Blacklist: removido automaticamente" : "Blacklist: nao aplicavel",
          ],
        },
      ])
    );
    await sendLog(guild, "ban", [
      [
        `**Desbanimento**`,
        `**Usuario:** <@${target.userId}>`,
        `**ID:** ${target.userId}`,
        `**Moderador:** <@${interaction.user.id}>`,
        blacklisted ? `**Blacklist:** removido automaticamente` : `**Blacklist:** nao aplicavel`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
