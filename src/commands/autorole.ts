import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import {
  assignAutoRole,
  clearAutoRole,
  getAutoRoleId,
  initAutoRole,
  setAutoRole,
} from "../utils/autoRole";
import { containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator, fetchGuildMember } from "../utils/moderation";

export const autorole: Command = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configura o cargo automatico ao entrar no servidor")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Define o cargo automatico")
        .addRoleOption((option) =>
          option.setName("cargo").setDescription("Cargo para novos membros <:xxx:1514705761413107732>").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("aplicar")
        .setDescription("Aplica o cargo automatico em um membro")
        .addUserOption((option) =>
          option.setName("membro").setDescription("Membro para receber o cargo").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("ver").setDescription("Mostra o cargo automatico configurado")
    )
    .addSubcommand((sub) =>
      sub.setName("remover").setDescription("Remove a configuracao do cargo automatico")
    ),

  async execute(interaction) {
    initAutoRole();
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "ver") {
      const roleId = getAutoRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} Nenhum cargo automatico configurado.`, `${E} Use /autorole setup para definir um cargo.`],
            { ephemeral: true }
          )
        );
        return;
      }
      await interaction.reply(
        containerReplyOrganized([
          "# **AUTOROLE**",
          [`${V} **Cargo configurado**`, `${E} **Cargo:** <@&${roleId}>`].join("\n"),
        ])
      );
      return;
    }

    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
      return;
    }

    if (subcommand === "setup") {
      const role = interaction.options.getRole("cargo", true);
      if (role.managed) {
        await interaction.reply(
          containerReplyOrganized([`${E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true })
        );
        return;
      }
      setAutoRole(guild.id, role.id);
      await interaction.reply(
        containerReplyOrganized([
          "# **AUTOROLE**",
          [
            `${V} **Cargo configurado**`,
            `${E} **Cargo:** <@&${role.id}>`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          `${E} Novos membros <:xxx:1514705761413107732> receberao este cargo ao entrar no servidor.`,
        ])
      );
      return;
    }

    if (subcommand === "remover") {
      clearAutoRole(guild.id);
      await interaction.reply(
        containerReplyOrganized([
          "# **AUTOROLE**",
          [
            `${V} **Configuracao removida**`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          `${E} Novos membros <:xxx:1514705761413107732> nao receberao mais cargo automatico.`,
        ])
      );
      return;
    }

    if (subcommand === "aplicar") {
      const roleId = getAutoRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} Nenhum cargo automatico configurado.`, `${E} Use /autorole setup antes de aplicar manualmente.`],
            { ephemeral: true }
          )
        );
        return;
      }
      const targetUser = interaction.options.getUser("membro", true);
      const member = await fetchGuildMember(guild, targetUser.id);
      if (!member) {
        await interaction.reply(
          containerReplyOrganized([`${E} Este membro nao esta no servidor.`], { ephemeral: true })
        );
        return;
      }
      const result = await assignAutoRole(member);
      if (!result.success) {
        await interaction.reply(containerReplyOrganized([`${E} ${result.error}`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyOrganized([
          "# **AUTOROLE**",
          [
            `${V} **Cargo aplicado**`,
            `${E} **Membro:** <@${member.id}>`,
            `${E} **Cargo:** <@&${result.role.id}>`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
        ])
      );
    }
  },
};
