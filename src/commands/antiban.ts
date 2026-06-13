import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyList, containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { clearAntiban, getAntibanRoleId, setAntiban } from "../utils/antiban";

export const antiban: Command = {
  data: new SlashCommandBuilder()
    .setName("antiban")
    .setDescription("Configura o cargo de protecao contra banimento")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Define o cargo antiban")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo que protege contra banimento").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra o cargo antiban configurado"))
    .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao do antiban")),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
      return;
    }
    const sub = interaction.options.getSubcommand();

    if (sub === "ver") {
      const roleId = getAntibanRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(containerReplyOrganized(["# **ANTIBAN**", `${E} Nenhum cargo antiban configurado. Use /antiban setup.`], { ephemeral: true }));
        return;
      }
      await interaction.reply(
        containerReplyList(`${V} ANTIBAN — Configuração`, [
          { label: `${E} Cargo protegido`, items: [`<@&${roleId}>`, "Membros com este cargo nao podem ser banidos pelo bot."] },
        ])
      );
      return;
    }

    if (sub === "setup") {
      const role = interaction.options.getRole("cargo", true);
      if (role.managed) {
        await interaction.reply(containerReplyOrganized([`${E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
        return;
      }
      setAntiban(guild.id, role.id);
      await interaction.reply(
        containerReplyList(`${V} ANTIBAN — Cargo configurado`, [
          { label: `${E} Cargo`, items: [`<@&${role.id}>`] },
          { label: `${E} Detalhes`, items: [`Configurado por: <@${interaction.user.id}>`, "Membros com este cargo nao poderao ser banidos pelo bot."] },
        ])
      );
      return;
    }

    if (sub === "remover") {
      if (!getAntibanRoleId(guild.id)) {
        await interaction.reply(containerReplyOrganized([`${E} Nenhum cargo antiban configurado.`], { ephemeral: true }));
        return;
      }
      clearAntiban(guild.id);
      await interaction.reply(
        containerReplyList(`${V} ANTIBAN — Desativado`, [
          { label: `${E} Detalhes`, items: [`Removido por: <@${interaction.user.id}>`, "O sistema de antiban foi desativado."] },
        ])
      );
    }
  },
};
