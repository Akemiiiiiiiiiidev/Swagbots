import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { isProtectionEnabled, setProtection } from "../utils/protection";

export const protecao: Command = {
  data: new SlashCommandBuilder()
    .setName("protecao")
    .setDescription("Gerencia os sistemas de protecao do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("anti-link")
        .setDescription("Ativa ou desativa o bloqueio automatico de links")
        .addBooleanOption((opt) =>
          opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("canais")
        .setDescription("Ativa ou desativa a protecao de canais, calls e categorias")
        .addBooleanOption((opt) =>
          opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Mostra o status atual de todos os sistemas")
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${adminError}`], { ephemeral: true }));
      return;
    }

    const sub = interaction.options.getSubcommand();

    //  STATUS 
    if (sub === "status") {
      const antiLink       = isProtectionEnabled(guild.id, "anti_link");
      const channelProt    = isProtectionEnabled(guild.id, "channel_protection");

      await interaction.reply(
        containerReplyOrganized([
          "# **PROTECAO**",
          [
            `${antiLink    ? V : E} **Anti-link:** ${antiLink    ? "Ativado" : "Desativado"}`,
            `${channelProt ? V : E} **Canais/Calls/Categorias:** ${channelProt ? "Ativado" : "Desativado"}`,
          ].join("\n"),
          `Use os subcomandos para ativar ou desativar cada sistema.`,
        ])
      );
      return;
    }

    //  ANTI-LINK 
    if (sub === "anti-link") {
      const ativar  = interaction.options.getBoolean("ativar", true);
      const current = isProtectionEnabled(guild.id, "anti_link");

      if (ativar === current) {
        await interaction.reply(
          containerReplyOrganized(
            [`O anti-link ja esta **${current ? "ativado" : "desativado"}**.`],
            { ephemeral: true }
          )
        );
        return;
      }

      setProtection(guild.id, "anti_link", ativar);

      await interaction.reply(
        containerReplyOrganized([
          "# **PROTECAO  Anti-link**",
          [
            `${ativar ? V : E} **Status:** ${ativar ? "Ativado" : "Desativado"}`,
            `**Administrador:** <@${interaction.user.id}>`,
            "",
            ativar
              ? `Links enviados por nao-admins serao deletados automaticamente.`
              : `Links poderao ser enviados livremente.`,
          ].join("\n"),
        ])
      );
      return;
    }

    //  CANAIS 
    if (sub === "canais") {
      const ativar  = interaction.options.getBoolean("ativar", true);
      const current = isProtectionEnabled(guild.id, "channel_protection");

      if (ativar === current) {
        await interaction.reply(
          containerReplyOrganized(
            [`A protecao de canais ja esta **${current ? "ativada" : "desativada"}**.`],
            { ephemeral: true }
          )
        );
        return;
      }

      setProtection(guild.id, "channel_protection", ativar);

      await interaction.reply(
        containerReplyOrganized([
          "# **PROTECAO  Canais/Calls/Categorias**",
          [
            `${ativar ? V : E} **Status:** ${ativar ? "Ativada" : "Desativada"}`,
            `**Administrador:** <@${interaction.user.id}>`,
            "",
            ativar
              ? `Canais, calls e categorias deletados ou movidos por nao-admins serao revertidos e o executor punido.`
              : `Protecao desativada. Qualquer membro pode alterar canais conforme suas permissoes.`,
          ].join("\n"),
        ])
      );
      return;
    }
  },
};
