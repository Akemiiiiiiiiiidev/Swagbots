import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { isRoleProtectionEnabled, setRoleProtection } from "../utils/roleProtection";

export const cargo: Command = {
  data: new SlashCommandBuilder()
    .setName("cargo")
    .setDescription("Configuracoes de protecao de cargos")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Ativa ou desativa a protecao de cargos")
        .addBooleanOption((opt) =>
          opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${adminError}`], { ephemeral: true }));
      return;
    }
    const ativar = interaction.options.getBoolean("ativar", true);
    const current = isRoleProtectionEnabled(guild.id);
    if (ativar === current) {
      await interaction.reply(
        containerReplyOrganized(
          ["# **PROTECAO DE CARGOS**", `A protecao ja esta **${current ? "ativada" : "desativada"}**.`],
          { ephemeral: true }
        )
      );
      return;
    }
    setRoleProtection(guild.id, ativar);
    await interaction.reply(
      containerReplyOrganized(
        [
          "# **PROTECAO DE CARGOS**",
          [
            `**Status:** ${ativar ? "Ativada" : "Desativada"}`,
            `**Configurado por:** <@${interaction.user.id}>`,
            "",
            ativar
              ? `Apenas administradores podem alterar ou deletar cargos.\nInfratores terao todos os seus cargos removidos automaticamente.`
              : `A protecao foi desativada. Qualquer membro com permissao pode alterar cargos.`,
          ].join("\n"),
        ],
        { ephemeral: true }
      )
    );
  },
};
