import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { addToBlacklist, getBlacklistUsers, isBlacklisted, removeFromBlacklist } from "../utils/blacklist";
import { containerReplyOrganized, E, U, V } from "../utils/container";
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
    .addSubcommand((sub) => sub.setName("lista").setDescription("Lista <:xxx:1514705761413107732> usuarios na blacklist")),

  async execute(interaction) {
    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
      return;
    }
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "lista") {
      const users = getBlacklistUsers(guild.id);
      if (users.length === 0) {
        await interaction.reply(containerReplyOrganized(["# **BLACKLIST**", `${E} Nenhum <:xxx:1514705761413107732> usuario na blacklist.`]));
        return;
      }
      const list = users
        .map((entry, index) =>
          [
            `${E} **${index + 1}.** <@${entry.userId}>`,
            `${E} **Motivo:** ${entry.reason}`,
            `${E} **Adicionado por:** <@${entry.addedBy}>`,
            `${E} **Data:** <t:${Math.floor(entry.addedAt / 1000)}:F>`,
          ].join("\n")
        )
        .join("\n\n");
      await interaction.reply(
        containerReplyOrganized(["# **BLACKLIST**", `${E} **Total:** ${users.length} <:xxx:1514705761413107732> usuario(s)`, list])
      );
      return;
    }

    const target = await resolveModerationTarget(interaction, false);
    if ("error" in target) {
      await interaction.reply(containerReplyOrganized([`${E} ${target.error}`], { ephemeral: true }));
      return;
    }

    if (subcommand === "adicionar") {
      if (isBlacklisted(guild.id, target.userId)) {
        await interaction.reply(containerReplyOrganized([`${E} Este <:xxx:1514705761413107732> usuario ja esta na blacklist.`], { ephemeral: true }));
        return;
      }
      const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
      addToBlacklist(guild.id, target.userId, reason, interaction.user.id);
      await guild.members.ban(target.userId, { reason: `Blacklist: ${interaction.user.tag}: ${reason}` }).catch(() => null);
      await interaction.reply(
        containerReplyOrganized([
          "# **BLACKLIST**",
          [
            `${V} **<:xxx:1514705761413107732> Usuario adicionado**`,
            `${U} **<:xxx:1514705761413107732> Usuario:** <@${target.userId}>`,
            `${E} **ID:** ${target.userId}`,
            `${E} **Motivo:** ${reason}`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          `${E} Somente administradores podem desbanir este usuario.`,
        ])
      );
      await sendLog(guild, "ban", [
        [
          `${V} **Blacklist - <:xxx:1514705761413107732> usuario adicionado**`,
          `${U} **<:xxx:1514705761413107732> Usuario:** <@${target.userId}>`,
          `${E} **ID:** ${target.userId}`,
          `${E} **Motivo:** ${reason}`,
          `${E} **Administrador:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
      return;
    }

    if (subcommand === "remover") {
      if (!removeFromBlacklist(guild.id, target.userId)) {
        await interaction.reply(containerReplyOrganized([`${E} Este <:xxx:1514705761413107732> usuario nao esta na blacklist.`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyOrganized([
          "# **BLACKLIST**",
          [
            `${V} **<:xxx:1514705761413107732> Usuario removido**`,
            `${U} **<:xxx:1514705761413107732> Usuario:** <@${target.userId}>`,
            `${E} **ID:** ${target.userId}`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          `${E} O usuario pode ser desbanido normalmente.`,
        ])
      );
      await sendLog(guild, "ban", [
        [
          `${V} **Blacklist - <:xxx:1514705761413107732> usuario removido**`,
          `${U} **<:xxx:1514705761413107732> Usuario:** <@${target.userId}>`,
          `${E} **ID:** ${target.userId}`,
          `${E} **Administrador:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
    }
  },
};
