import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized } from "../utils/container";
import { fetchGuildMember } from "../utils/moderation";
import { memberHasPdAccess, initPd } from "../utils/pd";
import { buildPdAdminPanel, buildPdUserPanel } from "../events/pdInteractions";

export const pd: Command = {
  noAutoDelete: true,
  data: new SlashCommandBuilder()
    .setName("pd")
    .setDescription("Sistema de Primeira Dama")
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Painel de configuracao do sistema PD (apenas admins)")
    )
    .addSubcommand((sub) =>
      sub
        .setName("painel")
        .setDescription("Abre o painel de Primeira Dama")
    ),

  async execute(interaction) {
    initPd();

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const sub            = interaction.options.getSubcommand();
    const executorMember = await fetchGuildMember(guild, interaction.user.id);
    const isAdmin        = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;

    //  /pd config  apenas admins 
    if (sub === "config") {
      if (!isAdmin) {
        await interaction.reply(
          containerReplyOrganized([`Apenas administradores podem usar este painel.`], { ephemeral: true })
        );
        return;
      }

      const { resource: adminResource } = await interaction.reply({
        components: [buildPdAdminPanel(guild.id)],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
      });

      // Deleta o painel após 5 minutos de inatividade
      const adminMsg = adminResource?.message;
      setTimeout(() => adminMsg?.delete().catch(() => null), 5 * 60 * 1000);
      return;
    }

    //  /pd painel  cargos com acesso ou admins 
    if (sub === "painel") {
      const memberRoleIds = executorMember?.roles.cache.map((r) => r.id) ?? [];
      const hasAccess     = isAdmin || memberHasPdAccess(guild.id, memberRoleIds);

      if (!hasAccess) {
        await interaction.reply(
          containerReplyOrganized([`Voce nao tem permissao para usar este painel.`], { ephemeral: true })
        );
        return;
      }

      const { resource: userResource } = await interaction.reply({
        components: [buildPdUserPanel(guild.id, interaction.user.id)],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
      });

      // Deleta o painel após 5 minutos de inatividade
      const userMsg = userResource?.message;
      setTimeout(() => userMsg?.delete().catch(() => null), 5 * 60 * 1000);
      return;
    }
  },
};
