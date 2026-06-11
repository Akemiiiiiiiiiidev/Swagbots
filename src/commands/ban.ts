import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerMessage, containerReply, containerReplyOrganized, E, V } from "../utils/container";
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
      containerMessage([
        [`${E} **Banimento**`, `${E} Você foi banido do servidor **${guild.name}**`].join("\n"),
        [
          `${E} **Servidor:** ${guild.name}`,
          `${E} **Motivo:** ${reason}`,
          `${E} **Moderador:** ${interaction.user.tag}`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
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
      await interaction.reply(containerReply(`${E} ${permissionError}`, { ephemeral: true }));
      return;
    }
    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) {
      await interaction.reply(containerReply(`${E} ${target.error}`, { ephemeral: true }));
      return;
    }
    if (target.userId === interaction.user.id) {
      await interaction.reply(containerReply(`${E} Você não pode banir a si mesmo.`, { ephemeral: true }));
      return;
    }
    if (target.member) {
      const hierarchyError = checkModerationHierarchy(interaction, target.member);
      if (hierarchyError) {
        await interaction.reply(containerReply(`${E} ${hierarchyError}`, { ephemeral: true }));
        return;
      }

      // Verifica proteção antiban
      if (isAntibanProtected(target.member)) {
        const antibanRoleId = getAntibanRoleId(target.member.guild.id);
        await interaction.reply(
          containerReplyOrganized(
            [
              "# **ANTIBAN**",
              [
                `${E} **Banimento negado**`,
                `${E} **Usuario:** <@${target.userId}>`,
                antibanRoleId ? `${E} **Cargo protegido:** <@&${antibanRoleId}>` : "",
                `${E} Este usuario possui o cargo antiban e nao pode ser banido.`,
              ].filter(Boolean).join("\n"),
            ],
            { ephemeral: true }
          )
        );
        return;
      }
    }
    const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
    const dmSent = await sendBanDm(interaction, target, reason);
    await interaction.guild!.members.ban(target.userId, { reason: `${interaction.user.tag}: ${reason}` });
    await interaction.reply(
      containerReply(
        [
          `${V} **Banimento aplicado**`,
          `${E} **Usuario:** ${target.tag}`,
          `${E} **ID:** ${target.userId}`,
          `${E} **Motivo:** ${reason}`,
          `${E} **Moderador:** ${interaction.user.tag}`,
          `${E} **Aviso no privado:** ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
        ].join("\n")
      )
    );
    await sendLog(interaction.guild!, "ban", [
      [
        `${V} **Banimento aplicado**`,
        `${E} **Usuario:** <@${target.userId}>`,
        `${E} **ID:** ${target.userId}`,
        `${E} **Motivo:** ${reason}`,
        `${E} **Moderador:** <@${interaction.user.id}>`,
        `${E} **Aviso no privado:** ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
