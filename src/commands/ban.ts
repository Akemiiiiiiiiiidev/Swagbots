import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerMessageList, containerReplyList, containerReplyOrganized } from "../utils/container";
import { sendLog } from "../utils/logs";
import {
  checkModerationHierarchy,
  checkModeratorPermissions,
  ModerationPermissions,
  resolveModerationTarget,
} from "../utils/moderation";
import { isAntibanProtected, getAntibanRoleId } from "../utils/antiban";

async function sendBanDm(
  interaction: Parameters<Command["execute"]>[0],
  target: { userId: string; tag: string },
  reason: string
) {
  const guild = interaction.guild!;
  const user =
    interaction.options.getUser("membro") ??
    (await interaction.client.users.fetch(target.userId).catch(() => null));
  if (!user) return false;
  try {
    await user.send(
      containerMessageList(`Banimento`, [
        { label: `Servidor`, items: [guild.name] },
        { label: `Detalhes`, items: [`Motivo: ${reason}`, `Moderador: ${interaction.user.tag}`] },
      ])
    );
    return true;
  } catch {
    return false;
  }
}

export const ban: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um usuário do servidor")
    .addUserOption((o) => o.setName("membro").setDescription("Usuário para banir (menção)").setRequired(false))
    .addStringOption((o) => o.setName("id").setDescription("ID do usuario para banir").setRequired(false))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do banimento").setRequired(false)),

  async execute(interaction) {
    const permissionError = checkModeratorPermissions(interaction, ModerationPermissions.ban);
    if (permissionError) {
      await interaction.reply(containerReplyOrganized([`${permissionError}`], { ephemeral: true }));
      return;
    }
    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) {
      await interaction.reply(containerReplyOrganized([`${target.error}`], { ephemeral: true }));
      return;
    }
    if (target.userId === interaction.user.id) {
      await interaction.reply(containerReplyOrganized([`Você não pode banir a si mesmo.`], { ephemeral: true }));
      return;
    }
    if (target.member) {
      const hierarchyError = checkModerationHierarchy(interaction, target.member);
      if (hierarchyError) {
        await interaction.reply(containerReplyOrganized([`${hierarchyError}`], { ephemeral: true }));
        return;
      }
      if (isAntibanProtected(target.member)) {
        const antibanRoleId = getAntibanRoleId(target.member.guild.id);
        await interaction.reply(
          containerReplyList("🛡️ ANTIBAN — Banimento negado", [
            { label: `Usuario`, items: [`<@${target.userId}>`] },
            {
              label: `Detalhes`,
              items: [
                ...(antibanRoleId ? [`Cargo protegido: <@&${antibanRoleId}>`] : []),
                "Este usuario possui o cargo antiban e nao pode ser banido.",
              ],
            },
          ], { ephemeral: true })
        );
        return;
      }
    }
    const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
    const dmSent = await sendBanDm(interaction, target, reason);
    await interaction.guild!.members.ban(target.userId, { reason: `${interaction.user.tag}: ${reason}` });
    await interaction.reply(
      containerReplyList(`BAN — Banimento aplicado`, [
        { label: `Usuario`, items: [`${target.tag}`, `ID: ${target.userId}`] },
        {
          label: `Detalhes`,
          items: [
            `Motivo: ${reason}`,
            `Moderador: ${interaction.user.tag}`,
            `Aviso no privado: ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
          ],
        },
      ])
    );
    await sendLog(interaction.guild!, "ban", [
      [
        `**Banimento aplicado**`,
        `**Usuario:** <@${target.userId}>`,
        `**ID:** ${target.userId}`,
        `**Motivo:** ${reason}`,
        `**Moderador:** <@${interaction.user.id}>`,
        `**Aviso no privado:** ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
