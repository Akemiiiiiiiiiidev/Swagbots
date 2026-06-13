import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { assignAutoRole, clearAutoRole, getAutoRoleId, initAutoRole, setAutoRole } from "../utils/autoRole";
import { containerReplyList, containerReplyOrganized } from "../utils/container";
import { checkAdministrator, fetchGuildMember } from "../utils/moderation";

export const autorole: Command = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configura o cargo automatico ao entrar no servidor")
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Define o cargo automatico")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo para novos membros").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("aplicar").setDescription("Aplica o cargo automatico em um membro")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro para receber o cargo").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra o cargo automatico configurado"))
    .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao do cargo automatico")),

  async execute(interaction) {
    initAutoRole();
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "ver") {
      const roleId = getAutoRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(containerReplyOrganized([`Nenhum cargo automatico configurado. Use /autorole setup.`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyList(`AUTOROLE — Configuração`, [
          { label: `Cargo configurado`, items: [`<@&${roleId}>`] },
        ])
      );
      return;
    }

    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${adminError}`], { ephemeral: true }));
      return;
    }

    if (subcommand === "setup") {
      const role = interaction.options.getRole("cargo", true);
      if (role.managed) {
        await interaction.reply(containerReplyOrganized([`Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
        return;
      }
      setAutoRole(guild.id, role.id);
      await interaction.reply(
        containerReplyList(`AUTOROLE — Cargo configurado`, [
          { label: `Cargo`, items: [`<@&${role.id}>`] },
          { label: `Detalhes`, items: [`Configurado por: <@${interaction.user.id}>`, "Novos membros receberao este cargo ao entrar no servidor."] },
        ])
      );
      return;
    }

    if (subcommand === "remover") {
      clearAutoRole(guild.id);
      await interaction.reply(
        containerReplyList(`AUTOROLE — Removido`, [
          { label: `Detalhes`, items: [`Removido por: <@${interaction.user.id}>`, "Novos membros nao receberao mais cargo automatico."] },
        ])
      );
      return;
    }

    if (subcommand === "aplicar") {
      const roleId = getAutoRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(containerReplyOrganized([`Nenhum cargo automatico configurado. Use /autorole setup antes.`], { ephemeral: true }));
        return;
      }
      const targetUser = interaction.options.getUser("membro", true);
      const member = await fetchGuildMember(guild, targetUser.id);
      if (!member) {
        await interaction.reply(containerReplyOrganized([`Este membro nao esta no servidor.`], { ephemeral: true }));
        return;
      }
      const result = await assignAutoRole(member);
      if (!result.success) {
        await interaction.reply(containerReplyOrganized([`${result.error}`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyList(`AUTOROLE — Cargo aplicado`, [
          { label: `Membro`, items: [`<@${member.id}>`] },
          { label: `Detalhes`, items: [`Cargo: <@&${result.role.id}>`, `Aplicado por: <@${interaction.user.id}>`] },
        ])
      );
    }
  },
};
