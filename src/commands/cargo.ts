import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E, V } from "../utils/container";
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
      await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
      return;
    }
    const ativar = interaction.options.getBoolean("ativar", true);
    const current = isRoleProtectionEnabled(guild.id);
    if (ativar === current) {
      await interaction.reply(
        containerReplyOrganized(
          ["# **PROTECAO DE CARGOS**", `${E} A protecao ja esta **${current ? "ativada" : "desativada"}**.`],
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
            `${V} **Status:** ${ativar ? "Ativada" : "Desativada"}`,
            `${E} **Configurado por:** <@${interaction.user.id}>`,
            "",
            ativar
              ? `${E} Apenas administradores podem alterar ou deletar cargos.\n${E} Infratores terao todos os seus cargos removidos automaticamente.`
              : `${E} A protecao foi desativada. Qualquer membro com permissao pode alterar cargos.`,
          ].join("\n"),
        ],
        { ephemeral: true }
      )
    );
  },
};
