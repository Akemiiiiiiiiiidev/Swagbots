import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { addToBlacklist, getBlacklistUsers, isBlacklisted, removeFromBlacklist } from "../utils/blacklist";
import { containerReplyList, containerReplyOrganized } from "../utils/container";
import { sendLog } from "../utils/logs";
import { checkAdministrator, resolveModerationTarget } from "../utils/moderation";

export const blacklist: Command = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Gerencia a blacklist do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("adicionar").setDescription("Adiciona um usuario a blacklist e bane")
        .addUserOption((o) => o.setName("membro").setDescription("Usuario para adicionar").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario").setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo da blacklist").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub.setName("remover").setDescription("Remove um usuario da blacklist")
        .addUserOption((o) => o.setName("membro").setDescription("Usuario para remover").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario").setRequired(false))
    )
    .addSubcommand((sub) => sub.setName("lista").setDescription("Lista usuarios na blacklist")),

  async execute(interaction) {
    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${adminError}`], { ephemeral: true }));
      return;
    }
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "lista") {
      const users = getBlacklistUsers(guild.id);
      if (users.length === 0) {
        await interaction.reply(containerReplyOrganized(["# **BLACKLIST**", `Nenhum usuario na blacklist.`]));
        return;
      }
      await interaction.reply(
        containerReplyList("🚫 BLACKLIST", [
          {
            label: `Total: ${users.length} usuario(s)`,
            items: users.map((entry, i) =>
              `**${i + 1}.** <@${entry.userId}> — ${entry.reason} — por <@${entry.addedBy}> — <t:${Math.floor(entry.addedAt / 1000)}:D>`
            ),
          },
        ])
      );
      return;
    }

    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) {
      await interaction.reply(containerReplyOrganized([`${target.error}`], { ephemeral: true }));
      return;
    }

    if (subcommand === "adicionar") {
      if (isBlacklisted(guild.id, target.userId)) {
        await interaction.reply(containerReplyOrganized([`Este usuario ja esta na blacklist.`], { ephemeral: true }));
        return;
      }
      const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
      addToBlacklist(guild.id, target.userId, reason, interaction.user.id);
      await guild.members.ban(target.userId, { reason: `Blacklist: ${interaction.user.tag}: ${reason}` }).catch(() => null);
      await interaction.reply(
        containerReplyList(`BLACKLIST — Usuario adicionado`, [
          { label: `Usuario`, items: [`<@${target.userId}>`, `ID: ${target.userId}`] },
          {
            label: `Detalhes`,
            items: [
              `Motivo: ${reason}`,
              `Administrador: <@${interaction.user.id}>`,
              "Somente administradores podem desbanir este usuario.",
            ],
          },
        ])
      );
      await sendLog(guild, "ban", [
        [
          `**Blacklist - usuario adicionado**`,
          `**Usuario:** <@${target.userId}>`,
          `**ID:** ${target.userId}`,
          `**Motivo:** ${reason}`,
          `**Administrador:** <@${interaction.user.id}>`,
          `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
      return;
    }

    if (subcommand === "remover") {
      if (!removeFromBlacklist(guild.id, target.userId)) {
        await interaction.reply(containerReplyOrganized([`Este usuario nao esta na blacklist.`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyList(`BLACKLIST — Usuario removido`, [
          { label: `Usuario`, items: [`<@${target.userId}>`, `ID: ${target.userId}`] },
          {
            label: `Detalhes`,
            items: [
              `Administrador: <@${interaction.user.id}>`,
              "O usuario pode ser desbanido normalmente.",
            ],
          },
        ])
      );
      await sendLog(guild, "ban", [
        [
          `**Blacklist - usuario removido**`,
          `**Usuario:** <@${target.userId}>`,
          `**ID:** ${target.userId}`,
          `**Administrador:** <@${interaction.user.id}>`,
          `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
    }
  },
};
